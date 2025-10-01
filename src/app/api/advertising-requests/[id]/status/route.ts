import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import { isValidStatusTransition } from '@/lib/utils/advertising-request-helpers';
import { notifyStatusChange, notifyRequestAssigned, getNotificationRecipients } from '@/lib/services/email';

/**
 * PUT /api/advertising-requests/[id]/status
 * Update advertising request status with workflow validation
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
    const { status, notes, assigned_to_user_id, completion_data } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Find existing request
    const existingRequest = await AdvertisingRequest.findById(id);
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Validate status transition
    if (!isValidStatusTransition(existingRequest.status, status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${existingRequest.status} to ${status}` },
        { status: 400 }
      );
    }
    
    // Validate completion data if status is 'completed'
    if (status === 'completed') {
      if (!completion_data?.selected_campaign_id || !completion_data?.selected_advertisement_id) {
        return NextResponse.json(
          { error: 'Campaign and Advertisement selection required for completion' },
          { status: 400 }
        );
      }
      
      existingRequest.completed_campaign_id = completion_data.selected_campaign_id;
      existingRequest.completed_advertisement_ids = [completion_data.selected_advertisement_id];
      existingRequest.completed_at = new Date();
      existingRequest.completed_by_user_id = userId;
    }
    
    const oldStatus = existingRequest.status;
    const oldAssignedTo = existingRequest.assigned_to_user_id;
    
    existingRequest.status = status;
    
    if (assigned_to_user_id !== undefined) {
      existingRequest.assigned_to_user_id = assigned_to_user_id;
    }
    
    const statusHistoryEntry = {
      status,
      changed_by_user_id: userId,
      changed_by_user_name: existingRequest.created_by_user_name,
      changed_by_user_email: existingRequest.created_by_user_email,
      changed_at: new Date(),
      notes: notes || `Status changed to ${status}`,
    };
    
    existingRequest.status_history.push(statusHistoryEntry);
    
    // Save the updated request
    await existingRequest.save();
    
    // Send notifications
    try {
      const recipients = getNotificationRecipients('status_changed');
      
      // Status change notification
      if (recipients.length > 0) {
        await notifyStatusChange(
          existingRequest,
          oldStatus,
          status,
          userId,
          recipients,
          notes
        );
      }
      
      // Assignment notification (if assignment changed)
      if (assigned_to_user_id && assigned_to_user_id !== oldAssignedTo && recipients.length > 0) {
        await notifyRequestAssigned(
          existingRequest,
          assigned_to_user_id,
          userId,
          recipients
        );
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the status update if email fails
    }
    
    return NextResponse.json({
      message: 'Status updated successfully',
      request: existingRequest.toObject({ virtuals: true }),
    });
    
  } catch (error: any) {
    console.error('Error updating status:', error);
    
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
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advertising-requests/[id]/status
 * Get status history for a request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const advertisingRequest = await AdvertisingRequest.findById(id)
      .select('status status_history request_number')
      .lean({ virtuals: true }) as unknown as any;
    
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      request_number: advertisingRequest.request_number,
      current_status: advertisingRequest.status,
      status_history: advertisingRequest.status_history,
    });
    
  } catch (error) {
    console.error('Error fetching status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}
