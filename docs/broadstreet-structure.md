# Broadstreet Structure

## Networks
Networkes are different websites where the campaigns are run. 
In out case we have the main website aka Schwulissimo.de and the other one is TravelM.de
By default we work on the Schwulissimo.de network.

## Zones
Zones simply id of a possible placement. They can contain size but we leaver everything empty.
Each zone does have a name for human readability.
Zone are also called placements.

## Advertisers
Advertisers are the companies that run the campaigns.
Each advertiser has a name and a unique id.
The id is used to identify the advertiser in the API.
The name is used for human readability.

## Advertisements
Advertisements are the actual ads that are shown on the website.
Each advertisement has a name and a unique id.
The id is used to identify the advertisement in the API.
The name is used for human readability.
Each advertisement has a type.
The type can be image, text, video or native.
They advertisement also has the info of the url where the ad will link to.

## Campaigns
Campaigns are a grouping of:
1) an advertiser
2) One or more combinations of:
an advertisement amd One or more zones it will show up in
3) Start date
4) End date (optional)




