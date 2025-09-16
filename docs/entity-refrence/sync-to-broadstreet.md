# Syncing Local Entities to Broadstreet API

This document outlines the process and considerations for syncing local entities to the Broadstreet API. It covers the steps involved, potential issues, and best practices to ensure a smooth synchronization process.

## Overview

The goal of the synchronization process is to move local entities (created within the application) to the Broadstreet API for management. This involves several key steps unique to each entity type.

## No Parent Entities

### Advertisers
advertisers, represented by advertiser_id in the broadstreet api, have no parent entities. They are created in our system and also in the broadstreet backend.
They are syncd to local database, and then synced up to the broadstreet api.
They only have the network_id as a required field.

### Zones
zones, represented by zone_id in the broadstreet api, have no parent entities. They are created in our system and also in the broadstreet backend.
They are syncd to local database, and then synced up to the broadstreet api.
They only have the network_id as a required field.

## Non Local Creatable Entities
We cannot and do not create these entities in our system. They are created in the broadstreet backend. They are imported into our system via the sync process.

### Networks
networkds, represented by network_id in the broadstreet api, have no parent entities. We do not create them in our system. The are created in the broadstreet backend. They are imported into our system via the sync process.
A network_id is a requirement to each and very entity in the broadstreet api. So this is set and simply used. We do not talk the network_id  field as a parent but rather as a global requirement.

### Advertisements
Advertisements are not creatable in our system. They are created in the broadstreet backend. They are imported into our system via the sync process.
note: advertisement require advertisers. so if a advertisement is present, the advertiser is also present.

## Parent Required Entities
These entities require a parent entity to be created. The parent entity must be created and present before we can create them.

### Campaign
campaigns, represented by campaign_id in the broadstreet api, have a parent entity of advertiser. The advertiser_id is a required field, together with the network_id.
campaign are creatable in our system. They are created in our system and also in the broadstreet backend.
They are syncd to local database, and then synced up to the broadstreet api.

### Placements
Placement is actually a group on entities. It is a combination of a advertisement and a zone. It is not a standalone entity.
Local entities we put in a local collection.
Syncd entities are embedded in the campaign document.
The require the campaign_id and network_id, together with the advertisement_id and zone_id. 

## The Sync Order

we have to follow the sync order in order to avoid dependency issues.
1) sync entities with no parents i.e. advertisers, zones
2) sync campaigns
3) sync placements

## Sync Process
when we sync a entity item, we can refer to the api if required in @docs/external/broadstreet-api-specs.md
ensure you follow the sync order
count the number of entities we will create and use that in the progress bar

steps:
1) create the entity in the broadstreet api
2) update the local entity with the broadstreet id of the createion in all pending entities
3) do the steps necessary in the audit log
4) move the local entity to the production collection

**CRITICAL**
entities that require parents will fail if we dont update the parent with real broadstreet ids.

