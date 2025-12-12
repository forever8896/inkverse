import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Suppress noisy Polkadot API warnings (REGISTRY, API/INIT messages)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0]?.toString() || '';
  if (msg.includes('REGISTRY:') || msg.includes('API/INIT:') || msg.includes('multiple versions')) {
    return; // Suppress
  }
  originalWarn.apply(console, args);
};

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ASSET_HUB_RPC = process.env.ASSET_HUB_RPC_URL || 'wss://passet-hub-paseo.ibp.network';

async function createCollection() {
  console.log('🎨 Creating NFT Collection on Paseo Asset Hub...\n');

  // Validate environment variables
  if (!process.env.PLATFORM_ACCOUNT_SEED) {
    console.error('❌ Error: PLATFORM_ACCOUNT_SEED not found in .env.local');
    console.log('');
    console.log('Please run: npx tsx scripts/generate-platform-account.ts');
    process.exit(1);
  }

  await cryptoWaitReady();

  // Initialize keyring and load platform account
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  const platformAccount = keyring.addFromMnemonic(process.env.PLATFORM_ACCOUNT_SEED);

  console.log('📡 Connecting to Paseo Asset Hub...');
  console.log(`RPC: ${ASSET_HUB_RPC}`);
  console.log('');

  // Create provider with connection timeout
  const provider = new WsProvider(ASSET_HUB_RPC, 5000); // 5s reconnect interval

  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.error('❌ Connection timeout after 30 seconds');
    console.log('');
    console.log('Try alternative RPC endpoints:');
    console.log('  - wss://passet-hub-paseo.ibp.network (archive)');
    console.log('  - https://testnet-passet-hub.polkadot.io (HTTP-RPC)');
    console.log('');
    console.log('Set ASSET_HUB_RPC_URL in .env.local to use a different endpoint');
    process.exit(1);
  }, 30000);

  const api = await ApiPromise.create({ provider });
  clearTimeout(connectionTimeout);

  console.log('✅ Connected to chain');
  console.log(`Chain: ${await api.rpc.system.chain()}`);
  console.log(`Version: ${await api.rpc.system.version()}`);
  console.log('');

  // Check account balance
  const { data: balance } = await api.query.system.account(platformAccount.address);
  const freeBalance = balance.free.toBigInt();
  const existentialDeposit = api.consts.balances.existentialDeposit.toBigInt();

  console.log('💰 Account Balance:');
  console.log(`Address: ${platformAccount.address}`);
  console.log(`Free: ${(Number(freeBalance) / 1e10).toFixed(4)} PAS`);
  console.log(`Existential Deposit: ${(Number(existentialDeposit) / 1e10).toFixed(4)} PAS`);
  console.log('');

  if (freeBalance < existentialDeposit * 2n) {
    console.error('❌ Error: Insufficient balance');
    console.log('');
    console.log('Please fund your account:');
    console.log('https://faucet.polkadot.io/?parachain=1111');
    await api.disconnect();
    process.exit(1);
  }

  console.log('🏗️  Creating NFT Collection...');
  console.log('Collection Config:');
  console.log('  - Max Supply: Unlimited');
  console.log('  - Mint Type: Issuer Only');
  console.log('  - Admin: Platform Account (same as owner)');
  console.log('');

  // Create collection
  return new Promise<void>((resolve, reject) => {
    api.tx.nfts
      .create(
        platformAccount.address, // admin (same as owner for rapid prototyping)
        {
          settings: 0,
          maxSupply: null, // Unlimited students
          mintSettings: {
            mintType: 'Issuer', // Only platform can mint
            price: null,
            startBlock: null,
            endBlock: null,
            defaultItemSettings: 0
          }
        }
      )
      .signAndSend(platformAccount, ({ status, events, dispatchError }) => {
        console.log(`📋 Transaction status: ${status.type}`);

        if (status.isInBlock) {
          console.log(`✅ Included in block: ${status.asInBlock.toHex()}`);
        }

        if (status.isFinalized) {
          console.log(`✅ Finalized in block: ${status.asFinalized.toHex()}`);
          console.log('');

          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              console.error(`❌ Error: ${section}.${name}: ${docs.join(' ')}`);
            } else {
              console.error(`❌ Error: ${dispatchError.toString()}`);
            }
            reject(new Error('Collection creation failed'));
            return;
          }

          // Find collection ID from events
          let collectionId: string | null = null;

          events.forEach(({ event }) => {
            if (api.events.nfts.Created.is(event)) {
              collectionId = event.data.collection.toString();
              console.log('🎉 Collection Created Successfully!');
              console.log('━'.repeat(60));
              console.log(`Collection ID: ${collectionId}`);
              console.log(`Owner: ${platformAccount.address}`);
              console.log('━'.repeat(60));
              console.log('');
              console.log('📝 Add to .env.local:');
              console.log('━'.repeat(60));
              console.log(`NFTS_COLLECTION_ID=${collectionId}`);
              console.log(`NEXT_PUBLIC_NFTS_COLLECTION_ID=${collectionId}`);
              console.log('━'.repeat(60));
              console.log('');
              console.log('🎯 NEXT STEPS:');
              console.log('1. Add NFTS_COLLECTION_ID to .env.local');
              console.log('2. Verify Pinata configuration: npx tsx scripts/verify-pinata-config.ts');
              console.log('3. Run database migration: npm run migrate');
              console.log('4. Start implementing NFT services');
              console.log('');
            }
          });

          if (!collectionId) {
            console.error('⚠️  Warning: Collection created but ID not found in events');
          }

          api.disconnect().then(() => resolve());
        }
      });
  });
}

createCollection().catch(async (error) => {
  console.error('❌ Error creating collection:', error);
  process.exit(1);
});
