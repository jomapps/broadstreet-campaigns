import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import { validateAdvertisingRequestData } from '@/lib/utils/advertising-request-helpers';
import { notifyRequestCreated, getNotificationRecipients } from '@/lib/services/email';

/**
 * GET /api/advertising-requests
 * List advertising requests with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const searchTerm = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Build filter query
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (assignedTo) {
      filter.assigned_to = assignedTo;
    }
    
    if (searchTerm) {
      filter.$or = [
        { 'advertiser_info.company_name': { $regex: searchTerm, $options: 'i' } },
        { 'advertiser_info.contact_person': { $regex: searchTerm, $options: 'i' } },
        { 'advertisement.name': { $regex: searchTerm, $options: 'i' } },
        { request_number: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const [requests, totalCount] = await Promise.all([
      AdvertisingRequest.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }) as unknown as any[],
      AdvertisingRequest.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
    
  } catch (error) {
    console.error('Error fetching advertising requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertising requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advertising-requests
 * Create new advertising request
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const validation = validateAdvertisingRequestData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    // Create new advertising request
    const requestData = {
      ...body,
      created_by: userId,
      last_modified_by: userId,
      status: 'New',
    };
    
    const advertisingRequest = new AdvertisingRequest(requestData);
    await advertisingRequest.save();
    
    // Send notification emails (placeholder)
    try {
      const recipients = getNotificationRecipients('request_created');
      if (recipients.length > 0) {
        await notifyRequestCreated(advertisingRequest, recipients);
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request creation if email fails
    }
    
    return NextResponse.json(
      {
        message: 'Advertising request created successfully',
        request: advertisingRequest.toObject({ virtuals: true }),
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error creating advertising request:', error);
    
    // Handle duplicate key error (request_number should be unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Request with this number already exists' },
        { status: 409 }
      );
    }
    
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
      { error: 'Failed to create advertising request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advertising-requests
 * Bulk delete advertising requests (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { request_ids } = body;
    
    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return NextResponse.json(
        { error: 'request_ids array is required' },
        { status: 400 }
      );
    }
    
    // Only allow deletion of New or Cancelled requests
    const deletableRequests = await AdvertisingRequest.find({
      _id: { $in: request_ids },
      status: { $in: ['New', 'Cancelled'] }
    });
    
    if (deletableRequests.length !== request_ids.length) {
      return NextResponse.json(
        { error: 'Can only delete requests with status New or Cancelled' },
        { status: 400 }
      );
    }
    
    // Delete the requests
    const deleteResult = await AdvertisingRequest.deleteMany({
      _id: { $in: request_ids }
    });
    
    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} advertising requests`,
      deletedCount: deleteResult.deletedCount,
    });
    
  } catch (error) {
    console.error('Error deleting advertising requests:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertising requests' },
      { status: 500 }
    );
  }
}
