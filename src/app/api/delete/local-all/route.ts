import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Placement from '@/lib/models/placement';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // First, clear embedded placements from synced campaigns (but keep the campaigns)
    const embeddedPlacementsClearResult = await LocalCampaign.updateMany(
      { synced_with_api: true, 'placements.0': { $exists: true } },
      { $unset: { placements: 1 } }
    );
    console.log(`Cleared embedded placements from ${embeddedPlacementsClearResult.modifiedCount} synced campaigns`);

    // Delete all local entities from their respective collections
    const deleteResults = await Promise.allSettled([
      LocalAdvertiser.deleteMany({ synced_with_api: false }),
      LocalCampaign.deleteMany({ synced_with_api: false }),
      LocalZone.deleteMany({ synced_with_api: false }),
      LocalAdvertisement.deleteMany({ synced_with_api: false }),
      LocalNetwork.deleteMany({ synced_with_api: false }),
      Placement.deleteMany({ created_locally: true, synced_with_api: false }),
    ]);

    // Count successful deletions
    let totalDeleted = 0;
    const errors: string[] = [];
    const entityTypes = ['advertisers', 'campaigns', 'zones', 'advertisements', 'networks', 'placements'];

    deleteResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const deletedCount = result.value.deletedCount || 0;
        totalDeleted += deletedCount;
        console.log(`Deleted ${deletedCount} local ${entityTypes[index]}`);
      } else {
        const error = `Failed to delete local ${entityTypes[index]}: ${result.reason}`;
        errors.push(error);
        console.error(error);
      }
    });

    // Add the cleared embedded placements to the total count
    totalDeleted += embeddedPlacementsClearResult.modifiedCount;

    if (errors.length > 0) {
      return NextResponse.json({
        message: `Partial success: ${totalDeleted} entities deleted, ${errors.length} errors`,
        deleted: totalDeleted,
        errors: errors,
      }, { status: 207 }); // 207 Multi-Status for partial success
    }

    return NextResponse.json({
      message: `Successfully deleted all ${totalDeleted} local entities`,
      deleted: totalDeleted,
      entityTypes: {
        advertisers: deleteResults[0].status === 'fulfilled' ? deleteResults[0].value.deletedCount || 0 : 0,
        campaigns: deleteResults[1].status === 'fulfilled' ? deleteResults[1].value.deletedCount || 0 : 0,
        zones: deleteResults[2].status === 'fulfilled' ? deleteResults[2].value.deletedCount || 0 : 0,
        advertisements: deleteResults[3].status === 'fulfilled' ? deleteResults[3].value.deletedCount || 0 : 0,
        networks: deleteResults[4].status === 'fulfilled' ? deleteResults[4].value.deletedCount || 0 : 0,
        placements: deleteResults[5].status === 'fulfilled' ? deleteResults[5].value.deletedCount || 0 : 0,
        embeddedPlacements: embeddedPlacementsClearResult.modifiedCount,
      }
    });

  } catch (error) {
    console.error('Error deleting all local entities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
