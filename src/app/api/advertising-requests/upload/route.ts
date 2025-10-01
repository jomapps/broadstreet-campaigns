import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sizeOf from 'image-size';
import { auth } from '@clerk/nextjs/server';

// Initialize S3 Client for Cloudflare R2
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_EP,
  credentials: {
    accessKeyId: process.env.S3_ID!,
    secretAccessKey: process.env.S3_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || 'travelm-bucket';
const PUBLIC_BUCKET_URL = process.env.PUBLIC_BUCKET || 'https://media.travelm.de/travelm-bucket/';

/**
 * POST /api/advertising-requests/upload
 * Upload image to Cloudflare R2 and return metadata
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (20MB max)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 20MB' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions using image-size
    let dimensions: { width: number; height: number };
    try {
      const imageDimensions = sizeOf(buffer);
      if (!imageDimensions.width || !imageDimensions.height) {
        throw new Error('Could not determine image dimensions');
      }
      dimensions = {
        width: imageDimensions.width,
        height: imageDimensions.height,
      };
    } catch (error) {
      console.error('Error detecting image dimensions:', error);
      return NextResponse.json(
        { error: 'Failed to detect image dimensions. Please ensure the file is a valid image.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `advertising-requests/${timestamp}-${randomString}.${fileExtension}`;

    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `${PUBLIC_BUCKET_URL}${fileName}`;

    // Return upload result with metadata
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: fileName,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advertising-requests/upload
 * Get upload configuration and limits
 */
export async function GET() {
  try {
    return NextResponse.json({
      config: {
        max_file_size: 20 * 1024 * 1024, // 20MB
        allowed_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        size_coding: {
          SQ: 'Square (roughly 1:1 ratio)',
          PT: 'Portrait (height > width)',
          LS: 'Landscape (width > height)',
        },
      },
    });
  } catch (error) {
    console.error('Error getting upload config:', error);
    return NextResponse.json(
      { error: 'Failed to get upload configuration' },
      { status: 500 }
    );
  }
}