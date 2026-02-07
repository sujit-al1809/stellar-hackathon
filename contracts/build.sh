#!/bin/bash

# Build the Soroban smart contract

echo "🔨 Building StratFlow contract..."

# Check if we're in the contracts directory
if [ ! -f "Cargo.toml" ]; then
    cd contracts || exit 1
fi

# Build the contract
cargo build --target wasm32-unknown-unknown --release

if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
    echo "📦 WASM file: target/wasm32-unknown-unknown/release/stratflow.wasm"
else
    echo "❌ Build failed!"
    exit 1
fi
