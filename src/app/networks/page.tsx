'use client';

import { Suspense } from 'react';
import { useFilters } from '@/contexts/FilterContext';
import NetworkActions from '@/components/networks/NetworkActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Type for network data from filter context
type NetworkLean = {
  id: number;
  name: string;
  group_id?: number | null;
  web_home_url?: string;
  logo?: { url: string };
  valet_active: boolean;
  path: string;
  advertiser_count?: number;
  zone_count?: number;
};

interface NetworkCardProps {
  network: NetworkLean;
}

function NetworkCard({ network }: NetworkCardProps) {
  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {network.logo?.url ? (
              <img
                src={network.logo.url}
                alt={`${network.name} logo`}
                className="w-12 h-12 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">{network.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{network.name}</CardTitle>
              <CardDescription>ID: {network.id}</CardDescription>
            </div>
          </div>
          
          <Badge variant={network.valet_active ? "default" : "secondary"}>
            {network.valet_active ? 'Valet Active' : 'Standard'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {network.web_home_url && (
          <a
            href={network.web_home_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 inline-flex items-center space-x-1 transition-colors"
          >
            <span>{network.web_home_url}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Advertisers</p>
            <p className="text-xl font-bold">
              {network.advertiser_count || 0}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">Zones</p>
            <p className="text-xl font-bold">
              {network.zone_count || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NetworksList() {
  const { networks, isLoadingNetworks } = useFilters();

  if (isLoadingNetworks) {
    return <LoadingSkeleton />;
  }

  if (networks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No networks found. Try syncing data first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {networks.map((network) => (
        <NetworkCard key={network.id} network={network} />
      ))}
    </div>
  );
}

export default function NetworksPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Networks</h1>
            <p className="text-xl text-muted-foreground">
              Different websites where campaigns are run
            </p>
          </div>
          
          <Suspense fallback={<div className="bg-muted animate-pulse h-10 w-32 rounded-lg"></div>}>
            <NetworkActions />
          </Suspense>
        </div>
      </div>

      {/* Networks Grid */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Available Networks</h2>
          <p className="text-muted-foreground">Manage and view all your advertising networks</p>
        </div>
        
        <Suspense fallback={<LoadingSkeleton />}>
          <NetworksList />
        </Suspense>
      </div>
    </div>
  );
}
