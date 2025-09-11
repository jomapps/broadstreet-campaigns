# Placement Logic

## Overview
Placements are advertisements that are displayed on a zone for paritcular campaign.

## Advertiser
A campaign can have only a single advertisers. So fixing the campaign automatically triggers that. This is jsut info and not required. HOWEVER it will be required to set in the sidebar filter so taht we can choose the correct campaign.

## Campaign
We are required to choose the correct campaign for the placements to be created.

## Zone
We are required to choose the zones wheer we would like to display the advertisements.

## Advertisement
Advertisement is the ad that we would like to display.
Advertisements are unique to the advertiser.

## What
the Create Placements button will be enabled only if we have selected campaign, zone(s) and advertisement(s).

## where
A button in the sidebar > Utilities section > "Create Placements" button will trigger the placement creation. the tagline will say "Requires: Campaign, Zones, Advertisement".

## Execution
cards will be created in the placements page. They will be given the local treatment.

## Note
Since advertisements cannot be created in this app, they need to be present from the global sync. We can however create local placements to be synced later.

## Placement creation logic
Placements are created by the following logic:
- the advertiser of the campaign needs to be present in broadstreet. if not, he will be created first.
- a campaign needs to be present in broadstreet
- if the campaign is still local, we will need to create it first.
- we will be placing all the advertisements selected for all the zones selected
- placement creation happens one by one. you have to give a single unit of campaign, zone and advertisement at a time. Iterate until all the placements are created.

## Broadstreet Docs
- api formats are in /docs/api-specs.json
- Broadstreet docs are in /docs/broadstreet-structure.md

## Test
Test data:
- network id: 9396
- advertiser id: 199901
- campaign id: 842383
- advertisement id: 1143797

Create placement with the follwing data using curl so that you can test the api call.
Ask me to check if the creation is successful.
if yes, you can use that pattern to create the placements for all the campaigns, zones and advertisements.
There may be a function that is present to create the placements

## Note
- no fallbacks
- no mockdata
- no hardcoded ids
