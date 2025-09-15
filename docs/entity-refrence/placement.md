# Placement

## Overview

Placements represent combinations of advertisements and zones. Each placement belongs to a single campaign.

## Parents relationship
Placements are children of campaigns.
Placements combinations of zone and advertisement.
Advertisements are children of Advertisers.



**CRITICAL**
- if a value is not required and it is not provided, it will not be included in the request body.
- other than the id, we never rely on another id.
- when we open a placement creation form, we DO NOT have a placement id. We also dont give it any. We do that only on save.
- fields required by the broadstreet api that are required need to present. They are almost always in the filters section of the sidebar. e.g. network id  and Campaign id are required. If not present, give message.
- in placement duplicate names are allowed.
- We do not create networks or advertisements. They need to be present in the broadstreet api, and will be synced before start of the placement creation process.

**HANDLING LOCAL ADVERTISERS AND CAMPAIGNS**
- we may create local advertisers. they will not have an id, being local. so we just use the mongodb _id. later the sync will update the id.
- we may create local campaigns. they will not have an id, being local. so we just use the mongodb _id. later the sync will update the id.

