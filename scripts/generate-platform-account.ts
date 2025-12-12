import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';

async function generateAccount() {
  console.log('Generating platform account...\n');

  await cryptoWaitReady();

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  const mnemonic = mnemonicGenerate(12);
  const account = keyring.addFromMnemonic(mnemonic);

  console.log('Address:  ', account.address);
  console.log('Mnemonic: ', mnemonic);
  console.log('');
  console.log('Add to .env.local:');
  console.log('─'.repeat(50));
  console.log(`PLATFORM_ACCOUNT_SEED="${mnemonic}"`);
  console.log(`NEXT_PUBLIC_PLATFORM_ADDRESS="${account.address}"`);
  console.log('─'.repeat(50));
  console.log('');
  console.log('Never store the mnemonic in a public directory.');
  console.log('');
  console.log('Request testnet funds:');
  console.log('https://faucet.polkadot.io/?parachain=1111');
  console.log('');
  console.log('Next: npx tsx scripts/create-collection-paseo.ts');
}

generateAccount().catch(console.error);
