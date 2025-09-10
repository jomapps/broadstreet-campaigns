import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LocalZone from '@/lib/models/local-zone';
import LocalAdvertiser from '@/lib/models/local-advertiser';
import LocalCampaign from '@/lib/models/local-campaign';
import LocalNetwork from '@/lib/models/local-network';
import LocalAdvertisement from '@/lib/models/local-advertisement';
import Zone from '@/lib/models/zone';
import Advertiser from '@/lib/models/advertiser';
import Campaign from '@/lib/models/campaign';
import Network from '@/lib/models/network';
import Advertisement from '@/lib/models/advertisement';
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
        
        // Only mark as synced if API call was successful
        if (broadstreetZone && broadstreetZone.id) {
          // Create the zone in the main Zone collection
          const mainZone = new Zone({
            id: broadstreetZone.id,
            name: broadstreetZone.name,
            network_id: broadstreetZone.network_id,
            alias: broadstreetZone.alias,
            self_serve: broadstreetZone.self_serve,
            size_type: zone.size_type,
            size_number: zone.size_number,
            category: zone.category,
            block: zone.block,
            is_home: zone.is_home,
          });
          
          await mainZone.save();
          
          // Remove from local collection
          await LocalZone.findByIdAndDelete(zone._id);
          syncedCount++;
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync zone "${zone.name}": ${error}`);
        // Keep the zone in local-only state if sync failed
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
        
        // Only mark as synced if API call was successful
        if (broadstreetAdvertiser && broadstreetAdvertiser.id) {
          // Create the advertiser in the main Advertiser collection
          const mainAdvertiser = new Advertiser({
            id: broadstreetAdvertiser.id,
            name: broadstreetAdvertiser.name,
            logo: broadstreetAdvertiser.logo,
            web_home_url: broadstreetAdvertiser.web_home_url,
            notes: broadstreetAdvertiser.notes,
            admins: broadstreetAdvertiser.admins,
          });
          
          await mainAdvertiser.save();
          
          // Remove from local collection
          await LocalAdvertiser.findByIdAndDelete(advertiser._id);
          syncedCount++;
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync advertiser "${advertiser.name}": ${error}`);
        // Keep the advertiser in local-only state if sync failed
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
        
        // Only mark as synced if API call was successful
        if (broadstreetCampaign && broadstreetCampaign.id) {
          // Create the campaign in the main Campaign collection
          const mainCampaign = new Campaign({
            id: broadstreetCampaign.id,
            name: broadstreetCampaign.name,
            advertiser_id: broadstreetCampaign.advertiser_id,
            start_date: broadstreetCampaign.start_date,
            end_date: broadstreetCampaign.end_date,
            max_impression_count: broadstreetCampaign.max_impression_count,
            display_type: broadstreetCampaign.display_type,
            active: broadstreetCampaign.active,
            weight: broadstreetCampaign.weight,
            path: broadstreetCampaign.path,
            archived: broadstreetCampaign.archived,
            pacing_type: broadstreetCampaign.pacing_type,
            impression_max_type: broadstreetCampaign.impression_max_type,
            paused: broadstreetCampaign.paused,
            notes: broadstreetCampaign.notes,
          });
          
          await mainCampaign.save();
          
          // Remove from local collection
          await LocalCampaign.findByIdAndDelete(campaign._id);
          syncedCount++;
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync campaign "${campaign.name}": ${error}`);
        // Keep the campaign in local-only state if sync failed
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
        
        // Only mark as synced if API call was successful
        if (broadstreetNetwork && broadstreetNetwork.id) {
          // Create the network in the main Network collection
          const mainNetwork = new Network({
            id: broadstreetNetwork.id,
            name: broadstreetNetwork.name,
            group_id: broadstreetNetwork.group_id,
            web_home_url: broadstreetNetwork.web_home_url,
            logo: broadstreetNetwork.logo,
            valet_active: broadstreetNetwork.valet_active,
            path: broadstreetNetwork.path,
            notes: broadstreetNetwork.notes,
          });
          
          await mainNetwork.save();
          
          // Remove from local collection
          await LocalNetwork.findByIdAndDelete(network._id);
          syncedCount++;
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync network "${network.name}": ${error}`);
        // Keep the network in local-only state if sync failed
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
        
        // Only mark as synced if API call was successful
        if (broadstreetAdvertisement && broadstreetAdvertisement.id) {
          // Create the advertisement in the main Advertisement collection
          const mainAdvertisement = new Advertisement({
            id: broadstreetAdvertisement.id,
            name: broadstreetAdvertisement.name,
            network_id: broadstreetAdvertisement.network_id,
            type: broadstreetAdvertisement.type,
            advertiser: broadstreetAdvertisement.advertiser,
            advertiser_id: broadstreetAdvertisement.advertiser_id,
            active: broadstreetAdvertisement.active,
            active_placement: broadstreetAdvertisement.active_placement,
            preview_url: broadstreetAdvertisement.preview_url,
            notes: broadstreetAdvertisement.notes,
          });
          
          await mainAdvertisement.save();
          
          // Remove from local collection
          await LocalAdvertisement.findByIdAndDelete(advertisement._id);
          syncedCount++;
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync advertisement "${advertisement.name}": ${error}`);
        // Keep the advertisement in local-only state if sync failed
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
