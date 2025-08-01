import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `nft-${uuidv4()}.png`;
    
    // Ensure the nfts directory exists
    const uploadsDir = join(process.cwd(), 'public', 'nfts');
    await mkdir(uploadsDir, { recursive: true });
    
    // Save the file
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      url: `/nfts/${filename}`,
      message: 'NFT snapshot saved successfully'
    });

  } catch (error) {
    console.error('Error saving NFT snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to save NFT snapshot' },
      { status: 500 }
    );
  }
}