import { Suspense } from 'react';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/network';
import Advertiser from '@/lib/models/advertiser';
import Advertisement from '@/lib/models/advertisement';
import Zone from '@/lib/models/zone';
import Campaign from '@/lib/models/campaign';
import QuickActions from '@/components/dashboard/QuickActions';

interface StatsCardProps {
  title: string;
  count: number;
  href: string;
  description: string;
}

function StatsCard({ title, count, href, description }: StatsCardProps) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <div className="text-3xl font-bold text-blue-600">{count}</div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function DashboardStats() {
  await connectDB();

  const [
    networkCount,
    advertiserCount,
    advertisementCount,
    zoneCount,
    campaignCount,
  ] = await Promise.all([
    Network.countDocuments(),
    Advertiser.countDocuments(),
    Advertisement.countDocuments(),
    Zone.countDocuments(),
    Campaign.countDocuments(),
  ]);

  const stats = [
    {
      title: 'Networks',
      count: networkCount,
      href: '/networks',
      description: 'Different websites where campaigns run',
    },
    {
      title: 'Advertisers',
      count: advertiserCount,
      href: '/advertisers',
      description: 'Companies running campaigns',
    },
    {
      title: 'Advertisements',
      count: advertisementCount,
      href: '/advertisements',
      description: 'Actual ads shown on websites',
    },
    {
      title: 'Zones',
      count: zoneCount,
      href: '/zones',
      description: 'Possible ad placements',
    },
    {
      title: 'Campaigns',
      count: campaignCount,
      href: '/campaigns',
      description: 'Active advertising campaigns',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <StatsCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your Broadstreet advertising system
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"><div className="h-20 bg-gray-200 rounded"></div></div>}>
        <QuickActions />
      </Suspense>
    </div>
  );
}
