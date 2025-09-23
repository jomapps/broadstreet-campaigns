'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { UserButton } from '@clerk/nextjs';

const navigation = [
  { name: 'Broadstreet', href: 'https://my.broadstreetads.com/networks/9396/advertisers', external: true },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Networks', href: '/networks' },
  { name: 'Advertisers', href: '/advertisers' },
  { name: 'Advertisements', href: '/advertisements' },
  { name: 'Zones', href: '/zones' },
  { name: 'Campaigns', href: '/campaigns' },
  { name: 'Placements', href: '/placements' },
  { name: 'Themes', href: '/themes' },
  { name: 'Local Only', href: '/local-only' },
];

export default function Header() {
  const { status, error } = useSyncStatus();

  // Determine badge color and animation based on status
  const getBadgeProps = () => {
    switch (status.status) {
      case 'syncing':
      case 'validating':
        return {
          variant: 'secondary' as const,
          className: 'flex items-center space-x-1 bg-yellow-100 text-yellow-800 border-yellow-200',
          dotColor: 'bg-yellow-500',
          animate: true
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          className: 'flex items-center space-x-1',
          dotColor: 'bg-red-500',
          animate: true
        };
      case 'connected':
      default:
        return {
          variant: 'secondary' as const,
          className: 'flex items-center space-x-1',
          dotColor: 'bg-green-500',
          animate: false
        };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BS</span>
            </div>
            <h1 className="text-xl font-semibold">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard'}
            </h1>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button key={item.name} variant="ghost" size="sm" asChild>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.name}
                  </a>
                ) : (
                  <Link href={item.href}>
                    {item.name}
                  </Link>
                )}
              </Button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-2">
            <Badge
              variant={badgeProps.variant}
              className={badgeProps.className}
              title={error ? `Error: ${error}` : status.details?.validationStatus?.currentTheme ? `Validating: ${status.details.validationStatus.currentTheme}` : undefined}
            >
              <div className={`w-2 h-2 ${badgeProps.dotColor} rounded-full ${badgeProps.animate ? 'animate-pulse' : ''}`}></div>
              <span>{status.message}</span>
            </Badge>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
