# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns

# Broadstreet API Configuration
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=your_broadstreet_api_token_here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns
```

## Configuration Details

### MongoDB URI
- **Required**: Yes
- **Format**: `mongodb://[username:password@]host[:port]/database`
- **Example**: `mongodb://localhost:27017/broadstreet-campaigns`

### Broadstreet API Configuration
- **BROADSTREET_API_BASE_URL**: The base URL for the Broadstreet API
- **BROADSTREET_API_TOKEN**: Your Broadstreet API access token
- **Required**: Both are required for real API operations

### Next.js Configuration
- **NEXT_PUBLIC_APP_NAME**: The name displayed in the application header

## Verification

The application will show warnings in the console if:
- MongoDB URI is missing
- Broadstreet API configuration is missing

All API operations will fail without proper configuration.

## Security Notes

- Never commit `.env.local` to version control
- Keep your Broadstreet API token secure
- Use environment-specific configurations for different deployments
