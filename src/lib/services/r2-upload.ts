/**
 * Cloudflare R2 Upload Service
 * Handles file uploads to Cloudflare R2 storage for advertising requests
 * Based on official Cloudflare R2 documentation: https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
 */

// Conditional imports for AWS SDK - will be loaded dynamically when available
// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
//   GetObjectCommand,
//   ListObjectsV2Command,
//   type PutObjectCommandInput,
//   type DeleteObjectCommandInput,
//   type GetObjectCommandInput,
// } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Type definitions for when AWS SDK is not available
type S3Client = any;
type PutObjectCommandInput = any;
type DeleteObjectCommandInput = any;
type GetObjectCommandInput = any;

// R2 Configuration following Cloudflare's recommended environment variable names
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucketName: process.env.R2_BUCKET_NAME!,
  publicUrl: process.env.R2_PUBLIC_URL!,
};

// Validate required environment variables
function validateR2Config() {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missing.join(', ')}`);
  }
}

// Initialize S3 client for Cloudflare R2
let s3Client: S3Client | null = null;

async function getS3Client(): Promise<S3Client> {
  if (!s3Client) {
    validateR2Config();

    try {
      // Dynamic import of AWS SDK
      const { S3Client } = await import('@aws-sdk/client-s3');

      // Create S3Client following Cloudflare R2 documentation
      s3Client = new S3Client({
        region: 'auto', // Cloudflare R2 uses 'auto' region
        endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_CONFIG.accessKeyId,
          secretAccessKey: R2_CONFIG.secretAccessKey,
        },
      });
    } catch (error) {
      throw new Error('AWS SDK not available. Please install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner');
    }
  }

  return s3Client;
}

/**
 * Upload file to Cloudflare R2 storage
 */
export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
  etag?: string;
  size?: number;
}

export async function uploadFileToR2(
  fileBuffer: Buffer,
  filename: string,
  contentType: string,
  folder: string = 'advertising-requests'
): Promise<UploadResult> {
  try {
    const client = await getS3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const key = `${folder}/${filename}`;

    const command: PutObjectCommandInput = {
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // Set cache control for images (1 year)
      CacheControl: 'public, max-age=31536000',
      // Add metadata for tracking
      Metadata: {
        'upload-source': 'advertising-request',
        'upload-timestamp': new Date().toISOString(),
      },
    };

    const result = await client.send(new PutObjectCommand(command));

    // Construct public URL using the configured public URL
    const publicUrl = `${R2_CONFIG.publicUrl}/${key}`;

    return {
      success: true,
      filePath: key,
      publicUrl,
      etag: result.ETag,
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete file from Cloudflare R2 storage
 */
export async function deleteFileFromR2(filePath: string): Promise<boolean> {
  try {
    const client = await getS3Client();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const command: DeleteObjectCommandInput = {
      Bucket: R2_CONFIG.bucketName,
      Key: filePath,
    };

    await client.send(new DeleteObjectCommand(command));
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Generate presigned URL for upload to Cloudflare R2
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = await getS3Client();
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate presigned URL for download from Cloudflare R2
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = await getS3Client();
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * List files in Cloudflare R2 bucket
 */
export async function listFiles(
  prefix?: string,
  maxKeys?: number
): Promise<Array<{ key: string; size: number; lastModified: Date; etag: string }>> {
  try {
    const client = await getS3Client();
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const result = await client.send(command);

    return (result.Contents || []).map(item => ({
      key: item.Key!,
      size: item.Size!,
      lastModified: item.LastModified!,
      etag: item.ETag!,
    }));
  } catch (error) {
    console.error('R2 list files error:', error);
    return [];
  }
}

/**
 * Batch upload multiple files to Cloudflare R2
 */
export async function batchUploadFiles(
  files: Array<{
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder?: string;
  }>
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFileToR2(
      file.buffer,
      file.filename,
      file.contentType,
      file.folder
    );
    results.push(result);
  }

  return results;
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(filePath: string): string {
  return `${R2_CONFIG.publicUrl}/${filePath}`;
}

/**
 * Clean up files for a specific request (when request is deleted)
 */
export async function cleanupRequestFiles(requestNumber: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const prefix = `advertising-requests/${requestNumber}`;

    // List all objects with the request prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      Prefix: prefix,
    });

    const listResult = await client.send(listCommand);

    if (listResult.Contents && listResult.Contents.length > 0) {
      // Delete all files for this request
      const deletePromises = listResult.Contents.map(object =>
        client.send(new DeleteObjectCommand({
          Bucket: R2_CONFIG.bucketName,
          Key: object.Key!,
        }))
      );

      await Promise.all(deletePromises);
      console.log(`Cleaned up ${listResult.Contents.length} files for request ${requestNumber}`);
    }

    return true;
  } catch (error) {
    console.error('Cleanup error:', error);
    return false;
  }
}

/**
 * Validate R2 connection and configuration
 */
export async function validateR2Connection(): Promise<boolean> {
  try {
    const client = getS3Client();

    // Try to list objects (this will validate credentials)
    const command = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucketName,
      MaxKeys: 1, // Just check if we can access the bucket
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('R2 connection validation failed:', error);
    return false;
  }
}
