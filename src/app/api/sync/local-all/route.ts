import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import broadstreetAPI from '@/lib/broadstreet-api';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get all local entities that haven't been synced
    const [localZones, localAdvertisers, localCampaigns, localNetworks, localAdvertisements] = await Promise.all([
      LocalZone.find({ synced_with_api: false }),
      LocalAdvertiser.find({ synced_with_api: false }),
      LocalCampaign.find({ synced_with_api: false }),
      LocalNetwork.find({ synced_with_api: false }),
      LocalAdvertisement.find({ synced_with_api: false }),
    ]);

    const totalEntities = localZones.length + localAdvertisers.length + localCampaigns.length + localNetworks.length + localAdvertisements.length;

    if (totalEntities === 0) {
      return NextResponse.json({
        message: 'No local entities to sync',
        synced: 0,
        errors: []
      });
    }

    let syncedCount = 0;
    const errors: string[] = [];
    
    // Sync zones
    for (const zone of localZones) {
      try {
        // Call Broadstreet API to create zone
        const broadstreetZone = await broadstreetAPI.createZone({
          name: zone.name,
          network_id: zone.network_id,
          alias: zone.alias,
          self_serve: zone.self_serve,
          advertisement_count: zone.advertisement_count,
          allow_duplicate_ads: zone.allow_duplicate_ads,
          concurrent_campaigns: zone.concurrent_campaigns,
          advertisement_label: zone.advertisement_label,
          archived: zone.archived,
          display_type: zone.display_type,
          rotation_interval: zone.rotation_interval,
          animation_type: zone.animation_type,
          width: zone.width,
          height: zone.height,
          rss_shuffle: zone.rss_shuffle,
          style: zone.style,
        });
        
        // Mark as synced with real Broadstreet ID
        zone.synced_with_api = true;
        zone.synced_at = new Date();
        zone.original_broadstreet_id = broadstreetZone.id;
        await zone.save();
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync zone "${zone.name}": ${error}`);
      }
    }

    // Sync advertisers
    for (const advertiser of localAdvertisers) {
      try {
        // Call Broadstreet API to create advertiser
        const broadstreetAdvertiser = await broadstreetAPI.createAdvertiser({
          name: advertiser.name,
          network_id: advertiser.network_id,
          logo: advertiser.logo,
          web_home_url: advertiser.web_home_url,
          notes: advertiser.notes,
          admins: advertiser.admins,
        });
        
        advertiser.synced_with_api = true;
        advertiser.synced_at = new Date();
        advertiser.original_broadstreet_id = broadstreetAdvertiser.id;
        await advertiser.save();
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync advertiser "${advertiser.name}": ${error}`);
      }
    }

    // Sync campaigns
    for (const campaign of localCampaigns) {
      try {
        // Call Broadstreet API to create campaign
        if (!campaign.advertiser_id) {
          throw new Error('Campaign must have an advertiser_id to sync to Broadstreet');
        }
        
        const broadstreetCampaign = await broadstreetAPI.createCampaign({
          name: campaign.name,
          advertiser_id: campaign.advertiser_id,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          max_impression_count: campaign.max_impression_count,
          display_type: campaign.display_type,
          active: campaign.active,
          weight: campaign.weight,
          path: campaign.path,
          archived: campaign.archived,
          pacing_type: campaign.pacing_type,
          impression_max_type: campaign.impression_max_type,
          paused: campaign.paused,
          notes: campaign.notes,
        });
        
        campaign.synced_with_api = true;
        campaign.synced_at = new Date();
        campaign.original_broadstreet_id = broadstreetCampaign.id;
        await campaign.save();
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync campaign "${campaign.name}": ${error}`);
      }
    }

    // Sync networks
    for (const network of localNetworks) {
      try {
        // Call Broadstreet API to create network
        const broadstreetNetwork = await broadstreetAPI.createNetwork({
          name: network.name,
          group_id: network.group_id,
          web_home_url: network.web_home_url,
          logo: network.logo,
          valet_active: network.valet_active,
          path: network.path,
          notes: network.notes,
        });
        
        network.synced_with_api = true;
        network.synced_at = new Date();
        network.original_broadstreet_id = broadstreetNetwork.id;
        await network.save();
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync network "${network.name}": ${error}`);
      }
    }

    // Sync advertisements
    for (const advertisement of localAdvertisements) {
      try {
        // Call Broadstreet API to create advertisement
        const broadstreetAdvertisement = await broadstreetAPI.createAdvertisement({
          name: advertisement.name,
          network_id: advertisement.network_id,
          type: advertisement.type,
          advertiser: advertisement.advertiser,
          advertiser_id: advertisement.advertiser_id,
          active: advertisement.active,
          active_placement: advertisement.active_placement,
          preview_url: advertisement.preview_url,
          notes: advertisement.notes,
        });
        
        advertisement.synced_with_api = true;
        advertisement.synced_at = new Date();
        advertisement.original_broadstreet_id = broadstreetAdvertisement.id;
        await advertisement.save();
        syncedCount++;
      } catch (error) {
        errors.push(`Failed to sync advertisement "${advertisement.name}": ${error}`);
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedCount} entities synced successfully.`,
      synced: syncedCount,
      total: totalEntities,
      errors: errors
    });

  } catch (error) {
    console.error('Error syncing local entities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
