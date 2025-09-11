# Broadstreet Campaigns Dashboard

A comprehensive Next.js dashboard for managing Broadstreet advertising campaigns with real-time data synchronization, local entity management, and advanced campaign tools.

## 🚀 Features

- **Real-time Data Sync**: Synchronize data with Broadstreet API with proper validation
- **Local Entity Management**: Create and manage entities locally before syncing
- **Fallback Ad Creation**: Automated fallback ad placement system
- **Advanced Filtering**: Filter content by network, advertiser, and campaign
- **Entity Lifecycle Management**: Proper handling of local vs synced entities
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: MongoDB with Mongoose ODM
- **API Integration**: Broadstreet API v1
- **State Management**: React Context API

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) with your browser to see the result.

## 📚 Documentation

- [App Overview](docs/app-docs/app-overview.md)
- [Sync Operations](docs/app-docs/sync-operations.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Creation Features](features/creation.md)
- [Entity Documentation](docs/entity-docs/README.md)
  - [Advertiser](docs/entity-docs/advertiser.md)
  - [Campaign](docs/entity-docs/campaign.md)
  - [Advertisement](docs/entity-docs/advertisement.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
