# Zones Selection

## Overview
for placements, we have to select the zones.

## Where
The zone select and deselect buttons are located in the /zone path
there will be a checkmark and the word "Selecte Zones are present" in the bottom of the sidebar Filters card. It will appear when we have 1 or more zones selected.

## How
the idea is simple. we use the search and zone guides to display the zones, which currently works fine.
then we press select or deselect
this will select or deselect the zones that are currently in display.
if i presse e.g. select and some cards are already selected, they will stay selected.
Select and deselect are NOT toggle buttons.

## Only Selected
We will need a button, pressing which will only show the selected zones. this can be toggle (radio button).
The search or zone guide filters will continue to work as before.
This toggle will ahve highest priority in the filtering logic.
The search heirarchy will be:
- Only Selected
- Zone Guide
- Search


## DB
Some db changes will be needed to accomodate the new selection logic.

## Sync with Broadstreet
Wheneever we sync with broadstreet (download or upload), we will reset the selection.

