/**
 * NFT Metadata Service
 * Handles uploading monster assets to IPFS via Pinata and creating NFT metadata
 */

import { PinataSDK } from 'pinata';
import { S3Service } from './s3-service';

// Suppress Pinata SDK warnings
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args[0]?.toString() || '';
  if (msg.includes('Pinata') || msg.includes('pinata')) return;
  originalWarn.apply(console, args);
};

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;           // ipfs://CID
  animation_url?: string;  // ipfs://CID (for 3D model)
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface PrepareNFTAssetsResult {
  imageCID: string;
  modelCID: string | null;
  metadataCID: string;
  metadataUrl: string;
}

export class NFTMetadataService {
  private static instance: NFTMetadataService;
  private pinata: PinataSDK;
  private s3Service: S3Service;
  private gateway: string;
  private gatewayKey: string | null;

  private constructor() {
    if (!process.env.PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable is required');
    }
    if (!process.env.PINATA_GATEWAY) {
      throw new Error('PINATA_GATEWAY environment variable is required');
    }

    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY,
    });
    this.s3Service = S3Service.getInstance();
    this.gateway = process.env.PINATA_GATEWAY;
    this.gatewayKey = process.env.PINATA_GATEWAY_KEY || null;
  }

  static getInstance(): NFTMetadataService {
    if (!NFTMetadataService.instance) {
      NFTMetadataService.instance = new NFTMetadataService();
    }
    return NFTMetadataService.instance;
  }

  /**
   * Upload a file from S3 to IPFS
   */
  async uploadFileToIPFS(s3Key: string, filename: string, contentType: string): Promise<string> {
    console.log(`[NFTMetadata] Downloading ${s3Key} from S3...`);

    const buffer = await this.s3Service.downloadFile(s3Key);
    console.log(`[NFTMetadata] Downloaded ${buffer.length} bytes, uploading to IPFS...`);

    // Convert Buffer to Uint8Array for File constructor compatibility
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], filename, { type: contentType });
    const upload = await this.pinata.upload.public.file(file);

    console.log(`[NFTMetadata] Uploaded to IPFS: ${upload.cid}`);
    return upload.cid;
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
    console.log(`[NFTMetadata] Uploading metadata to IPFS...`);

    const upload = await this.pinata.upload.public.json(metadata);

    console.log(`[NFTMetadata] Metadata uploaded: ${upload.cid}`);
    return upload.cid;
  }

  /**
   * Prepare all NFT assets: upload image, model, and metadata to IPFS
   */
  async prepareNFTAssets(params: {
    jobId: string;
    name: string;
    description: string;
    imageS3Key: string;
    glbS3Key: string | null;
    style: string;
    stage: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  }): Promise<PrepareNFTAssetsResult> {
    const { jobId, name, description, imageS3Key, glbS3Key, style, stage, attributes } = params;

    console.log(`[NFTMetadata] Preparing NFT assets for job ${jobId}`);

    // 1. Upload image to IPFS
    const imageCID = await this.uploadFileToIPFS(
      imageS3Key,
      `${jobId}-monster.png`,
      'image/png'
    );

    // 2. Upload 3D model to IPFS (if exists)
    let modelCID: string | null = null;
    if (glbS3Key) {
      modelCID = await this.uploadFileToIPFS(
        glbS3Key,
        `${jobId}-monster.glb`,
        'model/gltf-binary'
      );
    }

    // 3. Create metadata
    const metadata: NFTMetadata = {
      name,
      description,
      image: `ipfs://${imageCID}`,
      animation_url: modelCID ? `ipfs://${modelCID}` : undefined,
      external_url: `https://monsters.ink/monster/${jobId}`,
      attributes: [
        { trait_type: 'Style', value: style },
        { trait_type: 'Stage', value: stage },
        { trait_type: 'Has 3D Model', value: modelCID ? 'Yes' : 'No' },
        { trait_type: 'Generated', value: new Date().toISOString().split('T')[0] },
        ...(attributes || []),
      ],
    };

    // 4. Upload metadata to IPFS
    const metadataCID = await this.uploadMetadataToIPFS(metadata);

    console.log(`[NFTMetadata] All assets prepared for job ${jobId}`);
    console.log(`  Image CID: ${imageCID}`);
    console.log(`  Model CID: ${modelCID || 'N/A'}`);
    console.log(`  Metadata CID: ${metadataCID}`);

    return {
      imageCID,
      modelCID,
      metadataCID,
      metadataUrl: `ipfs://${metadataCID}`,
    };
  }

  /**
   * Test IPFS connectivity
   */
  async testConnectivity(): Promise<{ ok: boolean; error?: string }> {
    try {
      // Upload a small test JSON
      const testData = { test: true, timestamp: Date.now() };
      const upload = await this.pinata.upload.public.json(testData);

      // Try to retrieve it via dedicated gateway (with auth if configured)
      const url = `https://${this.gateway}/ipfs/${upload.cid}`;
      const headers: HeadersInit = {};
      if (this.gatewayKey) {
        headers['x-pinata-gateway-token'] = this.gatewayKey;
      }
      const response = await fetch(url, { method: 'HEAD', headers });

      if (response.ok) {
        return { ok: true };
      }
      return { ok: false, error: `Gateway returned ${response.status}` };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
