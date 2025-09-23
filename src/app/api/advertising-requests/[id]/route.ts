import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import { validateAdvertisingRequestData, isValidStatusTransition } from '@/lib/utils/advertising-request-helpers';
import { notifyStatusChange, getNotificationRecipients } from '@/lib/services/email';
import { deleteFileFromR2 } from '@/lib/services/r2-upload';

/**
 * GET /api/advertising-requests/[id]
 * Get single advertising request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const advertisingRequest = await AdvertisingRequest.findById(id)
      .lean({ virtuals: true }) as unknown as any;
    
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ request: advertisingRequest });
    
  } catch (error) {
    console.error('Error fetching advertising request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertising request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/advertising-requests/[id]
 * Update advertising request
 */
export async function PUT(
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
    
    // Find existing request
    const existingRequest = await AdvertisingRequest.findById(id);
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Don't allow updates to completed or cancelled requests
    if (['Completed', 'Cancelled'].includes(existingRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot update completed or cancelled requests' },
        { status: 400 }
      );
    }
    
    // Validate request data if provided
    if (body.advertiser_info || body.advertisement || body.ai_intelligence) {
      const validation = validateAdvertisingRequestData({
        ...existingRequest.toObject(),
        ...body,
      });
      
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validation.errors 
          },
          { status: 400 }
        );
      }
    }
    
    // Handle status changes
    let statusChanged = false;
    let oldStatus = existingRequest.status;
    
    if (body.status && body.status !== existingRequest.status) {
      if (!isValidStatusTransition(existingRequest.status, body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existingRequest.status} to ${body.status}` },
          { status: 400 }
        );
      }
      
      statusChanged = true;
      
      // Add to status history
      const statusHistoryEntry = {
        status: body.status,
        changed_by: userId,
        changed_at: new Date(),
        notes: body.status_notes || `Status changed to ${body.status}`,
      };
      
      existingRequest.status_history.push(statusHistoryEntry);
    }
    
    // Update fields
    const updateData = {
      ...body,
      last_modified_by: userId,
      updatedAt: new Date(),
    };
    
    // Remove status_notes from update data (it's only for history)
    delete updateData.status_notes;
    
    // Update the request
    const updatedRequest = await AdvertisingRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean({ virtuals: true }) as unknown as any;
    
    // Send status change notification if status changed
    if (statusChanged) {
      try {
        const recipients = getNotificationRecipients('status_changed');
        if (recipients.length > 0) {
          await notifyStatusChange(
            updatedRequest,
            oldStatus,
            body.status,
            userId,
            recipients,
            body.status_notes
          );
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the update if email fails
      }
    }
    
    return NextResponse.json({
      message: 'Advertising request updated successfully',
      request: updatedRequest,
    });
    
  } catch (error: any) {
    console.error('Error updating advertising request:', error);
    
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
      { error: 'Failed to update advertising request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advertising-requests/[id]
 * Delete advertising request
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
    
    // Find the request
    const advertisingRequest = await AdvertisingRequest.findById(id);
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Only allow deletion of New or Cancelled requests
    if (!['New', 'Cancelled'].includes(advertisingRequest.status)) {
      return NextResponse.json(
        { error: 'Can only delete requests with status New or Cancelled' },
        { status: 400 }
      );
    }
    
    // Delete associated files from R2 storage
    const fileDeletionPromises = advertisingRequest.advertisement.image_files.map(
      (file: any) => deleteFileFromR2(file.file_path)
    );
    
    try {
      await Promise.all(fileDeletionPromises);
    } catch (fileError) {
      console.error('Error deleting files from R2:', fileError);
      // Continue with request deletion even if file deletion fails
    }
    
    // Delete the request
    await AdvertisingRequest.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Advertising request deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting advertising request:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertising request' },
      { status: 500 }
    );
  }
}
