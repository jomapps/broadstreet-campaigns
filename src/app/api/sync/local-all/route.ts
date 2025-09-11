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
    
    // Create maps to track local ID -> synced ID for dependency resolution
    const advertiserIdMap = new Map<number, number>();
    const networkIdMap = new Map<number, number>();
    
    console.log(`Starting sync of ${totalEntities} entities with hierarchical dependency order...`);
    
    // DRY RUN VALIDATION - Check for name conflicts before syncing
    console.log('🔍 Performing dry run validation...');
    const nameConflicts: string[] = [];
    const resolvedNames = new Map<string, string>(); // original name -> resolved name
    
    // Helper function to generate unique names
    const generateUniqueName = async (originalName: string, entityType: 'advertiser' | 'campaign' | 'zone' | 'advertisement', networkId: number, advertiserId?: number): Promise<string> => {
      let baseName = originalName;
      let counter = 1;
      
      while (true) {
        let exists = false;
        
        switch (entityType) {
          case 'advertiser':
            exists = await broadstreetAPI.checkExistingAdvertiser(baseName, networkId);
            break;
          case 'campaign':
            if (!advertiserId) throw new Error('Advertiser ID required for campaign name check');
            exists = await broadstreetAPI.checkExistingCampaign(baseName, advertiserId);
            break;
          case 'zone':
            exists = await broadstreetAPI.checkExistingZone(baseName, networkId);
            break;
          case 'advertisement':
            exists = await broadstreetAPI.checkExistingAdvertisement(baseName, networkId);
            break;
        }
        
        if (!exists) {
          return baseName;
        }
        
        baseName = `${originalName} (${counter})`;
        counter++;
        
        // Prevent infinite loops
        if (counter > 100) {
          throw new Error(`Could not generate unique name for ${originalName} after 100 attempts`);
        }
      }
    };
    
    // Check advertisers for name conflicts
    for (const advertiser of localAdvertisers) {
      const syncedNetworkId = networkIdMap.get(advertiser.network_id) || advertiser.network_id;
      const uniqueName = await generateUniqueName(advertiser.name, 'advertiser', syncedNetworkId);
      if (uniqueName !== advertiser.name) {
        nameConflicts.push(`Advertiser "${advertiser.name}" → "${uniqueName}"`);
        resolvedNames.set(advertiser.name, uniqueName);
      }
    }
    
    // Check zones for name conflicts
    for (const zone of localZones) {
      const syncedNetworkId = networkIdMap.get(zone.network_id) || zone.network_id;
      const uniqueName = await generateUniqueName(zone.name, 'zone', syncedNetworkId);
      if (uniqueName !== zone.name) {
        nameConflicts.push(`Zone "${zone.name}" → "${uniqueName}"`);
        resolvedNames.set(zone.name, uniqueName);
      }
    }
    
    // Check campaigns for name conflicts (after advertisers are processed)
    for (const campaign of localCampaigns) {
      const syncedAdvertiserId = advertiserIdMap.get(campaign.advertiser_id) || campaign.advertiser_id;
      const uniqueName = await generateUniqueName(campaign.name, 'campaign', 0, syncedAdvertiserId);
      if (uniqueName !== campaign.name) {
        nameConflicts.push(`Campaign "${campaign.name}" → "${uniqueName}"`);
        resolvedNames.set(campaign.name, uniqueName);
      }
    }
    
    // Check advertisements for name conflicts
    for (const advertisement of localAdvertisements) {
      const syncedNetworkId = networkIdMap.get(advertisement.network_id) || advertisement.network_id;
      const uniqueName = await generateUniqueName(advertisement.name, 'advertisement', syncedNetworkId);
      if (uniqueName !== advertisement.name) {
        nameConflicts.push(`Advertisement "${advertisement.name}" → "${uniqueName}"`);
        resolvedNames.set(advertisement.name, uniqueName);
      }
    }
    
    if (nameConflicts.length > 0) {
      console.log('⚠️ Name conflicts detected and resolved:');
      nameConflicts.forEach(conflict => console.log(`  - ${conflict}`));
    } else {
      console.log('✅ No name conflicts detected');
    }
    
    console.log('✅ Dry run validation complete');
    
    // HIERARCHICAL SYNC ORDER:
    // 1. Networks (no dependencies)
    // 2. Advertisers (depend on networks)
    // 3. Zones (depend on networks)
    // 4. Advertisements (depend on networks, advertisers)
    // 5. Campaigns (depend on advertisers)
    
    // Step 1: Sync Networks (no dependencies)
    console.log(`Step 1: Syncing ${localNetworks.length} networks...`);
    for (const network of localNetworks) {
      try {
        const broadstreetNetwork = await broadstreetAPI.createNetwork({
          name: network.name,
          group_id: network.group_id,
          web_home_url: network.web_home_url,
          logo: network.logo,
          valet_active: network.valet_active,
          path: network.path,
          notes: network.notes,
        });
        
        if (broadstreetNetwork && broadstreetNetwork.id) {
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
          networkIdMap.set(network.id, broadstreetNetwork.id);
          await LocalNetwork.findByIdAndDelete(network._id);
          syncedCount++;
          console.log(`✓ Synced network: ${network.name}`);
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync network "${network.name}": ${error}`);
        console.log(`✗ Failed to sync network: ${network.name} - ${error}`);
      }
    }

    // Step 2: Sync Advertisers (depend on networks)
    console.log(`Step 2: Syncing ${localAdvertisers.length} advertisers...`);
    for (const advertiser of localAdvertisers) {
      try {
        // Use mapped network ID if available
        const syncedNetworkId = networkIdMap.get(advertiser.network_id) || advertiser.network_id;
        
        // Build clean payload with only defined values (following successful curl pattern)
        const resolvedName = resolvedNames.get(advertiser.name) || advertiser.name;
        const advertiserPayload = {
          name: resolvedName,
          network_id: syncedNetworkId,
        };
        
        // Only add optional fields if they have actual values (not undefined/null)
        if (advertiser.logo) advertiserPayload.logo = advertiser.logo;
        if (advertiser.web_home_url) advertiserPayload.web_home_url = advertiser.web_home_url;
        if (advertiser.notes) advertiserPayload.notes = advertiser.notes;
        if (advertiser.admins && advertiser.admins.length > 0) advertiserPayload.admins = advertiser.admins;
        
        console.log(`Advertiser payload for "${advertiser.name}":`, advertiserPayload);
        
        const broadstreetAdvertiser = await broadstreetAPI.createAdvertiser(advertiserPayload);
        
        if (broadstreetAdvertiser && broadstreetAdvertiser.id) {
          const mainAdvertiser = new Advertiser({
            id: broadstreetAdvertiser.id,
            name: broadstreetAdvertiser.name,
            logo: broadstreetAdvertiser.logo,
            web_home_url: broadstreetAdvertiser.web_home_url,
            notes: broadstreetAdvertiser.notes,
            admins: broadstreetAdvertiser.admins,
          });
          
          await mainAdvertiser.save();
          advertiserIdMap.set(advertiser.id, broadstreetAdvertiser.id);
          await LocalAdvertiser.findByIdAndDelete(advertiser._id);
          syncedCount++;
          console.log(`✓ Synced advertiser: ${advertiser.name}`);
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync advertiser "${advertiser.name}": ${error}`);
        console.log(`✗ Failed to sync advertiser: ${advertiser.name} - ${error}`);
      }
    }

    // Step 3: Sync Zones (depend on networks)
    console.log(`Step 3: Syncing ${localZones.length} zones...`);
    for (const zone of localZones) {
      try {
        // Use mapped network ID if available
        const syncedNetworkId = networkIdMap.get(zone.network_id) || zone.network_id;
        
        // Build clean payload with only defined values (following successful curl pattern)
        const resolvedName = resolvedNames.get(zone.name) || zone.name;
        const zonePayload = {
          name: resolvedName,
          network_id: syncedNetworkId,
        };
        
        // Only add optional fields if they have actual values (not undefined/null)
        if (zone.alias) zonePayload.alias = zone.alias;
        if (zone.self_serve !== undefined) zonePayload.self_serve = zone.self_serve;
        if (zone.advertisement_count !== undefined && zone.advertisement_count !== null) {
          zonePayload.advertisement_count = zone.advertisement_count;
        }
        if (zone.allow_duplicate_ads !== undefined) zonePayload.allow_duplicate_ads = zone.allow_duplicate_ads;
        if (zone.concurrent_campaigns !== undefined && zone.concurrent_campaigns !== null) {
          zonePayload.concurrent_campaigns = zone.concurrent_campaigns;
        }
        if (zone.advertisement_label) zonePayload.advertisement_label = zone.advertisement_label;
        if (zone.archived !== undefined) zonePayload.archived = zone.archived;
        if (zone.display_type) zonePayload.display_type = zone.display_type;
        if (zone.rotation_interval !== undefined && zone.rotation_interval !== null) {
          zonePayload.rotation_interval = zone.rotation_interval;
        }
        if (zone.animation_type) zonePayload.animation_type = zone.animation_type;
        if (zone.width !== undefined && zone.width !== null) zonePayload.width = zone.width;
        if (zone.height !== undefined && zone.height !== null) zonePayload.height = zone.height;
        if (zone.rss_shuffle !== undefined) zonePayload.rss_shuffle = zone.rss_shuffle;
        if (zone.style) zonePayload.style = zone.style;
        
        console.log(`Zone payload for "${zone.name}":`, zonePayload);
        
        const broadstreetZone = await broadstreetAPI.createZone(zonePayload);
        
        if (broadstreetZone && broadstreetZone.id) {
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
          await LocalZone.findByIdAndDelete(zone._id);
          syncedCount++;
          console.log(`✓ Synced zone: ${zone.name}`);
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync zone "${zone.name}": ${error}`);
        console.log(`✗ Failed to sync zone: ${zone.name} - ${error}`);
      }
    }

    // Step 4: Sync Advertisements (depend on networks, advertisers)
    console.log(`Step 4: Syncing ${localAdvertisements.length} advertisements...`);
    for (const advertisement of localAdvertisements) {
      try {
        // Use mapped network ID if available
        const syncedNetworkId = networkIdMap.get(advertisement.network_id) || advertisement.network_id;
        const syncedAdvertiserId = advertiserIdMap.get(advertisement.advertiser_id) || advertisement.advertiser_id;
        
        // Build clean payload with only defined values (following successful curl pattern)
        const resolvedName = resolvedNames.get(advertisement.name) || advertisement.name;
        const advertisementPayload = {
          name: resolvedName,
          network_id: syncedNetworkId,
          type: advertisement.type,
          advertiser_id: syncedAdvertiserId,
          active: advertisement.active,
        };
        
        // Only add optional fields if they have actual values (not undefined/null)
        if (advertisement.advertiser) advertisementPayload.advertiser = advertisement.advertiser;
        if (advertisement.active_placement !== undefined) advertisementPayload.active_placement = advertisement.active_placement;
        if (advertisement.preview_url) advertisementPayload.preview_url = advertisement.preview_url;
        if (advertisement.notes) advertisementPayload.notes = advertisement.notes;
        
        console.log(`Advertisement payload for "${advertisement.name}":`, advertisementPayload);
        
        const broadstreetAdvertisement = await broadstreetAPI.createAdvertisement(advertisementPayload);
        
        if (broadstreetAdvertisement && broadstreetAdvertisement.id) {
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
          await LocalAdvertisement.findByIdAndDelete(advertisement._id);
          syncedCount++;
          console.log(`✓ Synced advertisement: ${advertisement.name}`);
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync advertisement "${advertisement.name}": ${error}`);
        console.log(`✗ Failed to sync advertisement: ${advertisement.name} - ${error}`);
      }
    }

    // Step 5: Sync Campaigns (depend on advertisers)
    console.log(`Step 5: Syncing ${localCampaigns.length} campaigns...`);
    for (const campaign of localCampaigns) {
      try {
        if (!campaign.advertiser_id) {
          throw new Error('Campaign must have an advertiser_id to sync to Broadstreet');
        }
        
        // Use mapped advertiser ID if available
        const syncedAdvertiserId = advertiserIdMap.get(campaign.advertiser_id) || campaign.advertiser_id;
        
        // Build clean payload with only defined values (following successful curl pattern)
        const resolvedName = resolvedNames.get(campaign.name) || campaign.name;
        const campaignPayload = {
          name: resolvedName,
          advertiser_id: syncedAdvertiserId,
          start_date: campaign.start_date,
          weight: campaign.weight,
          active: campaign.active,
        };
        
        // Only add optional fields if they have actual values (not undefined/null)
        if (campaign.end_date) campaignPayload.end_date = campaign.end_date;
        if (campaign.display_type) campaignPayload.display_type = campaign.display_type;
        if (campaign.pacing_type) campaignPayload.pacing_type = campaign.pacing_type;
        if (campaign.max_impression_count !== undefined && campaign.max_impression_count !== null) {
          campaignPayload.max_impression_count = campaign.max_impression_count;
        }
        if (campaign.path) campaignPayload.path = campaign.path;
        if (campaign.notes) campaignPayload.notes = campaign.notes;
        if (campaign.impression_max_type) campaignPayload.impression_max_type = campaign.impression_max_type;
        if (campaign.archived !== undefined) campaignPayload.archived = campaign.archived;
        if (campaign.paused !== undefined) campaignPayload.paused = campaign.paused;
        
        console.log(`Campaign payload for "${campaign.name}":`, campaignPayload);
        
        const broadstreetCampaign = await broadstreetAPI.createCampaign(campaignPayload);
        
        console.log(`Broadstreet API response for campaign "${campaign.name}":`, {
          id: broadstreetCampaign?.id,
          weight: broadstreetCampaign?.weight,
          weightType: typeof broadstreetCampaign?.weight,
          fullResponse: broadstreetCampaign
        });
        
        if (broadstreetCampaign && broadstreetCampaign.id) {
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
          await LocalCampaign.findByIdAndDelete(campaign._id);
          syncedCount++;
          console.log(`✓ Synced campaign: ${campaign.name}`);
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (error) {
        errors.push(`Failed to sync campaign "${campaign.name}": ${error}`);
        console.log(`✗ Failed to sync campaign: ${campaign.name} - ${error}`);
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedCount} entities synced successfully.`,
      synced: syncedCount,
      total: totalEntities,
      errors: errors.length > 0 ? errors : undefined,
      nameConflicts: nameConflicts.length > 0 ? nameConflicts : undefined,
      dryRunResults: {
        totalChecked: totalEntities,
        conflictsFound: nameConflicts.length,
        conflictsResolved: nameConflicts.length,
      },
    });

  } catch (error) {
    console.error('Error syncing local entities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
