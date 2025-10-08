# Monsters Ink! Smart Contracts

Professional contract development workspace for MonstersInk! NFT platform.

## Quick Start

### Prerequisites

```bash
# Install cargo-contract
cargo install cargo-contract --force

# Install Node.js dependencies
npm install
```

### Build Contracts

```bash
npm run build
```

Builds all contracts in `src/` and outputs artifacts to `deployments/`.

### Deploy to Pop Network

```bash
# Set your deployment account (or use default //Alice)
export ACCOUNT_URI="//Alice"

# Deploy to Pop Network testnet
npm run deploy:pop
```

### Deploy to Shibuya

```bash
npm run deploy:shibuya
```

### Deploy to Local Node

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy
CHAIN=dev npm run deploy
```

## Contract Structure

```
contracts/
├── src/
│   └── monsters/          # PSP34 NFT contract for MonstersInk!
│       ├── lib.rs         # Main contract logic
│       ├── data.rs        # PSP34 data structures
│       ├── traits.rs      # PSP34 trait implementations
│       ├── metadata.rs    # Metadata handling
│       └── Cargo.toml
├── deployments/           # Built artifacts and deployment info
│   └── monsters/
│       ├── monsters.json        # Contract metadata (ABI)
│       ├── monsters.contract    # Compiled WASM
│       ├── pop.json            # Pop Network deployment
│       ├── shibuya.json        # Shibuya deployment
│       └── *.ts                # TypeScript exports
├── scripts/
│   └── deploy.js          # Deployment script
├── build.sh               # Build script
└── package.json

```

## Environment Variables

Create a `.env` file:

```bash
# Chain to deploy to
CHAIN=pop

# Deployment account
ACCOUNT_URI=//Alice

# Contract to deploy (if you have multiple)
CONTRACT=monsters
```

## Available Chains

- `pop` - Pop Network Testnet
- `shibuya` - Shibuya Testnet (Astar)
- `passethub` - Passet Hub Testnet
- `dev` - Local development node

## Deployment Output

After deployment, you'll get:

```
deployments/monsters/
├── pop.json          # Deployment metadata
└── pop.ts            # TypeScript export
```

Import in frontend:

```typescript
import { address } from './contracts/deployments/monsters/pop';
```

## Common Commands

```bash
# Build all contracts
npm run build

# Deploy to Pop Network
npm run deploy:pop

# Deploy to Shibuya
npm run deploy:shibuya

# Start local node
npm run node

# Clean build artifacts
npm run clean
```

## Contract Features

### MonstersInk! NFT (monsters)

PSP34 NFT contract with:
- ✅ Public minting
- ✅ Attribute delegation (similar to NFTs pallet)
- ✅ Metadata management
- ✅ IPFS integration
- ✅ Collection info

**Key Functions:**
- `public_mint()` - Mint a creature NFT
- `approve_item_attributes(token_id, delegate)` - Allow delegate to set attributes
- `set_attribute(token_id, key, value)` - Set token metadata

## Troubleshooting

### Build fails

```bash
# Update cargo-contract
cargo install cargo-contract --force --locked

# Clean and rebuild
npm run clean
npm run build
```

### Deployment fails

- **Insufficient balance**: Fund your account via faucet
- **Gas issues**: Adjust gas limits in `scripts/deploy.js`
- **Connection timeout**: Check RPC endpoint in `scripts/deploy.js`

## Resources

- [ink! Documentation](https://use.ink/)
- [Pop Network Docs](https://learn.onpop.io/)
- [cargo-contract](https://github.com/paritytech/cargo-contract)
