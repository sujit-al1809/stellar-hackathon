/**
 * Initialize Demo Data for StratFlow Marketplace
 *
 * Run this to populate localStorage with demo strategies
 * that include StellarX trading pairs and complete metadata.
 *
 * Usage:
 *   1. Open browser console on http://localhost:3000
 *   2. Copy and paste this entire script
 *   3. Press Enter
 *   4. Refresh page
 */

const DEMO_STRATEGIES = [
  {
    id: 1,
    title: "Bitcoin Scalping Strategy - RSI Reversal",
    description: "High-frequency scalping strategy for BTC using RSI oversold/overbought signals on 5-minute charts. Target 1-3% daily returns with tight stop losses.",
    rules: [
      "Entry: Buy when RSI(14) crosses below 30 on 5-minute chart",
      "Exit: Sell when RSI(14) crosses above 70 OR 2% stop loss hit",
      "Position size: Maximum 5% of total portfolio per trade",
      "Trading hours: Only during high volatility (8AM-12PM UTC, 2PM-6PM UTC)",
      "Take profit: 1.5% target, move stop to breakeven after 0.8% gain"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 20,
    baseAsset: "BTC",
    counterAsset: "USDC",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: "Ethereum DeFi Yield Optimizer",
    description: "Automated yield farming strategy that rotates capital between high-APY pools on Stellar DEX. Targets 8-15% monthly returns through strategic liquidity provision.",
    rules: [
      "Monitor top 10 liquidity pools on StellarX for APY > 12%",
      "Enter: Provide liquidity when APY crosses above 12% and TVL > $100k",
      "Exit: Remove liquidity when APY drops below 8% or better opportunity found",
      "Rebalance: Check every 24 hours, move to highest yield if difference > 3%",
      "Risk management: Never allocate more than 30% to a single pool"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 20,
    baseAsset: "ETH",
    counterAsset: "XLM",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: "XLM Momentum Breakout Trading",
    description: "Medium-term momentum strategy for Stellar (XLM) based on volume breakouts and moving average crossovers. Works best during trending markets.",
    rules: [
      "Entry: Buy when 20-day MA crosses above 50-day MA AND volume > 2x average",
      "Confirmation: Price must close above both MAs for 2 consecutive days",
      "Exit: Sell when 20-day MA crosses below 50-day MA",
      "Stop loss: 5% below entry price (trailing stop)",
      "Position size: Scale in with 3 equal entries over 3 days"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 25,
    baseAsset: "XLM",
    counterAsset: "USDC",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: "SOL Range Trading Bot",
    description: "Range-bound trading strategy for Solana using support/resistance levels. Ideal for sideways markets with clear boundaries.",
    rules: [
      "Identify range: Mark support at $130 and resistance at $150 (adjust weekly)",
      "Entry: Buy at support +$2 ($132), sell at resistance -$2 ($148)",
      "Confirmation: Wait for price to bounce off level twice before entering",
      "Exit: Close position if price breaks range by > 3%",
      "Time-based exit: Close all positions after 7 days regardless of profit"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 20,
    baseAsset: "SOL",
    counterAsset: "USDC",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    title: "Multi-Asset Portfolio Rebalancing",
    description: "Quarterly rebalancing strategy maintaining 40% BTC, 30% ETH, 20% XLM, 10% USDC allocation. Minimizes risk through diversification.",
    rules: [
      "Target allocation: 40% BTC, 30% ETH, 20% XLM, 10% USDC",
      "Rebalance trigger: Any asset deviates > 5% from target",
      "Execution: Sell outperformers, buy underperformers to restore targets",
      "Frequency: Check allocation weekly, rebalance only when needed",
      "Tax optimization: Hold positions > 30 days before rebalancing when possible"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 15,
    baseAsset: "BTC",
    counterAsset: "USDC",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    title: "USDC Stablecoin Arbitrage",
    description: "Low-risk arbitrage strategy exploiting price differences between DEXes. Consistent small gains with minimal downside risk.",
    rules: [
      "Monitor: USDC price on StellarX, Uniswap, and Binance",
      "Entry: Execute when price difference > 0.3% (after fees)",
      "Execution: Buy on cheaper DEX, sell on expensive DEX simultaneously",
      "Slippage limit: Max 0.1% slippage tolerance",
      "Capital allocation: Use 80% of capital, keep 20% in reserve for gas fees"
    ],
    rewardAmount: 50,
    stakeAmount: 50,
    profitSharePercent: 30,
    baseAsset: "USDC",
    counterAsset: "XLM",
    creatorAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM5EHSS25CBDC7XPTC",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Initialize localStorage
console.log("🚀 Initializing StratFlow demo data...");

// Create strategies object keyed by ID
const strategiesObj = {};
DEMO_STRATEGIES.forEach(strategy => {
  strategiesObj[strategy.id] = strategy;
});

// Save to localStorage
localStorage.setItem("stratflow_strategies", JSON.stringify(strategiesObj));

console.log(`✅ Added ${DEMO_STRATEGIES.length} demo strategies to marketplace!`);
console.log("📊 Strategies include:");
DEMO_STRATEGIES.forEach(s => {
  console.log(`   - ${s.title} (${s.baseAsset}/${s.counterAsset})`);
});
console.log("\n🎉 Demo data ready! Refresh the page to see strategies in marketplace.");

// Also log the trading pairs for easy reference
console.log("\n💱 Trading Pairs Available:");
const pairs = [...new Set(DEMO_STRATEGIES.map(s => `${s.baseAsset}/${s.counterAsset}`))];
pairs.forEach(pair => console.log(`   - ${pair}`));

console.log("\n🔗 StellarX integration will show for all strategies after staking!");
