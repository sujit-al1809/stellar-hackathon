#!/bin/bash

# Deploy the contract to Stellar testnet

echo "🚀 Deploying StratFlow to Stellar Testnet..."

# Check if WASM exists
WASM_PATH="target/wasm32-unknown-unknown/release/stratflow.wasm"
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM file not found. Run build.sh first!"
    exit 1
fi

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Install it first:"
    echo "   cargo install --locked stellar-cli --features opt"
    exit 1
fi

# Check for secret key
if [ -z "$STELLAR_SECRET_KEY" ]; then
    echo "⚠️  STELLAR_SECRET_KEY not set in environment"
    echo "   Export it like: export STELLAR_SECRET_KEY=S..."
    echo "   Or create one at: https://laboratory.stellar.org/#account-creator?network=test"
    exit 1
fi

# Deploy
echo "📤 Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$STELLAR_SECRET_KEY" \
  --network testnet 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo ""
    echo "📝 Contract ID: $CONTRACT_ID"
    echo ""
    echo "⚡ Next steps:"
    echo "   1. Copy the Contract ID above"
    echo "   2. Update frontend/.env.local:"
    echo "      NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
    echo "   3. Run the frontend: cd frontend && npm run dev"
else
    echo "❌ Deployment failed!"
    echo "$CONTRACT_ID"
    exit 1
fi
