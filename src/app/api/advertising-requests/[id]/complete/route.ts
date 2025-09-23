import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import AdvertisingRequest from '@/lib/models/advertising-request';
import Campaign from '@/lib/models/campaign';
import Advertisement from '@/lib/models/advertisement';
import { notifyStatusChange, getNotificationRecipients } from '@/lib/services/email';

/**
 * POST /api/advertising-requests/[id]/complete
 * Mark advertising request as completed with campaign/advertisement selection
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
    const { selected_campaign_id, selected_advertisement_id, completion_notes } = body;
    
    // Validate required fields
    if (!selected_campaign_id || !selected_advertisement_id) {
      return NextResponse.json(
        { error: 'Both campaign and advertisement selection are required' },
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
    
    // Validate current status
    if (advertisingRequest.status !== 'In Progress') {
      return NextResponse.json(
        { error: 'Only requests with status "In Progress" can be completed' },
        { status: 400 }
      );
    }
    
    // Verify that the selected campaign and advertisement exist and are synced
    const [campaign, advertisement] = await Promise.all([
      Campaign.findOne({
        broadstreet_id: selected_campaign_id,
        synced_with_api: true
      }).lean() as unknown as any,
      Advertisement.findOne({
        broadstreet_id: selected_advertisement_id,
        synced_with_api: true
      }).lean() as unknown as any
    ]);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Selected campaign not found or not synced with Broadstreet' },
        { status: 400 }
      );
    }

    if (!advertisement) {
      return NextResponse.json(
        { error: 'Selected advertisement not found or not synced with Broadstreet' },
        { status: 400 }
      );
    }

    // Note: Advertisement model has 'advertiser' (string) field, not 'advertiser_id'
    // For now, we'll skip the advertiser validation since the data models are different
    // This validation can be added later when the models are aligned

    // TODO: Verify that the advertisement belongs to the same advertiser as the campaign
    // if (campaign.advertiser_id !== advertisement.advertiser_id) {
    //   return NextResponse.json(
    //     { error: 'Selected advertisement must belong to the same advertiser as the campaign' },
    //     { status: 400 }
    //   );
    // }
    
    const oldStatus = advertisingRequest.status;
    
    // Update the request to completed status
    advertisingRequest.status = 'Completed';
    advertisingRequest.completion_data = {
      selected_campaign_id,
      selected_advertisement_id,
      completion_notes: completion_notes || '',
      completed_at: new Date(),
      completed_by: userId,
    };
    advertisingRequest.last_modified_by = userId;
    
    // Add to status history
    const statusHistoryEntry = {
      status: 'Completed',
      changed_by: userId,
      changed_at: new Date(),
      notes: completion_notes || 'Request marked as completed',
    };
    
    advertisingRequest.status_history.push(statusHistoryEntry);
    
    // Save the updated request
    await advertisingRequest.save();
    
    // Send completion notification
    try {
      const recipients = getNotificationRecipients('request_completed');
      if (recipients.length > 0) {
        await notifyStatusChange(
          advertisingRequest,
          oldStatus,
          'Completed',
          userId,
          recipients,
          completion_notes
        );
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the completion if email fails
    }
    
    return NextResponse.json({
      message: 'Advertising request completed successfully',
      request: advertisingRequest.toObject({ virtuals: true }),
      linked_entities: {
        campaign: {
          broadstreet_id: campaign.broadstreet_id,
          name: campaign.name,
          advertiser_id: campaign.advertiser_id,
        },
        advertisement: {
          broadstreet_id: advertisement.broadstreet_id,
          name: advertisement.name,
          advertiser: advertisement.advertiser,
        },
      },
    });
    
  } catch (error: any) {
    console.error('Error completing advertising request:', error);
    
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
      { error: 'Failed to complete advertising request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advertising-requests/[id]/complete
 * Get completion options (available campaigns and advertisements)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Find the advertising request
    const advertisingRequest = await AdvertisingRequest.findById(id)
      .select('advertiser_info.company_name status')
      .lean({ virtuals: true }) as unknown as any;
    
    if (!advertisingRequest) {
      return NextResponse.json(
        { error: 'Advertising request not found' },
        { status: 404 }
      );
    }
    
    // Get all synced campaigns and advertisements
    const [campaigns, advertisements] = await Promise.all([
      Campaign.find({ synced_with_api: true })
        .select('broadstreet_id name advertiser_id active')
        .lean() as unknown as any[],
      Advertisement.find({ synced_with_api: true })
        .select('broadstreet_id name advertiser')
        .lean() as unknown as any[]
    ]);
    
    return NextResponse.json({
      request_info: {
        company_name: advertisingRequest.advertiser_info.company_name,
        status: advertisingRequest.status,
      },
      completion_options: {
        campaigns: campaigns.map(campaign => ({
          broadstreet_id: campaign.broadstreet_id,
          name: campaign.name,
          advertiser_id: campaign.advertiser_id,
          active: campaign.active,
        })),
        advertisements: advertisements.map(advertisement => ({
          broadstreet_id: advertisement.broadstreet_id,
          name: advertisement.name,
          advertiser: advertisement.advertiser,
        })),
      },
      total_campaigns: campaigns.length,
      total_advertisements: advertisements.length,
    });
    
  } catch (error) {
    console.error('Error fetching completion options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completion options' },
      { status: 500 }
    );
  }
}
