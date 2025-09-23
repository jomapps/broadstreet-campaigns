/**
 * DASHBOARD CONTENT - MAIN DASHBOARD UI
 * 
 * Main dashboard content component that displays stats and quick actions.
 * Reads data from Zustand stores and displays entity counts and navigation.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QuickActions from '@/components/dashboard/QuickActions';
import { useAllFilters } from '@/stores';

/**
 * Props interface for StatsCard
 * Variable names follow docs/variable-origins.md registry
 */
interface StatsCardProps {
  title: string;
  count: number;
  href: string;
  description: string;
}

/**
 * StatsCard - Individual stat card component
 * Variable names follow docs/variable-origins.md registry
 */
function StatsCard({ title, count, href, description }: StatsCardProps) {
  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'networks':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        );
      case 'advertisers':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'advertisements':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'zones':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'campaigns':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'placements':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {getIcon(title)}
              </div>
              <div>
                <CardTitle className="card-title">{title}</CardTitle>
                <CardDescription className="card-text">{description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="card-text font-bold px-2 py-1" data-testid="stats-count">
              {count.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Button variant="ghost" size="sm" className="w-full justify-between group-hover:bg-primary/5 card-text">
            <span>View details</span>
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Props interface for DashboardContent
 * Variable names follow docs/variable-origins.md registry
 */
interface DashboardContentProps {
  entityCounts: any;
}

/**
 * DashboardContent - Main dashboard content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function DashboardContent({ entityCounts }: DashboardContentProps) {
  // Get selected network from filter store
  const { selectedNetwork } = useAllFilters();

  // State for current entity counts (can be refreshed after sync)
  const [currentEntityCounts, setCurrentEntityCounts] = useState(entityCounts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh entity counts from server
  const refreshEntityCounts = async () => {
    try {
      setIsRefreshing(true);

      // Get network ID from selected network, default to 9396
      const networkId = (selectedNetwork as any)?.broadstreet_id || 9396;

      const url = `/api/dashboard/entity-counts?network=${networkId}`;
      const response = await fetch(url);
      if (response.ok) {
        const freshCounts = await response.json();
        setCurrentEntityCounts(freshCounts);
      }
    } catch (error) {
      console.error('Failed to refresh entity counts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for sync completion events to refresh counts
  useEffect(() => {
    const handleSyncComplete = () => {
      // Small delay to ensure database operations are complete
      setTimeout(() => {
        refreshEntityCounts();
      }, 1000);
    };

    // Listen for custom sync completion events
    window.addEventListener('syncComplete', handleSyncComplete);

    return () => {
      window.removeEventListener('syncComplete', handleSyncComplete);
    };
  }, []);

  // Build stats array from current entity counts
  const stats = [
    {
      title: 'Networks',
      count: currentEntityCounts.networks || 0,
      href: '/networks',
      description: 'Different websites where campaigns run',
    },
    {
      title: 'Advertisers',
      count: currentEntityCounts.advertisers || 0,
      href: '/advertisers',
      description: 'Companies running campaigns',
    },
    {
      title: 'Advertisements',
      count: currentEntityCounts.advertisements || 0,
      href: '/advertisements',
      description: 'Actual ads shown on websites',
    },
    {
      title: 'Zones',
      count: currentEntityCounts.zones || 0,
      href: '/zones',
      description: 'Possible ad placements',
    },
    {
      title: 'Campaigns',
      count: currentEntityCounts.campaigns || 0,
      href: '/campaigns',
      description: 'Active advertising campaigns',
    },
    {
      title: 'Placements',
      count: currentEntityCounts.placements || 0,
      href: '/placements',
      description: 'Ad placements in campaigns',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="card-title">System Overview</h2>
          <p className="card-text text-muted-foreground">Current status of all your advertising entities</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="card-title">Quick Actions</h2>
          <p className="card-text text-muted-foreground">Common tasks and utilities</p>
        </div>
        
        <Suspense fallback={
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <QuickActions />
        </Suspense>
      </div>
    </div>
  );
}
