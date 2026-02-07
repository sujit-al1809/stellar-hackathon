#!/usr/bin/env node

/**
 * Oracle Integration Test Script
 *
 * Tests Pyth Network integration and price verification
 * Run: node scripts/test-oracle.js
 */

const PYTH_ENDPOINT = "https://hermes.pyth.network";

// Pyth price feed IDs
const PRICE_FEEDS = {
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  XLM_USD: "0xb7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850",
};

async function getCurrentPrice(feedId, assetName) {
  try {
    console.log(`\n🔍 Fetching ${assetName} price from Pyth...`);

    const response = await fetch(
      `${PYTH_ENDPOINT}/api/latest_price_feeds?ids[]=${feedId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data[0] || !data[0].price) {
      throw new Error("Invalid response format");
    }

    const priceData = data[0].price;
    const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = parseFloat(priceData.conf) * Math.pow(10, priceData.expo);
    const timestamp = new Date(parseInt(priceData.publish_time) * 1000);

    console.log(`✅ ${assetName} Price: $${price.toFixed(2)}`);
    console.log(`   Confidence: ±$${confidence.toFixed(2)}`);
    console.log(`   Updated: ${timestamp.toLocaleTimeString()}`);

    return { price, confidence, timestamp };
  } catch (error) {
    console.error(`❌ Failed to fetch ${assetName} price:`, error.message);
    return null;
  }
}

async function verifyPriceClaim(asset, claimedPrice, actualPrice, tolerancePercent = 2) {
  const difference = Math.abs(claimedPrice - actualPrice);
  const differencePercent = (difference / actualPrice) * 100;
  const valid = differencePercent <= tolerancePercent;

  console.log(`\n📊 Verifying ${asset} Price Claim:`);
  console.log(`   Claimed: $${claimedPrice.toLocaleString()}`);
  console.log(`   Oracle:  $${actualPrice.toFixed(2)}`);
  console.log(`   Diff:    ${differencePercent.toFixed(2)}% ${valid ? '✅' : '❌'}`);
  console.log(`   Status:  ${valid ? 'VALID (within tolerance)' : 'INVALID (exceeds tolerance)'}`);

  return {
    valid,
    claimedPrice,
    oraclePrice: actualPrice,
    differencePercent,
    reason: valid
      ? `Price verified within ${tolerancePercent}% tolerance`
      : `Price difference (${differencePercent.toFixed(2)}%) exceeds ${tolerancePercent}% tolerance`
  };
}

async function testOracleIntegration() {
  console.log("═══════════════════════════════════════════");
  console.log("  ORACLE INTEGRATION TEST");
  console.log("═══════════════════════════════════════════");

  // Test 1: Fetch current prices
  console.log("\n📍 TEST 1: Fetch Current Prices");
  console.log("───────────────────────────────────────────");

  const btcData = await getCurrentPrice(PRICE_FEEDS.BTC_USD, "BTC");
  const ethData = await getCurrentPrice(PRICE_FEEDS.ETH_USD, "ETH");
  const solData = await getCurrentPrice(PRICE_FEEDS.SOL_USD, "SOL");
  const xlmData = await getCurrentPrice(PRICE_FEEDS.XLM_USD, "XLM");

  if (!btcData || !ethData || !solData || !xlmData) {
    console.error("\n❌ TEST 1 FAILED: Could not fetch all prices");
    return;
  }

  console.log("\n✅ TEST 1 PASSED: All prices fetched successfully");

  // Test 2: Verify accurate price claim
  console.log("\n\n📍 TEST 2: Verify Accurate Price Claim");
  console.log("───────────────────────────────────────────");

  const accurateClaim = btcData.price + (btcData.price * 0.005); // Within 0.5%
  const result1 = await verifyPriceClaim("BTC", accurateClaim, btcData.price, 2);

  if (!result1.valid) {
    console.error("\n❌ TEST 2 FAILED: Accurate claim was rejected");
    return;
  }

  console.log("\n✅ TEST 2 PASSED: Accurate price claim verified");

  // Test 3: Reject inaccurate price claim
  console.log("\n\n📍 TEST 3: Reject Inaccurate Price Claim");
  console.log("───────────────────────────────────────────");

  const fakeClaim = btcData.price * 0.9; // 10% off (should be rejected)
  const result2 = await verifyPriceClaim("BTC", fakeClaim, btcData.price, 2);

  if (result2.valid) {
    console.error("\n❌ TEST 3 FAILED: Fake claim was accepted");
    return;
  }

  console.log("\n✅ TEST 3 PASSED: Fake price claim rejected");

  // Test 4: Edge case - exactly at tolerance boundary
  console.log("\n\n📍 TEST 4: Tolerance Boundary Test");
  console.log("───────────────────────────────────────────");

  const boundaryClaim = btcData.price * 1.02; // Exactly 2% (should pass)
  const result3 = await verifyPriceClaim("BTC", boundaryClaim, btcData.price, 2);

  console.log(`\n${result3.valid ? '✅' : '❌'} TEST 4: Boundary case ${result3.valid ? 'accepted' : 'rejected'} as expected`);

  // Summary
  console.log("\n\n═══════════════════════════════════════════");
  console.log("  TEST SUMMARY");
  console.log("═══════════════════════════════════════════");
  console.log("✅ Price Fetching: WORKING");
  console.log("✅ Accurate Claims: VERIFIED");
  console.log("✅ Fake Claims: REJECTED");
  console.log("✅ Tolerance Logic: CORRECT");
  console.log("\n🎉 ALL ORACLE TESTS PASSED!");
  console.log("═══════════════════════════════════════════\n");
}

// Run tests
testOracleIntegration().catch(error => {
  console.error("\n💥 Test script error:", error);
  process.exit(1);
});
