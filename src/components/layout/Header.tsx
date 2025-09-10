import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Networks', href: '/networks' },
  { name: 'Advertisers', href: '/advertisers' },
  { name: 'Advertisements', href: '/advertisements' },
  { name: 'Zones', href: '/zones' },
  { name: 'Campaigns', href: '/campaigns' },
  { name: 'Placements', href: '/placements' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BS</span>
            </div>
            <h1 className="text-xl font-semibold">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Broadstreet Publishing Dashboard'}
            </h1>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button key={item.name} variant="ghost" size="sm" asChild>
                <Link href={item.href}>
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>API Connected</span>
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
