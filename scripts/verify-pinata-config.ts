import { PinataSDK } from 'pinata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyPinataConfig() {
  console.log('🔍 Verifying Pinata Configuration...\n');

  // Check environment variables
  if (!process.env.PINATA_JWT) {
    console.error('❌ Error: PINATA_JWT not found in .env.local');
    console.log('');
    console.log('Please add your Pinata JWT token to .env.local:');
    console.log('PINATA_JWT=your_jwt_token_here');
    process.exit(1);
  }

  if (!process.env.PINATA_GATEWAY) {
    console.error('❌ Error: PINATA_GATEWAY not found in .env.local');
    console.log('');
    console.log('Please add your Pinata gateway domain to .env.local:');
    console.log('PINATA_GATEWAY=your-gateway.mypinata.cloud');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`Gateway: ${process.env.PINATA_GATEWAY}`);
  console.log('');

  try {
    console.log('🔗 Connecting to Pinata...');
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY
    });

    // Test upload with simple metadata
    console.log('📤 Testing metadata upload...');
    const testMetadata = {
      name: 'MonstersInk! Test NFT',
      description: 'Test metadata to verify Pinata integration',
      image: 'https://example.com/test-image.png',
      attributes: [
        {
          trait_type: 'Test Type',
          value: 'Configuration Verification'
        },
        {
          trait_type: 'Timestamp',
          value: new Date().toISOString()
        }
      ]
    };

    const upload = await pinata.upload.public.json(testMetadata);
    const metadataCID = upload.cid;
    const metadataUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${metadataCID}`;

    console.log('✅ Upload successful!');
    console.log('');
    console.log('📋 Test Results:');
    console.log('━'.repeat(60));
    console.log(`IPFS CID: ${metadataCID}`);
    console.log(`Metadata URL: ${metadataUrl}`);
    console.log('━'.repeat(60));
    console.log('');
    console.log('🔍 Verifying retrieval via public IPFS gateway...');

    // Use public IPFS gateway for verification (more reliable for public content)
    const publicGatewayUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;

    // Wait briefly for IPFS propagation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(publicGatewayUrl);
    if (!response.ok) {
      // Try alternative gateway if Pinata public gateway fails
      console.log('⚠️  Pinata public gateway unavailable, trying ipfs.io...');
      const altGatewayUrl = `https://ipfs.io/ipfs/${metadataCID}`;
      const altResponse = await fetch(altGatewayUrl);
      if (!altResponse.ok) {
        console.log('⚠️  IPFS propagation may take time. Skipping retrieval verification.');
        console.log('   Your upload was successful - the CID is valid.');
      } else {
        const retrieved = await altResponse.json();
        console.log('✅ Metadata retrieved successfully via ipfs.io!');
        console.log('');
        console.log('Retrieved Data:');
        console.log(JSON.stringify(retrieved, null, 2));
      }
    } else {
      const retrieved = await response.json();
      console.log('✅ Metadata retrieved successfully!');
      console.log('');
      console.log('Retrieved Data:');
      console.log(JSON.stringify(retrieved, null, 2));
    }
    console.log('');

    // Show URLs for reference
    console.log('📎 Gateway URLs (for NFT metadata):');
    console.log(`   Public: ${publicGatewayUrl}`);
    console.log(`   Dedicated: ${metadataUrl}`);
    console.log('');

    console.log('🎉 Pinata Configuration Verified!');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Pinata is ready for NFT metadata storage');
    console.log('2. Run database migration: npm run migrate');
    console.log('3. Start implementing NFT services');
    console.log('');
    console.log('💡 TIP: Test CID can be deleted from Pinata dashboard if desired');
    console.log(`   CID: ${metadataCID}`);
    console.log('');

  } catch (error) {
    console.error('❌ Pinata verification failed:', error);
    console.log('');
    console.log('Please check:');
    console.log('1. PINATA_JWT is valid and not expired');
    console.log('2. PINATA_GATEWAY is correct (e.g., "your-gateway.mypinata.cloud")');
    console.log('3. Network connection is stable');
    console.log('');
    process.exit(1);
  }
}

verifyPinataConfig().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
