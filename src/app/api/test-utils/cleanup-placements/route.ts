import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalCampaign from '@/lib/models/local-campaign';
import Placement from '@/lib/models/placement';

type CleanupRequestBody = {
  campaign_id: number;
  advertisement_ids: number[];
  zone_ids: number[];
};

export async function POST(request: NextRequest) {
  try {
    // Block in production for safety
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ ok: false, message: 'Forbidden in production' }, { status: 403 });
    }

    await connectDB();

    const { campaign_id, advertisement_ids, zone_ids } = (await request.json()) as CleanupRequestBody;

    if (!campaign_id || !Array.isArray(advertisement_ids) || !Array.isArray(zone_ids)) {
      return NextResponse.json({ message: 'campaign_id, advertisement_ids[], zone_ids[] required' }, { status: 400 });
    }

    // 1) Delete standalone Placement documents if any
    const placementDeleteResult = await Placement.deleteMany({
      campaign_id,
      advertisement_id: { $in: advertisement_ids },
      zone_id: { $in: zone_ids },
    });
    const removedStandalonePlacements = placementDeleteResult.deletedCount || 0;

    // 2) Remove matching embedded placements from LocalCampaign mirror(s)
    const comboMatches = new Set<string>(
      advertisement_ids.flatMap((adId) => zone_ids.map((zoneId) => `${adId}-${zoneId}`))
    );

    const mirrorsBefore = await LocalCampaign.find({ original_broadstreet_id: campaign_id }).lean();

    // Count how many embedded placements will be removed
    let removedEmbeddedPlacements = 0;
    const mirrorIds: string[] = [];
    for (const m of mirrorsBefore) {
      mirrorIds.push((m as any)._id.toString());
      const beforeCount = (m as any).placements?.length || 0;
      if (beforeCount > 0) {
        const keep = (m as any).placements.filter((p: any) => !comboMatches.has(`${p.advertisement_id}-${p.zone_id}`));
        removedEmbeddedPlacements += beforeCount - keep.length;
      }
    }

    if (mirrorsBefore.length > 0) {
      await LocalCampaign.updateMany(
        { original_broadstreet_id: campaign_id },
        {
          $pull: {
            placements: {
              $or: advertisement_ids.flatMap((adId) =>
                zone_ids.map((zoneId) => ({ advertisement_id: adId, zone_id: zoneId }))
              ),
            },
          },
        }
      );
    }

    // 3) Delete any mirrors that have no placements left
    let deletedMirrorsCount = 0;
    if (mirrorIds.length > 0) {
      const mirrorsAfter = await LocalCampaign.find({ _id: { $in: mirrorIds } }).lean();
      const emptyIds = mirrorsAfter
        .filter((m: any) => !m.placements || m.placements.length === 0)
        .map((m: any) => m._id);
      if (emptyIds.length > 0) {
        const delRes = await LocalCampaign.deleteMany({ _id: { $in: emptyIds } });
        deletedMirrorsCount = delRes.deletedCount || 0;
      }
    }

    return NextResponse.json({
      ok: true,
      deleted: {
        placements: removedStandalonePlacements + removedEmbeddedPlacements,
        campaigns: deletedMirrorsCount,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


