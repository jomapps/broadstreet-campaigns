import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/lib/models/placement';
import LocalCampaign from '@/lib/models/local-campaign';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Delete all local placements from the Placement collection
    const placementDeleteResult = await Placement.deleteMany({ 
      created_locally: true, 
      synced_with_api: false 
    });

    // Also clear embedded placements from local campaigns
    const embeddedPlacementsClearResult = await LocalCampaign.updateMany(
      { 'placements.0': { $exists: true } },
      { $unset: { placements: 1 } }
    );

    const totalDeleted = placementDeleteResult.deletedCount;

    return NextResponse.json({
      message: `Successfully deleted ${totalDeleted} local placements and cleared embedded placements from ${embeddedPlacementsClearResult.modifiedCount} campaigns`,
      deleted: totalDeleted,
      embeddedCleared: embeddedPlacementsClearResult.modifiedCount,
    });

  } catch (error) {
    console.error('Error deleting local placements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
