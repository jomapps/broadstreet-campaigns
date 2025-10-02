'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  List, 
  Archive,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';

interface SalesLayoutProps {
  children: React.ReactNode;
}

/**
 * Sales Layout Component
 * Provides submenu navigation for Sales section pages
 */
export default function SalesLayout({ children }: SalesLayoutProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Request',
      href: '/sales/request',
      icon: Plus,
      description: 'Create new advertising requests',
      active: pathname === '/sales/request',
    },
    {
      name: 'Open List',
      href: '/sales/open-list',
      icon: Clock,
      description: 'View and manage pending requests',
      active: pathname === '/sales/open-list',
    },
    {
      name: 'Audit Log',
      href: '/sales/audit-log',
      icon: Archive,
      description: 'View completed and cancelled requests',
      active: pathname === '/sales/audit-log',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sales Navigation */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Management</h2>
              <p className="text-sm text-gray-600">
                Manage advertising requests from creation to completion
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={item.active ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className={`flex items-center space-x-2 ${
                    item.active 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Link href={item.href}>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Active Page Description */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {navigationItems.map((item) => (
              item.active && (
                <p key={item.name} className="text-sm text-gray-600">
                  {item.description}
                </p>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
