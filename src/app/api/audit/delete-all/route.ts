import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalZone from '@/lib/models/local-zone';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all synced entities from all collections
    const [advertiserResult, campaignResult, zoneResult] = await Promise.all([
      LocalAdvertiser.deleteMany({ synced_with_api: true }),
      LocalCampaign.deleteMany({ synced_with_api: true }),
      LocalZone.deleteMany({ synced_with_api: true })
    ]);

    const totalDeleted = advertiserResult.deletedCount + campaignResult.deletedCount + zoneResult.deletedCount;

    // Log the deletion operation
    console.log(`Audit data deletion completed:`, {
      advertisers: advertiserResult.deletedCount,
      campaigns: campaignResult.deletedCount,
      zones: zoneResult.deletedCount,
      total: totalDeleted,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} synced entities`,
      deleted_counts: {
        advertisers: advertiserResult.deletedCount,
        campaigns: campaignResult.deletedCount,
        zones: zoneResult.deletedCount,
        total: totalDeleted
      }
    });

  } catch (error) {
    console.error('Error deleting audit data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while deleting audit data'
      },
      { status: 500 }
    );
  }
}
