import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import { deleteFileFromR2 } from '@/lib/services/r2-upload';

/**
 * GET /api/advertising-requests/[id]/images
 * Get all images for a specific advertising request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const advertisingRequest = await AdvertisingRequest.findById(id)
      .select('advertisement.image_files request_number')
      .lean({ virtuals: true }) as unknown as any;
    
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      request_number: advertisingRequest.request_number,
      images: advertisingRequest.advertisement.image_files,
      total_images: advertisingRequest.advertisement.image_files.length,
    });
    
  } catch (error) {
    console.error('Error fetching request images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advertising-requests/[id]/images
 * Add new images to an existing advertising request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { image_files } = body;
    
    if (!Array.isArray(image_files) || image_files.length === 0) {
      return NextResponse.json(
        { error: 'image_files array is required' },
        { status: 400 }
      );
    }
    
    // Find the advertising request
    const advertisingRequest = await AdvertisingRequest.findById(id);
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Don't allow adding images to completed or cancelled requests
    if (['Completed', 'Cancelled'].includes(advertisingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot add images to completed or cancelled requests' },
        { status: 400 }
      );
    }
    
    // Add new images to the existing array
    advertisingRequest.advertisement.image_files.push(...image_files);
    advertisingRequest.last_modified_by = userId;
    
    await advertisingRequest.save();
    
    return NextResponse.json({
      message: `Added ${image_files.length} images successfully`,
      request: advertisingRequest.toObject({ virtuals: true }),
    });
    
  } catch (error: any) {
    console.error('Error adding images to request:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add images to request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advertising-requests/[id]/images
 * Remove specific images from an advertising request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { filenames } = body;
    
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json(
        { error: 'filenames array is required' },
        { status: 400 }
      );
    }
    
    // Find the advertising request
    const advertisingRequest = await AdvertisingRequest.findById(id);
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Don't allow removing images from completed or cancelled requests
    if (['Completed', 'Cancelled'].includes(advertisingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot remove images from completed or cancelled requests' },
        { status: 400 }
      );
    }
    
    // Find images to delete
    const imagesToDelete = advertisingRequest.advertisement.image_files.filter(
      (img: any) => filenames.includes(img.filename)
    );
    
    if (imagesToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No matching images found' },
        { status: 404 }
      );
    }
    
    // Delete files from R2 storage
    const deletionPromises = imagesToDelete.map((img: any) => 
      deleteFileFromR2(img.file_path)
    );
    
    try {
      await Promise.all(deletionPromises);
    } catch (fileError) {
      console.error('Error deleting files from R2:', fileError);
      // Continue with database update even if file deletion fails
    }
    
    // Remove images from the request
    advertisingRequest.advertisement.image_files = advertisingRequest.advertisement.image_files.filter(
      (img: any) => !filenames.includes(img.filename)
    );
    
    advertisingRequest.last_modified_by = userId;
    await advertisingRequest.save();
    
    return NextResponse.json({
      message: `Removed ${imagesToDelete.length} images successfully`,
      removed_images: imagesToDelete.map((img: any) => img.filename),
      remaining_images: advertisingRequest.advertisement.image_files.length,
    });
    
  } catch (error) {
    console.error('Error removing images from request:', error);
    return NextResponse.json(
      { error: 'Failed to remove images from request' },
      { status: 500 }
    );
  }
}
