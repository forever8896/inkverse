/**
 * sync-nft-collection-state.ts
 *
 * Comprehensive sync between prod DB and on-chain NFT collection state.
 *
 * Phase 1: Report DB state + on-chain state + diffs
 * Phase 2: Fix nft_collection_state counter
 * Phase 3: Create/update user_monsters records from completed generations
 *          so the app can display monsters with their S3 assets
 * Phase 4: (--mint) Upload metadata to IPFS + mint on-chain for unminted monsters
 *
 * Usage:
 *   npx tsx scripts/sync-nft-collection-state.ts                  # dry-run (report only)
 *   npx tsx scripts/sync-nft-collection-state.ts --apply           # fix counter + user_monsters
 *   npx tsx scripts/sync-nft-collection-state.ts --apply --mint    # also mint unminted monsters
 *   npx tsx scripts/sync-nft-collection-state.ts --env .env.local  # use different env file
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Suppress noisy Polkadot API warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0]?.toString() || '';
  if (
    msg.includes('REGISTRY:') ||
    msg.includes('API/INIT:') ||
    msg.includes('multiple versions')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const mintMode = args.includes('--mint');
const envFlagIdx = args.indexOf('--env');
const envFile =
  envFlagIdx !== -1 && args[envFlagIdx + 1]
    ? args[envFlagIdx + 1]
    : '.env.vercel-prod';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const COLLECTION_ID = parseInt(process.env.NFTS_COLLECTION_ID || '11', 10);
const RPC_URL =
  process.env.ASSET_HUB_RPC_URL || 'wss://passet-hub-paseo.ibp.network';
// Prefer unpooled URL for direct connections (Neon pooler can be finicky from scripts)
const DB_URL =
  process.env.POSTGRES_DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL;

if (!DB_URL) {
  console.error(
    'POSTGRES_URL not found. Specify --env <file> pointing to the correct env.'
  );
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function header(title: string) {
  console.log('');
  console.log('═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function line(label: string, value: unknown) {
  console.log(`  ${label.padEnd(30)} ${value}`);
}

// ── Types ───────────────────────────────────────────────────────────────────

interface OnChainItem {
  itemId: number;
  owner: string;
}

interface CompletedGeneration {
  id: string;
  user_id: string;
  user_name: string;
  user_wallet: string | null;
  style: string;
  stage: string;
  image_s3_key: string;
  glb_s3_key: string;
  nft_item_id: number | null;
  nft_collection_id: number | null;
  nft_owner_address: string | null;
  nft_metadata_cid: string | null;
  nft_image_cid: string | null;
  nft_model_cid: string | null;
  monster_id: string | null;
  created_at: Date;
}

interface UserMonsterRow {
  id: string;
  user_id: string;
  current_stage: string;
  nft_item_id: number | null;
  nft_owner_address: string | null;
  young_image_s3_key: string | null;
  young_model_s3_key: string | null;
  adult_model_s3_key: string | null;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Mode: ${applyMode ? (mintMode ? 'APPLY + MINT' : 'APPLY') : 'DRY-RUN (read-only)'}`
  );
  console.log(`Env file: ${envFile}`);
  console.log(`Collection ID: ${COLLECTION_ID}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log(`DB: ${DB_URL!.replace(/:[^@]+@/, ':***@')}`);

  const pool = new Pool({
    connectionString: DB_URL,
    ssl: DB_URL!.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
    max: 2,
    connectionTimeoutMillis: 15000,
  });

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 1: REPORT
  // ════════════════════════════════════════════════════════════════════════

  header('1. PRODUCTION DATABASE STATE');

  // 1a. nft_collection_state
  const collectionStateResult = await pool.query(
    'SELECT * FROM nft_collection_state WHERE collection_id = $1',
    [COLLECTION_ID]
  );

  if (collectionStateResult.rows.length === 0) {
    console.log(`  No nft_collection_state row for collection ${COLLECTION_ID}`);
  } else {
    const cs = collectionStateResult.rows[0];
    console.log('');
    console.log('  nft_collection_state:');
    line('collection_id', cs.collection_id);
    line('next_item_id', cs.next_item_id);
    line('total_minted', cs.total_minted);
    line('updated_at', cs.updated_at);
  }

  // 1b. All completed generations with user info + user_monsters state
  const completedGens: CompletedGeneration[] = (
    await pool.query(`
    SELECT mg.id, mg.user_id, u.name as user_name, u.wallet_address as user_wallet,
           mg.style, mg.stage, mg.image_s3_key, mg.glb_s3_key,
           mg.nft_item_id, mg.nft_collection_id, mg.nft_owner_address,
           mg.nft_metadata_cid, mg.nft_image_cid, mg.nft_model_cid,
           mg.monster_id, mg.created_at
    FROM monster_generations mg
    JOIN "user" u ON u.id = mg.user_id
    WHERE mg.status = 'completed'
    ORDER BY mg.created_at ASC
  `)
  ).rows;

  console.log('');
  console.log(`  Completed generations: ${completedGens.length}`);
  console.log('');
  console.log(
    '  # | User            | Stage | Has S3 | NFT Item | Wallet'
  );
  console.log('  ' + '─'.repeat(75));
  for (let i = 0; i < completedGens.length; i++) {
    const g = completedGens[i];
    const hasS3 = g.image_s3_key && g.glb_s3_key ? 'yes' : 'no';
    const nft = g.nft_item_id !== null ? String(g.nft_item_id) : '--';
    const wallet = g.nft_owner_address
      ? g.nft_owner_address.substring(0, 16) + '...'
      : g.user_wallet
        ? g.user_wallet.substring(0, 16) + '...'
        : '(none)';
    console.log(
      `  ${String(i + 1).padEnd(3)} | ${g.user_name.padEnd(15)} | ${g.stage.padEnd(5)} | ${hasS3.padEnd(6)} | ${nft.padEnd(8)} | ${wallet}`
    );
  }

  // 1c. user_monsters state
  const userMonsters: UserMonsterRow[] = (
    await pool.query(`SELECT * FROM user_monsters ORDER BY created_at ASC`)
  ).rows;

  console.log('');
  console.log(`  user_monsters records: ${userMonsters.length}`);
  if (userMonsters.length > 0) {
    for (const um of userMonsters) {
      console.log(`    user=${um.user_id.substring(0, 16)}... stage=${um.current_stage} nft_item=${um.nft_item_id ?? '--'} img_s3=${um.young_image_s3_key ? 'yes' : 'no'} model_s3=${um.young_model_s3_key ? 'yes' : 'no'} adult_s3=${um.adult_model_s3_key ? 'yes' : 'no'}`);
    }
  }

  // ── 2. On-chain state ─────────────────────────────────────────────────

  header('2. ON-CHAIN STATE (Paseo Asset Hub)');

  await cryptoWaitReady();

  console.log('  Connecting to chain...');
  const provider = new WsProvider(RPC_URL, 5000);

  const connTimeout = setTimeout(() => {
    console.error('  Connection timeout after 30s');
    process.exit(1);
  }, 30000);

  const api = await ApiPromise.create({ provider });
  clearTimeout(connTimeout);

  const chain = await api.rpc.system.chain();
  console.log(`  Connected to: ${chain}`);

  // Collection details
  const collectionDetails = await (api.query.nfts as any).collection(
    COLLECTION_ID
  );

  if (collectionDetails.isNone) {
    console.log(`  Collection ${COLLECTION_ID} NOT FOUND on-chain.`);
    await api.disconnect();
    await pool.end();
    process.exit(1);
  }

  const details = collectionDetails.unwrap();
  const onChainItemCount = parseInt(details.items.toString(), 10);
  console.log(
    `  Collection owner: ${details.owner.toString()}  items: ${onChainItemCount}`
  );

  // Enumerate items
  const allItems = await (api.query.nfts as any).item.entries(COLLECTION_ID);
  const onChainItems: OnChainItem[] = [];

  for (const [key, value] of allItems) {
    const itemId = parseInt(key.args[1].toString(), 10);
    const itemData = value.unwrap();
    onChainItems.push({ itemId, owner: itemData.owner.toString() });
  }
  onChainItems.sort((a, b) => a.itemId - b.itemId);

  console.log(`  Found ${onChainItems.length} items on-chain`);
  if (onChainItems.length > 0) {
    console.log('');
    console.log('  Item ID | Owner');
    console.log('  ' + '─'.repeat(60));
    for (const item of onChainItems) {
      console.log(`  ${String(item.itemId).padEnd(8)} | ${item.owner}`);
    }
  }

  // Metadata
  const itemMetadata: Map<number, string> = new Map();
  for (const item of onChainItems) {
    const meta = await (api.query.nfts as any).itemMetadataOf(
      COLLECTION_ID,
      item.itemId
    );
    if (meta.isSome) {
      const metaData = meta.unwrap();
      const metaStr = metaData.data.toUtf8
        ? metaData.data.toUtf8()
        : metaData.data.toString();
      itemMetadata.set(item.itemId, metaStr);
    }
  }

  const maxItemId =
    onChainItems.length > 0
      ? Math.max(...onChainItems.map((i) => i.itemId))
      : -1;
  const correctNextItemId = maxItemId + 1;

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 2: COMPARISON
  // ════════════════════════════════════════════════════════════════════════

  header('3. COMPARISON');

  const dbNextItemId =
    collectionStateResult.rows.length > 0
      ? collectionStateResult.rows[0].next_item_id
      : null;
  const dbTotalMinted =
    collectionStateResult.rows.length > 0
      ? collectionStateResult.rows[0].total_minted
      : null;

  const needsNextIdFix = dbNextItemId !== correctNextItemId;
  const needsTotalFix = dbTotalMinted !== onChainItems.length;

  console.log('');
  console.log('  nft_collection_state:');
  console.log(`    next_item_id:  DB=${dbNextItemId}  correct=${correctNextItemId}  ${needsNextIdFix ? '!! MISMATCH' : 'OK'}`);
  console.log(`    total_minted:  DB=${dbTotalMinted}  correct=${onChainItems.length}  ${needsTotalFix ? '!! MISMATCH' : 'OK'}`);

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 3: DETERMINE user_monsters FIXES
  // ════════════════════════════════════════════════════════════════════════

  header('4. USER_MONSTERS ALIGNMENT');

  // Group completed generations by user
  const gensByUser = new Map<string, CompletedGeneration[]>();
  for (const g of completedGens) {
    const existing = gensByUser.get(g.user_id) || [];
    existing.push(g);
    gensByUser.set(g.user_id, existing);
  }

  const existingMonsters = new Map<string, UserMonsterRow>();
  for (const um of userMonsters) {
    existingMonsters.set(um.user_id, um);
  }

  interface MonsterFix {
    action: 'create' | 'update';
    userId: string;
    userName: string;
    existingMonsterId?: string;
    // Assets to set
    youngImageS3Key: string;
    youngModelS3Key: string;
    adultModelS3Key: string | null;
    generationPrompt: string;
    generationStyle: string;
    currentStage: string;
    // NFT data from generation
    nftItemId: number | null;
    nftOwnerAddress: string | null;
    nftMetadataCid: string | null;
    // Source generation IDs
    youngGenId: string;
    adultGenId: string | null;
  }

  const monsterFixes: MonsterFix[] = [];

  for (const [userId, gens] of gensByUser) {
    const um = existingMonsters.get(userId);
    const userName = gens[0].user_name;

    // Find the best young generation (latest with assets)
    const youngGens = gens
      .filter((g) => g.stage === 'young' && g.image_s3_key && g.glb_s3_key)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    // Find the best adult generation
    const adultGens = gens
      .filter((g) => g.stage === 'adult' && g.image_s3_key && g.glb_s3_key)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    if (youngGens.length === 0) {
      console.log(`  SKIP ${userName}: no completed young generation with assets`);
      continue;
    }

    const youngGen = youngGens[0];
    const adultGen = adultGens.length > 0 ? adultGens[0] : null;

    // Find NFT data from any of this user's generations
    const nftGen = gens.find((g) => g.nft_item_id !== null);

    // Determine the wallet address (from NFT gen, user_monsters, or user table)
    const wallet =
      nftGen?.nft_owner_address ||
      um?.nft_owner_address ||
      gens[0].user_wallet ||
      null;

    if (!um) {
      // Need to CREATE user_monsters record
      console.log(
        `  CREATE ${userName}: young from gen ${youngGen.id.substring(0, 8)}...${adultGen ? ', adult from gen ' + adultGen.id.substring(0, 8) + '...' : ''} wallet=${wallet ? wallet.substring(0, 16) + '...' : '(none)'}`
      );
      monsterFixes.push({
        action: 'create',
        userId,
        userName,
        youngImageS3Key: youngGen.image_s3_key,
        youngModelS3Key: youngGen.glb_s3_key,
        adultModelS3Key: adultGen?.glb_s3_key || null,
        generationPrompt: '', // Will be truncated from actual prompt
        generationStyle: youngGen.style,
        currentStage: 'young',
        nftItemId: nftGen?.nft_item_id ?? null,
        nftOwnerAddress: wallet,
        nftMetadataCid: nftGen?.nft_metadata_cid ?? null,
        youngGenId: youngGen.id,
        adultGenId: adultGen?.id || null,
      });
    } else {
      // Check if user_monsters needs updating
      const needsS3 =
        !um.young_image_s3_key || !um.young_model_s3_key;
      const needsAdult = adultGen && !um.adult_model_s3_key;
      const needsNft =
        nftGen && nftGen.nft_item_id !== null && um.nft_item_id === null;

      if (needsS3 || needsAdult || needsNft) {
        const reasons = [];
        if (needsS3) reasons.push('missing S3 keys');
        if (needsAdult) reasons.push('missing adult model');
        if (needsNft)
          reasons.push(`missing nft_item_id (should be ${nftGen!.nft_item_id})`);

        console.log(
          `  UPDATE ${userName} (${um.id.substring(0, 8)}...): ${reasons.join(', ')}`
        );
        monsterFixes.push({
          action: 'update',
          userId,
          userName,
          existingMonsterId: um.id,
          youngImageS3Key: youngGen.image_s3_key,
          youngModelS3Key: youngGen.glb_s3_key,
          adultModelS3Key: adultGen?.glb_s3_key || null,
          generationPrompt: '',
          generationStyle: youngGen.style,
          currentStage: um.current_stage,
          nftItemId: nftGen?.nft_item_id ?? null,
          nftOwnerAddress: wallet,
          nftMetadataCid: nftGen?.nft_metadata_cid ?? null,
          youngGenId: youngGen.id,
          adultGenId: adultGen?.id || null,
        });
      } else {
        console.log(`  OK ${userName}: user_monsters record is complete`);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 4: DETERMINE MINTING NEEDS
  // ════════════════════════════════════════════════════════════════════════

  // Find monsters that have assets but no NFT, and have a wallet
  const needsMinting = monsterFixes.filter(
    (f) => f.nftItemId === null && f.nftOwnerAddress !== null
  );
  // Users with assets but no wallet (can't mint)
  const noWallet = monsterFixes.filter(
    (f) => f.nftItemId === null && f.nftOwnerAddress === null
  );

  if (needsMinting.length > 0 || noWallet.length > 0) {
    header('5. MINTING STATUS');

    if (needsMinting.length > 0) {
      console.log(`  Ready to mint (has wallet + assets): ${needsMinting.length}`);
      for (const f of needsMinting) {
        console.log(
          `    ${f.userName}: wallet=${f.nftOwnerAddress!.substring(0, 20)}...`
        );
      }
    }

    if (noWallet.length > 0) {
      console.log(
        `  Cannot mint (no wallet connected): ${noWallet.length}`
      );
      for (const f of noWallet) {
        console.log(
          `    ${f.userName}: needs to connect a wallet before minting`
        );
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // APPLY
  // ════════════════════════════════════════════════════════════════════════

  if (!applyMode) {
    header('SUMMARY (dry-run, pass --apply to execute)');

    if (needsNextIdFix || needsTotalFix) {
      console.log(`  [counter] UPDATE nft_collection_state SET next_item_id=${correctNextItemId}, total_minted=${onChainItems.length}`);
    }
    for (const f of monsterFixes) {
      if (f.action === 'create') {
        console.log(
          `  [monster] INSERT user_monsters for ${f.userName} with S3 keys from gen ${f.youngGenId.substring(0, 8)}...`
        );
      } else {
        console.log(
          `  [monster] UPDATE user_monsters ${f.existingMonsterId!.substring(0, 8)}... for ${f.userName}: populate S3 keys + NFT data`
        );
      }
    }
    if (mintMode && needsMinting.length > 0) {
      console.log('');
      for (const f of needsMinting) {
        console.log(
          `  [mint] Would upload IPFS metadata + mint NFT for ${f.userName}`
        );
      }
    } else if (needsMinting.length > 0) {
      console.log('');
      console.log(
        `  Pass --mint to also mint NFTs for ${needsMinting.length} unminted monster(s)`
      );
    }

    await api.disconnect();
    await pool.end();
    return;
  }

  // ── Apply: counter fix ────────────────────────────────────────────────

  header('APPLYING FIXES');

  if (needsNextIdFix || needsTotalFix) {
    console.log('  Fixing nft_collection_state...');
    await pool.query(
      `UPDATE nft_collection_state
       SET next_item_id = $1, total_minted = $2, updated_at = NOW()
       WHERE collection_id = $3`,
      [correctNextItemId, onChainItems.length, COLLECTION_ID]
    );
    console.log(
      `  Done: next_item_id=${correctNextItemId}, total_minted=${onChainItems.length}`
    );
  }

  // ── Apply: user_monsters ──────────────────────────────────────────────

  for (const fix of monsterFixes) {
    if (fix.action === 'create') {
      console.log(`  Creating user_monsters for ${fix.userName}...`);
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO user_monsters (
           id, user_id, current_stage,
           nft_item_id, nft_collection_id, nft_owner_address,
           current_metadata_cid,
           young_image_s3_key, young_model_s3_key, adult_model_s3_key,
           generation_prompt, generation_style, attributes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          fix.userId,
          fix.currentStage,
          fix.nftItemId,
          COLLECTION_ID,
          fix.nftOwnerAddress,
          fix.nftMetadataCid,
          fix.youngImageS3Key,
          fix.youngModelS3Key,
          fix.adultModelS3Key,
          fix.generationPrompt,
          fix.generationStyle,
          JSON.stringify({}),
        ]
      );

      // Link generation jobs to this monster
      await pool.query(
        `UPDATE monster_generations SET monster_id = $1 WHERE id = ANY($2) AND user_id = $3`,
        [
          id,
          [fix.youngGenId, fix.adultGenId].filter(Boolean),
          fix.userId,
        ]
      );

      console.log(`  Created ${id} for ${fix.userName}`);
    } else {
      console.log(
        `  Updating user_monsters ${fix.existingMonsterId!.substring(0, 8)}... for ${fix.userName}...`
      );

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      // Always populate S3 keys if missing
      updates.push(`young_image_s3_key = COALESCE(young_image_s3_key, $${idx++})`);
      values.push(fix.youngImageS3Key);

      updates.push(`young_model_s3_key = COALESCE(young_model_s3_key, $${idx++})`);
      values.push(fix.youngModelS3Key);

      if (fix.adultModelS3Key) {
        updates.push(`adult_model_s3_key = COALESCE(adult_model_s3_key, $${idx++})`);
        values.push(fix.adultModelS3Key);
      }

      if (fix.nftItemId !== null) {
        updates.push(`nft_item_id = COALESCE(nft_item_id, $${idx++})`);
        values.push(fix.nftItemId);
      }

      if (fix.nftOwnerAddress) {
        updates.push(`nft_owner_address = COALESCE(nft_owner_address, $${idx++})`);
        values.push(fix.nftOwnerAddress);
      }

      if (fix.nftMetadataCid) {
        updates.push(`current_metadata_cid = COALESCE(current_metadata_cid, $${idx++})`);
        values.push(fix.nftMetadataCid);
      }

      values.push(fix.existingMonsterId);

      await pool.query(
        `UPDATE user_monsters SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
        values
      );

      console.log(`  Updated`);
    }
  }

  // ── Apply: minting ────────────────────────────────────────────────────

  if (mintMode && needsMinting.length > 0) {
    header('MINTING NFTs');

    if (!process.env.PINATA_JWT || !process.env.PLATFORM_ACCOUNT_SEED) {
      console.log(
        '  PINATA_JWT or PLATFORM_ACCOUNT_SEED not set. Cannot mint.'
      );
    } else {
      // Dynamically import Pinata + S3
      const { PinataSDK } = await import('pinata');
      const pinata = new PinataSDK({
        pinataJwt: process.env.PINATA_JWT!,
        pinataGateway: process.env.PINATA_GATEWAY!,
      });

      // Import S3 service for downloading assets
      const { S3Service } = await import('../src/services/s3-service');
      const s3 = S3Service.getInstance();

      // Load platform account for signing
      const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
      const platformAccount = keyring.addFromMnemonic(
        process.env.PLATFORM_ACCOUNT_SEED!
      );
      console.log(`  Platform account: ${platformAccount.address}`);

      // Re-read current next_item_id after counter fix
      const stateRow = (
        await pool.query(
          'SELECT next_item_id FROM nft_collection_state WHERE collection_id = $1',
          [COLLECTION_ID]
        )
      ).rows[0];
      let nextItemId: number = stateRow.next_item_id;

      for (const fix of needsMinting) {
        console.log('');
        console.log(`  Minting NFT for ${fix.userName}...`);
        const itemId = nextItemId++;

        try {
          // 1. Upload image to IPFS
          console.log(`    Downloading image from S3: ${fix.youngImageS3Key}`);
          const imageBuffer = await s3.downloadFile(fix.youngImageS3Key);
          const imageFile = new File(
            [new Uint8Array(imageBuffer)],
            `${fix.youngGenId}-monster.png`,
            { type: 'image/png' }
          );
          const imageUpload = await pinata.upload.public.file(imageFile);
          const imageCID = imageUpload.cid;
          console.log(`    Image CID: ${imageCID}`);

          // 2. Upload GLB to IPFS
          console.log(`    Downloading model from S3: ${fix.youngModelS3Key}`);
          const glbBuffer = await s3.downloadFile(fix.youngModelS3Key);
          const glbFile = new File(
            [new Uint8Array(glbBuffer)],
            `${fix.youngGenId}-monster.glb`,
            { type: 'model/gltf-binary' }
          );
          const glbUpload = await pinata.upload.public.file(glbFile);
          const modelCID = glbUpload.cid;
          console.log(`    Model CID: ${modelCID}`);

          // 3. Create and upload metadata
          const metadata = {
            name: `Monster #${fix.youngGenId.substring(0, 8)}`,
            description: `Monsters Ink! creature generated for ${fix.userName}`,
            image: `ipfs://${imageCID}`,
            animation_url: `ipfs://${modelCID}`,
            external_url: `https://monsters.ink/monster/${fix.youngGenId}`,
            attributes: [
              { trait_type: 'Style', value: fix.generationStyle },
              { trait_type: 'Stage', value: 'young' },
              { trait_type: 'Has 3D Model', value: 'Yes' },
              {
                trait_type: 'Generated',
                value: new Date().toISOString().split('T')[0],
              },
            ],
          };
          const metadataUpload = await pinata.upload.public.json(metadata);
          const metadataCID = metadataUpload.cid;
          console.log(`    Metadata CID: ${metadataCID}`);

          // 4. Mint on-chain
          console.log(
            `    Minting item ${itemId} to ${fix.nftOwnerAddress}...`
          );

          const mintTx = api.tx.nfts.mint(
            COLLECTION_ID,
            itemId,
            fix.nftOwnerAddress!,
            null
          );
          const metadataTx = api.tx.nfts.setMetadata(
            COLLECTION_ID,
            itemId,
            `ipfs://${metadataCID}`
          );
          const batchTx = api.tx.utility.batchAll([mintTx, metadataTx]);

          const mintResult = await new Promise<{
            success: boolean;
            txHash: string;
            blockHash: string;
            error?: string;
          }>((resolve) => {
            const timeout = setTimeout(() => {
              resolve({
                success: false,
                txHash: '',
                blockHash: '',
                error: 'Timeout after 120s',
              });
            }, 120000);

            batchTx
              .signAndSend(
                platformAccount,
                ({ status, events, dispatchError }) => {
                  if (status.isFinalized) {
                    clearTimeout(timeout);
                    if (dispatchError) {
                      let errorMsg = dispatchError.toString();
                      if (dispatchError.isModule) {
                        try {
                          const decoded = api.registry.findMetaError(
                            dispatchError.asModule
                          );
                          errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                        } catch {}
                      }
                      resolve({
                        success: false,
                        txHash: batchTx.hash.toHex(),
                        blockHash: status.asFinalized.toHex(),
                        error: errorMsg,
                      });
                    } else {
                      resolve({
                        success: true,
                        txHash: batchTx.hash.toHex(),
                        blockHash: status.asFinalized.toHex(),
                      });
                    }
                  }
                }
              )
              .catch((err) => {
                clearTimeout(timeout);
                resolve({
                  success: false,
                  txHash: '',
                  blockHash: '',
                  error: String(err),
                });
              });
          });

          if (!mintResult.success) {
            console.log(`    MINT FAILED: ${mintResult.error}`);
            continue;
          }

          console.log(`    Minted! tx=${mintResult.txHash.substring(0, 20)}... block=${mintResult.blockHash.substring(0, 20)}...`);

          // 5. Update DB: generation job
          await pool.query(
            `UPDATE monster_generations
             SET nft_item_id = $1, nft_collection_id = $2, nft_tx_hash = $3,
                 nft_block_hash = $4, nft_minted_at = NOW(), nft_owner_address = $5,
                 nft_metadata_cid = $6, nft_image_cid = $7, nft_model_cid = $8
             WHERE id = $9`,
            [
              itemId,
              COLLECTION_ID,
              mintResult.txHash,
              mintResult.blockHash,
              fix.nftOwnerAddress,
              metadataCID,
              imageCID,
              modelCID,
              fix.youngGenId,
            ]
          );

          // 6. Update DB: user_monsters
          await pool.query(
            `UPDATE user_monsters
             SET nft_item_id = $1, nft_collection_id = $2, nft_owner_address = $3,
                 current_metadata_cid = $4, young_image_cid = $5, young_model_cid = $6,
                 updated_at = NOW()
             WHERE user_id = $7`,
            [
              itemId,
              COLLECTION_ID,
              fix.nftOwnerAddress,
              metadataCID,
              imageCID,
              modelCID,
              fix.userId,
            ]
          );

          // 7. Update counter
          await pool.query(
            `UPDATE nft_collection_state
             SET next_item_id = $1, total_minted = total_minted + 1, updated_at = NOW()
             WHERE collection_id = $2`,
            [nextItemId, COLLECTION_ID]
          );

          console.log(`    DB updated. NFT item ${itemId} assigned.`);
        } catch (err) {
          console.log(`    ERROR: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  // ── Final verification ────────────────────────────────────────────────

  header('FINAL STATE');

  const finalState = (
    await pool.query(
      'SELECT * FROM nft_collection_state WHERE collection_id = $1',
      [COLLECTION_ID]
    )
  ).rows[0];
  console.log('  nft_collection_state:');
  line('next_item_id', finalState.next_item_id);
  line('total_minted', finalState.total_minted);

  const finalMonsters = (
    await pool.query(
      `SELECT um.*, u.name as user_name FROM user_monsters um JOIN "user" u ON u.id = um.user_id ORDER BY um.created_at`
    )
  ).rows;
  console.log('');
  console.log(`  user_monsters: ${finalMonsters.length} records`);
  for (const m of finalMonsters) {
    console.log(
      `    ${m.user_name}: stage=${m.current_stage} nft=${m.nft_item_id ?? '--'} img=${m.young_image_s3_key ? 'yes' : 'no'} model=${m.young_model_s3_key ? 'yes' : 'no'} adult=${m.adult_model_s3_key ? 'yes' : 'no'} wallet=${m.nft_owner_address ? m.nft_owner_address.substring(0, 16) + '...' : '(none)'}`
    );
  }

  await api.disconnect();
  await pool.end();
  console.log('');
  console.log('Done.');
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
