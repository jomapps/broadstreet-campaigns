import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadFileToR2 } from '@/lib/services/r2-upload';
import { getImageDimensionsFromBuffer, analyzeImageDimensions, validateImageFile, generateSafeFilename } from '@/lib/utils/image-processing';

/**
 * POST /api/advertising-requests/upload
 * Upload image files for advertising requests
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const requestNumber = formData.get('requestNumber') as string;
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    if (!requestNumber) {
      return NextResponse.json(
        { error: 'Request number is required' },
        { status: 400 }
      );
    }
    
    const uploadResults = [];
    const errors = [];
    
    for (const file of files) {
      try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          errors.push({
            filename: file.name,
            error: validation.errors.join(', '),
          });
          continue;
        }
        
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Get image dimensions
        const dimensions = await getImageDimensionsFromBuffer(buffer);
        const imageInfo = analyzeImageDimensions(dimensions.width, dimensions.height);
        
        // Generate safe filename
        const safeFilename = generateSafeFilename(file.name, requestNumber);
        
        // Upload to R2
        const uploadResult = await uploadFileToR2(
          buffer,
          safeFilename,
          file.type,
          'advertising-requests'
        );
        
        if (uploadResult.success) {
          uploadResults.push({
            filename: safeFilename,
            original_name: file.name,
            file_path: uploadResult.filePath,
            public_url: uploadResult.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            width: imageInfo.width,
            height: imageInfo.height,
            size_coding: imageInfo.size_coding,
            aspect_ratio: imageInfo.aspect_ratio,
            uploaded_at: new Date(),
          });
        } else {
          errors.push({
            filename: file.name,
            error: uploadResult.error || 'Upload failed',
          });
        }
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        errors.push({
          filename: file.name,
          error: fileError instanceof Error ? fileError.message : 'Processing failed',
        });
      }
    }
    
    return NextResponse.json({
      message: `Processed ${files.length} files`,
      successful_uploads: uploadResults,
      failed_uploads: errors,
      summary: {
        total: files.length,
        successful: uploadResults.length,
        failed: errors.length,
      },
    });
    
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
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
        max_files_per_request: 10,
        size_coding: {
          SQ: 'Square (1:1 ratio)',
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
