# Entity IDs

## Overview

Entities in the Broadstreet Campaigns application can have two types of IDs

## **Broadstreet ID** (`broadstreet_id`)
The unique identifier assigned by the Broadstreet API. This ID is a number and is used to reference entities in API requests.
all synced entities have a broadstreet_id.

## **MongoDB ID** (`mongo_id`)
The unique identifier assigned by MongoDB. This ID is a string (ObjectID) and is used to reference entities in the local MongoDB database.
everything has a mongodb id. whethere syncd or not. 

But when we are referring to items that are local and not yet syncd, we use the term `mongo_id`.

## Utilities

Here is the list of utilities we have for working with IDs.
- hot to get a entity given a mongodb id
- how to get a entity given a broadstreet id


## patterns
saving ids of a item into another item:
- use broadstreet_id when possible
- use mongo_id when the item is not yet synced

## Single source of truth
Ensure theat we have common utilities so that there is a single source of truth for working with IDs.

## Getting ids from sidebar filter
Sidebar filters can provide either a broadstreet_id or a mongo_id. 
have a clear way, used by everyone to use it.
The app cannot work without network id and it is always in the sidebar filter.
