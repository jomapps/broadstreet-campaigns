# Advertising Request

## Overview
The advertising team puts in requests to do advertising campaigns. These requests need to be created on a page, listed and then processed with the logged in users name and audit log on who requested and who processed.
A separate collection will be used for this process.

## The Pages
The page will be called "Sales" in the main Menu and will be after Local only menu Point.
it will have following sub menu leading to pages:
- Request
- Open List
- audit log

Open list and audit will be similar with the difference that the audit will show all completed requests and the open list will show only the ones that are not processed yet.
An item on the list can be clicked to be seen, edited, deleted or have progress update. The user name will be in the list against each request. There may be multiple users attached to the request

### Request
The request page will have a form to create a new request. The form will have following fields:
- User (Displayed only)

*Advertiser Info Section*
- Advertiser - required.auto suggest. May give a name not in list
- Advertiser ID - required. it comes from the sales department.
- Contract ID - required. it comes from the sales department.
- Contract Start Date - required. it comes from the sales department.
- Contract End Date - required. it comes from the sales department.
- Campaign Name - required. it comes from the sales department.

*Advertisement Info Section*
- Advertisements - one or more. Min 1 required. Media upload. There will be image name, width, height and image alt text for each image
  -- Technical Note : We will install package:
  ```
  npm i image-size
  ```
  and use it to get the image size. Size will be auto filled.
  We have three Image Size Codings: SQ - for almost square images (normally 300x250 px), PT - for portrait images (normally 300x600 px), LS - for landscape images (normally 728x90 px). There will be a size coding radio button to select the size coding. It will be auto selected based on the image size.
  The image will be uploaded to a public url will be created using Clouflare R2 - S3 compatible bucket.
  The image alt will be populted with [Campaign Name] - [Image Name]
  image will be shown next to the file name in the form in size of 300px width and height auto
- Advertisement Name - Auto Created. format: [Advertiser ID] | [Advertiser - first 10 characters] - [Contract ID] - [Start Date YY.mm.dd] - [End Date YY.mm.dd] - [Image Name - first 10 characters] - [Image Size Coding] [width] x [height]
- Target Url - required. Type has to be full url with https:// you may already show as htts://[inputbox]. Ensure that you remove any leading https:// when typing in the url in the input box. save the whole url with https://
- html code - optional. textarea. It will have the html code for the advertisement. Often used for tracking pixels.

*AI Intelligence Section*
- Info Url - optional. Type has to be full url with https:// you may already show as htts://[inputbox]. Ensure that you remove any leading https:// when typing in the url in the input box. save the whole url with https://
- Extra Info - optional. textarea. Information that the sales team can provide to help with matching areas.



## 


