# Broadstreet Campaigns

## Overview

This app is to serve as a easy way to create and manage advertising system of Broadstreet

### Broadstreet Structure

### Networks
Networkes are different websites where the campaigns are run. 
In out case we have the main website aka Schwulissimo.de and the other one is TravelM.de
By default we work on the Schwulissimo.de network.

## Zones
Zones simply id of a possible placement. They can contain size but we leaver everything empty.
Each zone does have a name for human readability.
Zone are also called placements.

### Advertisers
Advertisers are the companies that run the campaigns.
Each advertiser has a name and a unique id.
The id is used to identify the advertiser in the API.
The name is used for human readability.

### Advertisements
Advertisements are the actual ads that are shown on the website.
Each advertisement has a name and a unique id.
The id is used to identify the advertisement in the API.
The name is used for human readability.
Each advertisement has a type.
The type can be image, text, video or native.
They advertisement also has the info of the url where the ad will link to.

### Campaigns
Campaigns are a grouping of:
1) an advertiser
2) One or more combinations of:
one or more advertisements and One or more zones it will show up in
This combo of adivertisements and zones is called PLACEMENT
3) Start date
4) End date (optional)


## API Specs
the docs of broadstreet api are here: https://api.broadstreetads.com/docs/v1
api specs are in the api-specs.json file in this folder for reference

## Env keys
BROADSTREET_API_TOKEN=a75908ff9ebcb98f0ecfc243b6af837923fb59f1c853af1f3b9a5f9823b124b5
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns
NEXT_PUBLIC_APP_NAME=Broadstreet Publishing Dashboard
CORS_ALLOWED_ORIGINS=http://localhost:3005

## Technical Stack
We are using nextjs, tailwindcss and mongodb with ESM Modules

## CRITICAL Things that should be done
1) Build this app on server side components.
2) create client side components ONLY IF REQUIRED
3) use suspense for components that wil fetch data
4) create very small files. create small components and reuse them
5) Pages are async and can fetch data with await. use that.

## UI
- we want a modern dashboard ui
- we want a main menu on the top with main Pages. These items will have a page each:
-- Networks
-- Advertisers
-- Advertisements
-- Zones
-- Campaigns
- Depending on the Page, we should be able to search, list and select the content of that page e.g. see and select campaigns.
- we want a sidebar with things we can do - actions - on that Pages. actions will be enacted on the selections
- we want display in the content display area
- we prefer cards over rows
- we want font sizes that will become small, based on available screen size
- we prefer multi column display in the content area.
- group information together in sections where possible and shade the sections

## DB SYNC
The app will require a sync. 
It should be manually triggered to no load the Broadstreet api 
Sync will do this:
It will fetch and mirror in our database the information of the following endpoints;
- Networks
- Advertisers
- Advertisements
- Zones
- Campaigns

## Dashboard
A dashboard will be shown on /dashboard path. this wil be the default home. 
it will have cards for each of the following;
- Networks
- Advertisers
- Advertisements
- Zones
- Campaigns
and it will show how much of each we have
the cards should also link to the pages

## Unique feature about the zone names
All our zones have following keywords in their name:
- SQ: this refers to Square ads of 300px x 250px
- PT: this refers to Portrait or vertical banners of size 300px x 600px
- LS: refers to horizontal banners of 728px x 90px
NOTE: all sq, pt and ls may may often have a numebr at the end like 1, 2 etc. this refers to how close they are to the top. Lower the value, the closer to top they are.

- Rubrik [NAME] - this referes to a category whose name is NAME
- RUBRIK [NAME] - Block [BLOCKNAME] - this refers to category NAME and a block underneath it named BLOCKNAME

- Home - This refers to the home page of hte website.

## Current Aim
We will have utilities listed in the sidebar.

### Create API Documentation
Create api documentation of the api's of broadstreet with req, resp and params so that you can refrer to it.

### our first utility is called: Create a Fallback Ad
it will require NETWORK > ADVERTISER > CAMPAIGN
it will be in the pages: Campaign
we will be required to select one or more advertisement, and size (sq,pt,ls)
once provided, pressing a button will create create placement
the logic will be to create placeents with all selected advertisement and all selected zones (zones with the matching size keyword in their name - whole word match)

