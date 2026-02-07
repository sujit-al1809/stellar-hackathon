# StratFlow End-to-End Test Flow

**Test the complete stake + profit share model**

---

## Prerequisites

- Freighter wallet installed and configured
- Test XLM in wallet (get from Stellar testnet faucet)
- Frontend running on http://localhost:3000
- Backend running (if using real Soroban contracts)

---

## Test Flow 1: Profitable Trader (Happy Path)

### Step 1: Expert Publishes Strategy

1. Navigate to `/app/create`
2. Fill in form:
   - **Title:** "Bitcoin Scalping - RSI Strategy"
   - **Description:** "Day trading BTC using RSI indicators for entry/exit"
   - **Rules:**
     - Rule 1: "Buy when RSI < 30 on 5-minute chart"
     - Rule 2: "Sell when RSI > 70 or 2% stop loss"
     - Rule 3: "Maximum 5% position size per trade"
   - **Stake Requirement:** 50 XLM
   - **Profit Share:** 20%
3. Click "Publish Strategy"
4. Sign transaction in Freighter
5. **Note the Strategy ID** (e.g., #1)

**Expected Result:**
- Strategy published successfully
- Shows: "Stake: 50 XLM (refundable) • Profit share: 20%"
- Strategy visible in marketplace

---

### Step 2: Trader Stakes and Executes

1. Navigate to `/app/execute`
2. Enter Strategy ID: `1`
3. Verify strategy details loaded:
   - Shows stake requirement: 50 XLM
   - Shows profit split: Expert 20%, Trader 80%
4. Fill in execution proof:
   - **Title:** "Week 1 BTC Scalping Results"
   - **P&L Summary:**
     ```
     Starting capital: $10,000
     Completed 15 trades following RSI<30 entry, RSI>70 exit rules
     Final balance: $12,000
     Total P&L: +$2,000 (+20%)
     Average trade: 5 BTC at $65,432
     ```
   - **Proof Evidence:**
     - Evidence 1: `https://i.imgur.com/example-pl-screenshot.png`
     - Evidence 2: `Stellar TX: GD7XYZ123ABC (on-chain trade)`
     - Evidence 3: `Trade entry: bought BTC at $65,400 at 10:30 AM EST`
5. Click "Submit P&L Proof for Verification"
6. Sign transaction
7. **Note the Execution ID** (e.g., #1)

**Expected Result:**
- Proof submitted successfully
- Shows next steps: "AI + Oracle will verify"
- Link to verification page

---

### Step 3: Verify P&L Proof

1. Navigate to `/app/verify?executionId=1`
2. Review displayed proof and strategy rules
3. Click "Run AI Verification"
4. Wait for AI response (~5-10 seconds)
5. Review verdict:
   - Should show "APPROVED" with high confidence (>80%)
   - Reason should mention: "Followed strategy rules, prices verified"
6. Review payout breakdown:
   - **Trader Gets:** +50 XLM (stake back) + $1,600 (80% of $2,000)
   - **Expert Gets:** +$400 (20% of $2,000)
7. Click "Verify On-Chain & Process Payout"
8. Sign transaction

**Expected Result:**
- Verification recorded on-chain
- Payout breakdown displayed
- Shows "P&L Verified — Payout Processing"

---

### Step 4: Check Dashboard

1. Navigate to `/app/dashboard?executionId=1`
2. Review earnings summary:
   - Should show profit-share earnings
   - Example calculation visible
3. (Optional) Withdraw earnings:
   - Enter amount
   - Click "Withdraw"
   - Sign transaction

**Expected Result:**
- Dashboard shows correct profit share amount
- Withdrawal works (if using real contracts)

---

## Test Flow 2: Losing Trader

### Setup:
- Use same strategy from Flow 1 or create new one

### Execution:
1. Navigate to `/app/execute`
2. Enter Strategy ID
3. Submit proof with **negative P&L:**
   ```
   Starting capital: $10,000
   Completed 12 trades following strategy rules
   Final balance: $8,500
   Total P&L: -$1,500 (-15%)
   ```
4. Submit for verification

### Verification:
1. AI should still approve (rules were followed)
2. **Payout breakdown should show:**
   - Trader gets: +50 XLM (stake back) + $0
   - Expert gets: $0 (no profit = no payment)

**Expected Result:**
- Trader protected: gets stake refund
- Expert earns nothing (aligned incentives)

---

## Test Flow 3: Oracle Price Verification

### Setup:
- Use strategy requiring BTC trades

### Execution:
1. Submit proof claiming: "Bought BTC at $50,000 on [date/time]"
2. Include screenshot and TX hash

### Verification:
1. Navigate to verify page
2. Run AI verification
3. **Oracle should check:**
   - Query Pyth Network for BTC price at that timestamp
   - Compare claimed $50,000 vs actual price
   - If difference > 2%, reject

**Expected Result:**
- If prices match (within tolerance): Approved
- If prices don't match: Rejected with "Oracle detected price discrepancy"

---

## Test Flow 4: Missing Proof (Ghost Scenario)

### Setup:
- Create strategy
- Trader stakes and unlocks it

### Execution:
1. Trader stakes 50 XLM
2. **Does NOT submit proof** (simulating ghost)

### Expected Behavior:
- After timeout period, expert can claim the 50 XLM stake
- Trader forfeits stake for not providing proof

**Note:** This requires smart contract timeout logic (may not be fully implemented yet)

---

## Verification Checklist

After running all flows, verify:

- [x] Strategy creation works
- [x] Stake requirement displayed correctly
- [x] Profit share percentage saved
- [x] Execution submission works
- [x] AI verification runs successfully
- [x] Oracle price checking works (if Pyth integration active)
- [x] Payout calculations are correct:
  - Profitable: Trader gets stake + (100-X)% of profit, Expert gets X%
  - Loss: Trader gets stake, Expert gets $0
- [x] Dashboard shows profit-share earnings
- [x] All UI text reflects stake + profit model (no "milestone" references)

---

## Common Issues & Fixes

### Issue: "Strategy not found on-chain"
**Fix:** Ensure Soroban contract is deployed and strategy was created successfully

### Issue: "AI verification fails"
**Fix:** Check API endpoint `/api/verify` is working, Gemini API key is configured

### Issue: "Oracle price not available"
**Fix:** Check Pyth integration, try different asset (BTC, ETH more reliable than obscure coins)

### Issue: "Transaction fails"
**Fix:** Ensure wallet has enough XLM for fees, check Freighter is unlocked

---

## Success Criteria

All tests pass if:

1. ✅ Expert can publish strategy with stake + profit share
2. ✅ Trader can unlock strategy by staking
3. ✅ Trader can submit P&L proof
4. ✅ AI + Oracle verify proof correctly
5. ✅ Payout calculations match expected values
6. ✅ Profitable trader gets stake + profit share
7. ✅ Losing trader gets only stake back
8. ✅ Expert earns nothing when trader loses
9. ✅ All UI shows correct stake + profit terminology

---

## Next Steps After Testing

If all tests pass:
- ✅ Record demo video showing complete flow
- ✅ Prepare live demo for judges
- ✅ Document any edge cases found
- ✅ Add error handling for edge cases

If tests fail:
- ❌ Note which step failed
- ❌ Check console for errors
- ❌ Verify smart contract deployment
- ❌ Test individual components (AI, oracle, contract)

---

**Happy Testing!** 🚀
