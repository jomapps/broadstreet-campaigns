# Theme Feature

## Overview
We are building a theme feature for this app.
this app is a tool for creating and assisting with the creation of advertising campaigns in broadstreet.
key app features include:
- creating campaigns
- creating zones
- creating advertisers
- creating placements
- syncing all of the above to and from broadstreet backend
- we manage and do everything in the local database and sync is the way to push to broadstreet

## What is a theme?
theme is just a way to group zones together. 
there are a number of zones and they all belong to different categories and blocks on the website.
we want to group those zones together so that we can create campaigns that target those zones.
it is essentially a quality of life feature.

## Theme creation
we will have a theme page.
it will allow us to create empty themes.
essentially this is a group name.
Themes will be stored in the separate collection in the database.
Themes actually have nothing to do with broadstreet. They will never sync or be removed.

## Theme display
there are two types of display for themes:
- on the theme page we will have a list of all themes as cards with names. it will also contain simple info as to how many zones it has.
- if a theme is clicked, the zones in the theme are shown.
All zone cards throughout the app will have a very small series of badges at the bottom of the card. they will show the themes that the zone belongs to.
**CRITICAL**  we will only deal with zones that are syncd wiht broadstreet. Local zones are not supported for themes.

## Theme Edit
zones can be added and removed from themes.
Theme names can be changed at any time on the theme page by clicking the pencil icon on the theme display cards.

### Adding zones
The zones can be added by selection or by copy
The may be overlapping request to add a zone multiple times. the request will not be rejected but will not be added again (no duplication)

#### by selection
this will happen on the zones page.
the theme has to exist
the zones has to be synced with broadstreet (no local only zones)
we use the filter tools to display the zones
the page will have a button "add to theme" that will add the selected zones to the theme
A popup modal will come with check boxes and zone listing. zone will be added to the theme when the checkbox is checked.
this way we can quickly add the zone to multiple themes.

#### By copy
We will have a "copy zones to theme" button on the campaign page.
This will happen when we choose a campaign and press the button. All the zones that are in that campaign will be added to the theme.
This will automatically create the theme with the same name as the campaign.
there is no popup step required because we know exactly what is being copied.

#### By Theme copy
we can clone a theme on the theme page.
this will allow us to quickly create a new theme with the same zones as an existing theme.

### Removing Zones
To remove zones we go to the theme page
we will click a theme card leading to display of all zones.
we will use zone filters to narrow down the zones.
there will be a button called select all displayed zones
we will have a button "remove from theme" that will remove the selected zones from the theme.
This is the only way to remove zones.
we will not provide a way to remove from mulitiple themes at once.

### Delete thems
themes can be deleted from the theme page.
there will be a button on the theme card to delete the theme.
there will be a confirmation dialog to confirm the deletion.
deleting a theme will not delete the zones. it will simply remove the theme from the collection.

### theme page filters
the themes page will have extensive search and filter tools, similar to the zones page.
search will be by any of the zones details.





