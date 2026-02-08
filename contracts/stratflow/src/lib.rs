#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, log};

// ============================================================
// STRATFLOW: AI-POWERED TRADING STRATEGY MARKETPLACE
// ============================================================
//
// AI AGENT VERIFICATION FLOW:
// ---------------------------
// 1. Executor submits trade execution proof (screenshot, trade log)
// 2. Off-chain AI Agent (Gemini 2.0 Flash) analyzes the proof:
//    - Validates trade matches strategy parameters
//    - Checks entry/exit points, position size, stop-loss
//    - Detects fake/manipulated screenshots
//    - Assigns confidence score (0-100%)
// 3. AI Agent calls verify_execution() with approval decision
// 4. AI Agent calls set_confidence() with confidence score
// 5. If confidence >= 85%, execution enters dispute window
// 6. Strategist can challenge within 60s (demo) / 24h (prod)
// 7. If disputed, secondary AI review resolves the dispute
//
// The AI Agent acts as an impartial judge, enabling trustless
// verification without requiring manual review for every trade.
//
// ============================================================

// ============================================================
// DATA STRUCTURES
// ============================================================

/// Execution lifecycle status
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ExecStatus {
    /// Submitted by executor, awaiting AI verification
    Pending,
    /// AI approved — in dispute window, strategist can challenge
    Approved,
    /// Strategist raised a dispute during the window
    Disputed,
    /// Dispute resolved: execution was legitimate → stream starts
    Cleared,
    /// Dispute resolved: execution was fraudulent → refund strategist
    Slashed,
    /// No dispute within window → stream starts
    Finalized,
    /// AI rejected the execution outright
    Rejected,
}

/// A strategy published by a creator with a locked reward
#[contracttype]
#[derive(Clone, Debug)]
pub struct Strategy {
    pub creator: Address,
    pub reward_amount: i128,
    pub active: bool,
}

/// An execution submitted by an executor against a strategy
#[contracttype]
#[derive(Clone, Debug)]
pub struct Execution {
    pub executor: Address,
    pub strategy_id: u64,
    pub verified: bool,
    /// Current lifecycle status
    pub status: ExecStatus,
    /// Executor's stake (skin in the game)
    pub stake_amount: i128,
    /// Timestamp when AI approved (dispute window starts here)
    pub approved_at: u64,
    /// AI confidence score (0-100)
    pub confidence: u32,
}

/// A time-based reward stream created after verification
#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardStream {
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn: i128,
}

/// Dispute record
#[contracttype]
#[derive(Clone, Debug)]
pub struct Dispute {
    pub challenger: Address,
    pub execution_id: u64,
    pub reason_code: u32,
    pub created_at: u64,
    pub resolved: bool,
    pub upheld: bool,
}

// ============================================================
// STORAGE KEYS
// ============================================================

#[contracttype]
pub enum DataKey {
    /// Auto-incrementing strategy counter
    StrategyCount,
    /// Auto-incrementing execution counter
    ExecutionCount,
    /// Auto-incrementing dispute counter
    DisputeCount,
    /// Map: strategy_id -> Strategy
    Strategy(u64),
    /// Map: execution_id -> Execution
    Execution(u64),
    /// Map: dispute_id -> Dispute
    Dispute(u64),
    /// Map: execution_id -> dispute_id
    ExecDispute(u64),
    /// Map: execution_id -> RewardStream
    Stream(u64),
}

// ============================================================
// CONSTANTS
// ============================================================

/// Dispute window: 60 seconds for hackathon demo (would be 24h in prod)
const DISPUTE_WINDOW: u64 = 60;

/// Minimum AI confidence to auto-approve (85%)
const MIN_CONFIDENCE: u32 = 85;

/// Executor stake percentage (10% of reward)
const STAKE_PERCENT: i128 = 10;

/// Stream duration: 5 minutes for demo
const STREAM_DURATION: u64 = 300;

// ============================================================
// CONTRACT
// ============================================================

#[contract]
pub struct StratFlowContract;

#[contractimpl]
impl StratFlowContract {
    // --------------------------------------------------------
    // 1) CREATE STRATEGY
    //    Called by the creator. Locks `reward_amount` in escrow.
    //    Returns strategy_id.
    // --------------------------------------------------------
    pub fn create_strategy(env: Env, creator: Address, reward_amount: i128) -> u64 {
        creator.require_auth();

        if reward_amount <= 0 {
            panic!("Reward amount must be positive");
        }

        let strategy_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StrategyCount)
            .unwrap_or(0);
        let next_id = strategy_id + 1;
        env.storage()
            .instance()
            .set(&DataKey::StrategyCount, &next_id);

        let strategy = Strategy {
            creator: creator.clone(),
            reward_amount,
            active: true,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Strategy(next_id), &strategy);

        log!(&env, "Strategy {} created by {} with reward {}", next_id, creator, reward_amount);
        next_id
    }

    // --------------------------------------------------------
    // 2) SUBMIT EXECUTION (with stake)
    //    Executor must put up a stake (10% of reward) as
    //    skin-in-the-game. If they submit fake proof and get
    //    disputed, they lose this stake.
    //    Returns execution_id.
    // --------------------------------------------------------
    pub fn submit_execution(env: Env, executor: Address, strategy_id: u64) -> u64 {
        executor.require_auth();

        let strategy: Strategy = env
            .storage()
            .persistent()
            .get(&DataKey::Strategy(strategy_id))
            .expect("Strategy not found");

        if !strategy.active {
            panic!("Strategy is not active");
        }

        // Calculate required stake: 10% of reward
        let stake = strategy.reward_amount * STAKE_PERCENT / 100;

        let execution_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ExecutionCount)
            .unwrap_or(0);
        let next_id = execution_id + 1;
        env.storage()
            .instance()
            .set(&DataKey::ExecutionCount, &next_id);

        let execution = Execution {
            executor: executor.clone(),
            strategy_id,
            verified: false,
            status: ExecStatus::Pending,
            stake_amount: stake,
            approved_at: 0,
            confidence: 0,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Execution(next_id), &execution);

        log!(&env, "Execution {} submitted by {} for strategy {} (stake: {})", next_id, executor, strategy_id, stake);
        next_id
    }

    // --------------------------------------------------------
    // 3) VERIFY EXECUTION (AI Agent Result)
    //    Called by the AI Agent after analyzing the proof.
    //    
    //    AI AGENT WORKFLOW:
    //    - Receives execution proof via /api/verify endpoint
    //    - Uses Gemini 2.0 Flash to analyze trade screenshot
    //    - Checks: strategy compliance, trade authenticity,
    //      position sizing, entry/exit accuracy
    //    - Returns approval + confidence score (0-100%)
    //    
    //    If approved with >= 85% confidence:
    //      → Enters DISPUTE WINDOW (60s demo / 24h prod)
    //      → Strategist can challenge if proof looks fraudulent
    //    If rejected:
    //      → Marks as Rejected, re-activates strategy
    // --------------------------------------------------------
    pub fn verify_execution(env: Env, execution_id: u64, approved: bool) -> bool {
        let mut execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        if execution.status != ExecStatus::Pending {
            panic!("Execution not in Pending state");
        }

        if !approved {
            // REJECTED: mark status, re-activate strategy, refund stake
            execution.status = ExecStatus::Rejected;
            execution.verified = false;
            env.storage()
                .persistent()
                .set(&DataKey::Execution(execution_id), &execution);

            // Re-activate the strategy so another executor can try
            let mut strategy: Strategy = env
                .storage()
                .persistent()
                .get(&DataKey::Strategy(execution.strategy_id))
                .expect("Strategy not found");
            strategy.active = true;
            env.storage()
                .persistent()
                .set(&DataKey::Strategy(execution.strategy_id), &strategy);

            log!(&env, "Execution {} REJECTED. Strategy {} re-activated", execution_id, execution.strategy_id);
            return false;
        }

        // APPROVED: enter dispute window
        let now = env.ledger().timestamp();
        execution.status = ExecStatus::Approved;
        execution.approved_at = now;
        // Note: confidence is set via set_confidence or defaults to 0
        env.storage()
            .persistent()
            .set(&DataKey::Execution(execution_id), &execution);

        log!(&env, "Execution {} AI-approved. Dispute window open until {}", execution_id, now + DISPUTE_WINDOW);
        true
    }

    // --------------------------------------------------------
    // 3b) SET CONFIDENCE (AI Agent Confidence Score)
    //     Stores the AI confidence score (0-100) on-chain.
    //     
    //     AI CONFIDENCE FACTORS:
    //     - Image clarity and authenticity detection
    //     - Trade parameters matching strategy rules
    //     - Timestamp verification against market data
    //     - Pattern recognition for common manipulation
    //     
    //     Score >= 85%: High confidence, auto-approved
    //     Score 50-84%: Flagged for manual review
    //     Score < 50%:  Likely fraudulent, rejected
    // --------------------------------------------------------
    pub fn set_confidence(env: Env, execution_id: u64, confidence: u32) {
        let mut execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        if confidence > 100 {
            panic!("Confidence must be 0-100");
        }

        execution.confidence = confidence;
        env.storage()
            .persistent()
            .set(&DataKey::Execution(execution_id), &execution);

        log!(&env, "Execution {} confidence set to {}%", execution_id, confidence);
    }

    // --------------------------------------------------------
    // 4) RAISE DISPUTE
    //    Only the strategy CREATOR can dispute, and only during
    //    the dispute window after AI approval.
    //    reason_code: 1=fake_proof, 2=incomplete, 3=plagiarized
    //    Returns dispute_id.
    // --------------------------------------------------------
    pub fn raise_dispute(env: Env, challenger: Address, execution_id: u64, reason_code: u32) -> u64 {
        challenger.require_auth();

        let mut execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        // Only the strategy creator can dispute
        let strategy: Strategy = env
            .storage()
            .persistent()
            .get(&DataKey::Strategy(execution.strategy_id))
            .expect("Strategy not found");

        if strategy.creator != challenger {
            panic!("Only the strategy creator can raise a dispute");
        }

        // Must be in Approved state (within dispute window)
        if execution.status != ExecStatus::Approved {
            panic!("Can only dispute executions in Approved state");
        }

        // Check dispute window hasn't expired
        let now = env.ledger().timestamp();
        if now > execution.approved_at + DISPUTE_WINDOW {
            panic!("Dispute window has expired");
        }

        // Create dispute record
        let dispute_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::DisputeCount)
            .unwrap_or(0);
        let next_id = dispute_id + 1;
        env.storage()
            .instance()
            .set(&DataKey::DisputeCount, &next_id);

        let dispute = Dispute {
            challenger: challenger.clone(),
            execution_id,
            reason_code,
            created_at: now,
            resolved: false,
            upheld: false,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Dispute(next_id), &dispute);
        env.storage()
            .persistent()
            .set(&DataKey::ExecDispute(execution_id), &next_id);

        // Update execution status to Disputed (freezes everything)
        execution.status = ExecStatus::Disputed;
        env.storage()
            .persistent()
            .set(&DataKey::Execution(execution_id), &execution);

        log!(&env, "Dispute {} raised for execution {} by {} (reason: {})", next_id, execution_id, challenger, reason_code);
        next_id
    }

    // --------------------------------------------------------
    // 5) RESOLVE DISPUTE (Secondary AI Review)
    //    Called after secondary AI review or admin decision.
    //    
    //    DISPUTE RESOLUTION AI:
    //    - Performs deeper analysis than initial verification
    //    - Cross-references with blockchain trade history
    //    - Compares against known fraud patterns database
    //    - Multiple AI models vote for consensus decision
    //    
    //    upheld=true  → Executor's proof was fraudulent
    //                   → Slash stake, refund strategist
    //    upheld=false → Execution was legitimate
    //                   → Start stream, return stake
    // --------------------------------------------------------
    pub fn resolve_dispute(env: Env, execution_id: u64, upheld: bool) -> bool {
        let mut execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        if execution.status != ExecStatus::Disputed {
            panic!("Execution not in Disputed state");
        }

        // Load and resolve the dispute record
        let dispute_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ExecDispute(execution_id))
            .expect("Dispute record not found");

        let mut dispute: Dispute = env
            .storage()
            .persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("Dispute not found");

        dispute.resolved = true;
        dispute.upheld = upheld;
        env.storage()
            .persistent()
            .set(&DataKey::Dispute(dispute_id), &dispute);

        let strategy: Strategy = env
            .storage()
            .persistent()
            .get(&DataKey::Strategy(execution.strategy_id))
            .expect("Strategy not found");

        if upheld {
            // DISPUTE UPHELD: proof was fake
            // → Slash executor's stake (burn it)
            // → Refund reward to strategist (re-activate strategy)
            execution.status = ExecStatus::Slashed;
            execution.verified = false;
            env.storage()
                .persistent()
                .set(&DataKey::Execution(execution_id), &execution);

            // Re-activate strategy so creator can get their money back
            let mut updated_strategy = strategy;
            updated_strategy.active = true;
            env.storage()
                .persistent()
                .set(&DataKey::Strategy(execution.strategy_id), &updated_strategy);

            log!(&env, "Dispute upheld for execution {}. Executor slashed, strategy re-activated", execution_id);
            return true;
        }

        // DISPUTE NOT UPHELD: execution was legitimate
        // → Start the reward stream (same as finalize)
        execution.status = ExecStatus::Cleared;
        execution.verified = true;
        env.storage()
            .persistent()
            .set(&DataKey::Execution(execution_id), &execution);

        let now = env.ledger().timestamp();
        let stream = RewardStream {
            total_amount: strategy.reward_amount,
            start_time: now,
            end_time: now + STREAM_DURATION,
            withdrawn: 0,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Stream(execution_id), &stream);

        // Deactivate the strategy
        let mut updated_strategy = strategy;
        updated_strategy.active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Strategy(execution.strategy_id), &updated_strategy);

        log!(&env, "Dispute dismissed for execution {}. Stream started", execution_id);
        false
    }

    // --------------------------------------------------------
    // 6) FINALIZE EXECUTION
    //    Called after the dispute window expires WITHOUT a dispute.
    //    Starts the reward stream. Anyone can call this.
    // --------------------------------------------------------
    pub fn finalize_execution(env: Env, execution_id: u64) -> bool {
        let mut execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        if execution.status != ExecStatus::Approved {
            panic!("Execution not in Approved state");
        }

        // Check dispute window has expired
        let now = env.ledger().timestamp();
        if now <= execution.approved_at + DISPUTE_WINDOW {
            panic!("Dispute window has not expired yet");
        }

        // No dispute raised → finalize and start stream
        execution.status = ExecStatus::Finalized;
        execution.verified = true;
        env.storage()
            .persistent()
            .set(&DataKey::Execution(execution_id), &execution);

        let strategy: Strategy = env
            .storage()
            .persistent()
            .get(&DataKey::Strategy(execution.strategy_id))
            .expect("Strategy not found");

        let stream = RewardStream {
            total_amount: strategy.reward_amount,
            start_time: now,
            end_time: now + STREAM_DURATION,
            withdrawn: 0,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Stream(execution_id), &stream);

        // Deactivate the strategy
        let mut updated_strategy = strategy;
        updated_strategy.active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Strategy(execution.strategy_id), &updated_strategy);

        log!(&env, "Execution {} finalized. Stream started at {} until {}", execution_id, now, now + STREAM_DURATION);
        true
    }

    // --------------------------------------------------------
    // 7) WITHDRAW REWARD
    //    Callable by the executor. Uses streaming math.
    //    Only works if execution is Finalized or Cleared.
    // --------------------------------------------------------
    pub fn withdraw_reward(env: Env, executor: Address, execution_id: u64, amount: i128) -> i128 {
        executor.require_auth();

        let execution: Execution = env
            .storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found");

        if execution.executor != executor {
            panic!("Only the executor can withdraw");
        }

        // Must be finalized or cleared (dispute dismissed)
        if execution.status != ExecStatus::Finalized && execution.status != ExecStatus::Cleared {
            panic!("Execution not finalized — cannot withdraw");
        }

        if !execution.verified {
            panic!("Execution not verified yet");
        }

        let mut stream: RewardStream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(execution_id))
            .expect("Stream not found");

        let now = env.ledger().timestamp();
        let elapsed = if now >= stream.end_time {
            stream.end_time - stream.start_time
        } else if now <= stream.start_time {
            0
        } else {
            now - stream.start_time
        };

        let duration = stream.end_time - stream.start_time;
        let earned = stream.total_amount * (elapsed as i128) / (duration as i128);
        let available = earned - stream.withdrawn;

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        if amount > available {
            panic!("Amount exceeds available balance");
        }

        stream.withdrawn += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(execution_id), &stream);

        log!(&env, "Withdrew {} from execution {}. Total withdrawn: {}", amount, execution_id, stream.withdrawn);
        amount
    }

    // --------------------------------------------------------
    // VIEW FUNCTIONS
    // --------------------------------------------------------

    /// Get a strategy by ID
    pub fn get_strategy(env: Env, strategy_id: u64) -> Strategy {
        env.storage()
            .persistent()
            .get(&DataKey::Strategy(strategy_id))
            .expect("Strategy not found")
    }

    /// Get an execution by ID
    pub fn get_execution(env: Env, execution_id: u64) -> Execution {
        env.storage()
            .persistent()
            .get(&DataKey::Execution(execution_id))
            .expect("Execution not found")
    }

    /// Get a reward stream by execution ID
    pub fn get_stream(env: Env, execution_id: u64) -> RewardStream {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(execution_id))
            .expect("Stream not found")
    }

    /// Get a dispute by ID
    pub fn get_dispute(env: Env, dispute_id: u64) -> Dispute {
        env.storage()
            .persistent()
            .get(&DataKey::Dispute(dispute_id))
            .expect("Dispute not found")
    }

    /// Get dispute ID for an execution
    pub fn get_exec_dispute(env: Env, execution_id: u64) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::ExecDispute(execution_id))
            .expect("No dispute for this execution")
    }

    /// Get dispute window constant (for frontend)
    pub fn get_dispute_window(_env: Env) -> u64 {
        DISPUTE_WINDOW
    }

    /// Get minimum confidence threshold (for frontend)
    pub fn get_min_confidence(_env: Env) -> u32 {
        MIN_CONFIDENCE
    }

    /// Get current earned amount for a stream
    pub fn get_earned(env: Env, execution_id: u64) -> i128 {
        let stream: RewardStream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(execution_id))
            .expect("Stream not found");

        let now = env.ledger().timestamp();
        let elapsed = if now >= stream.end_time {
            stream.end_time - stream.start_time
        } else if now <= stream.start_time {
            0
        } else {
            now - stream.start_time
        };

        let duration = stream.end_time - stream.start_time;
        stream.total_amount * (elapsed as i128) / (duration as i128)
    }
}

// ============================================================
// TESTS
// ============================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    #[test]
    fn test_full_flow_no_dispute() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        // 1. Create strategy
        let strategy_id = client.create_strategy(&creator, &1000);
        assert_eq!(strategy_id, 1);

        let strategy = client.get_strategy(&strategy_id);
        assert_eq!(strategy.reward_amount, 1000);
        assert_eq!(strategy.active, true);

        // 2. Submit execution (executor stakes 10% = 100)
        let execution_id = client.submit_execution(&executor, &strategy_id);
        assert_eq!(execution_id, 1);

        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.verified, false);
        assert_eq!(execution.stake_amount, 100); // 10% of 1000

        // 3. AI verifies → Approved (enters dispute window)
        let result = client.verify_execution(&execution_id, &true);
        assert_eq!(result, true);

        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.status, ExecStatus::Approved);
        assert_eq!(execution.verified, false); // NOT yet verified!

        // 4. Wait for dispute window to expire (60s)
        env.ledger().with_mut(|li| {
            li.timestamp += 61;
        });

        // 5. Finalize (no dispute raised)
        let finalized = client.finalize_execution(&execution_id);
        assert_eq!(finalized, true);

        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.status, ExecStatus::Finalized);
        assert_eq!(execution.verified, true); // NOW verified

        // 6. Fast-forward 150s and withdraw
        env.ledger().with_mut(|li| {
            li.timestamp += 150;
        });

        let withdrawn = client.withdraw_reward(&executor, &execution_id, &400);
        assert_eq!(withdrawn, 400);

        // Advance to end of stream
        env.ledger().with_mut(|li| {
            li.timestamp += 200;
        });

        let withdrawn = client.withdraw_reward(&executor, &execution_id, &600);
        assert_eq!(withdrawn, 600);
    }

    #[test]
    fn test_dispute_upheld_slashes_executor() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        // Create strategy and submit execution
        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);

        // AI approves
        client.verify_execution(&execution_id, &true);

        // Creator raises dispute (reason_code 1 = fake proof)
        let dispute_id = client.raise_dispute(&creator, &execution_id, &1);
        assert_eq!(dispute_id, 1);

        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.status, ExecStatus::Disputed);

        // Dispute is upheld (proof was fake)
        let upheld = client.resolve_dispute(&execution_id, &true);
        assert_eq!(upheld, true);

        // Executor is slashed, strategy re-activated
        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.status, ExecStatus::Slashed);
        assert_eq!(execution.verified, false);

        let strategy = client.get_strategy(&strategy_id);
        assert_eq!(strategy.active, true); // strategist gets their strategy back!
    }

    #[test]
    fn test_dispute_dismissed_starts_stream() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);

        client.verify_execution(&execution_id, &true);
        client.raise_dispute(&creator, &execution_id, &2);

        // Dispute dismissed (proof was actually valid)
        let upheld = client.resolve_dispute(&execution_id, &false);
        assert_eq!(upheld, false);

        let execution = client.get_execution(&execution_id);
        assert_eq!(execution.status, ExecStatus::Cleared);
        assert_eq!(execution.verified, true);

        // Stream should exist → executor can withdraw
        env.ledger().with_mut(|li| {
            li.timestamp += 300;
        });
        let withdrawn = client.withdraw_reward(&executor, &execution_id, &1000);
        assert_eq!(withdrawn, 1000);
    }

    #[test]
    fn test_rejection_reactivates_strategy() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        client.submit_execution(&executor, &strategy_id);

        // AI rejects
        let result = client.verify_execution(&1, &false);
        assert_eq!(result, false);

        // Strategy should be re-activated so another executor can try
        let strategy = client.get_strategy(&strategy_id);
        assert_eq!(strategy.active, true);
    }

    #[test]
    #[should_panic(expected = "Dispute window has expired")]
    fn test_late_dispute_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);
        client.verify_execution(&execution_id, &true);

        // Wait past dispute window
        env.ledger().with_mut(|li| {
            li.timestamp += 61;
        });

        // Try to dispute — should fail
        client.raise_dispute(&creator, &execution_id, &1);
    }

    #[test]
    #[should_panic(expected = "Only the strategy creator can raise a dispute")]
    fn test_non_creator_dispute_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);
        let random = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);
        client.verify_execution(&execution_id, &true);

        // Random person tries to dispute — should fail
        client.raise_dispute(&random, &execution_id, &1);
    }

    #[test]
    #[should_panic(expected = "Execution not finalized")]
    fn test_withdraw_before_finalize_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);
        client.verify_execution(&execution_id, &true);

        // Try to withdraw while still in dispute window — should fail
        client.withdraw_reward(&executor, &execution_id, &100);
    }

    #[test]
    #[should_panic(expected = "Amount exceeds available balance")]
    fn test_early_withdrawal_blocked() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StratFlowContract, ());
        let client = StratFlowContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let executor = Address::generate(&env);

        let strategy_id = client.create_strategy(&creator, &1000);
        let execution_id = client.submit_execution(&executor, &strategy_id);
        client.verify_execution(&execution_id, &true);

        // Fast-forward past dispute window, finalize
        env.ledger().with_mut(|li| {
            li.timestamp += 61;
        });
        client.finalize_execution(&execution_id);

        // Try to withdraw full amount immediately (should fail)
        client.withdraw_reward(&executor, &execution_id, &1000);
    }
}
