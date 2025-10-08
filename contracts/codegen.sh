#!/usr/bin/env bash
set -eu

echo "🔧 Generating all descriptors (chains + contracts)..."

# Step 1: Update chain metadata and generate chain descriptors
echo "📡 Fetching chain metadata and generating chain descriptors..."
npx papi update

# Step 2: Generate contract descriptors
echo "📝 Generating contract descriptors..."
DIR="${DIR:=./deployments}"
contracts=($(find $DIR -maxdepth 1 -mindepth 1 -type d -print 2>/dev/null | xargs -n 1 basename || echo ""))

if [ -z "$contracts" ]; then
  echo "⚠️  No contracts found in $DIR. Skipping contract descriptors."
else
  for i in "${contracts[@]}"
  do
    if [ -f "$DIR/$i/$i.contract" ]; then
      echo "  • Generating types for '$i'..."
      npx papi ink add $DIR/$i/$i.contract
    fi
  done
fi

echo ""
echo "✅ All descriptors generated successfully!"
echo "📦 Chain descriptors: import { pop } from '@polkadot-api/descriptors'"
echo "📦 Contract descriptors: import { contracts } from '@polkadot-api/descriptors'"
