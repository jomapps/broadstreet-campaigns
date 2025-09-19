'use client';

import { useState, useMemo } from 'react';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe, Users, Image as ImageIcon, Calendar, Target, Folder,
  CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import NegativeFilterTest from './negative-filter-test';

// Sample data for each entity type
const sampleData = {
  network: {
    title: 'Sample Network',
    broadstreet_id: 12345,
    mongo_id: '507f1f77bcf86cd799439011',
    entityType: 'network' as const,
    imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Network+Logo',
    subtitle: 'Premium Ad Network',
    description: 'A comprehensive advertising network serving high-quality ads across multiple verticals with advanced targeting capabilities.',
    titleUrl: '/networks/12345',
    isSelected: false,
    isLocal: false,
    isActive: true,
    topTags: [
      { label: 'Premium', variant: 'default' as const },
      { label: 'Valet Active', variant: 'secondary' as const, icon: CheckCircle }
    ],
    statusBadge: { label: 'Active', variant: 'success' as const, icon: CheckCircle },
    displayData: [
      { label: 'Advertisers', value: 45, type: 'number' as const },
      { label: 'Zones', value: 128, type: 'number' as const },
      { label: 'Created', value: new Date('2023-01-15'), type: 'date' as const },
      { label: 'Revenue', value: '$12,450', type: 'string' as const }
    ],
    actionButtons: [
      { label: 'View Details', onClick: () => alert('View Network Details'), variant: 'default' as const },
      { label: 'Edit', onClick: () => alert('Edit Network'), variant: 'outline' as const }
    ],
    bottomTags: [
      { label: 'Technology', variant: 'outline' as const },
      { label: 'Finance', variant: 'outline' as const }
    ]
  },
  advertiser: {
    title: 'Acme Corporation',
    broadstreet_id: 67890,
    mongo_id: '507f1f77bcf86cd799439012',
    entityType: 'advertiser' as const,
    imageUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Acme+Logo',
    subtitle: 'Fortune 500 Company',
    description: 'Leading technology company specializing in innovative solutions for enterprise customers worldwide.',
    isSelected: true,
    isLocal: false,
    isActive: true,
    topTags: [
      { label: 'Enterprise', variant: 'default' as const },
      { label: 'Verified', variant: 'secondary' as const, icon: CheckCircle }
    ],
    statusBadge: { label: 'Active', variant: 'success' as const, icon: CheckCircle },
    displayData: [
      { label: 'Campaigns', value: 12, type: 'number' as const },
      { label: 'Spend', value: '$25,000', type: 'string' as const },
      { label: 'Last Active', value: new Date('2024-01-10'), type: 'date' as const }
    ],
    actionButtons: [
      { label: 'Create Campaign', onClick: () => alert('Create Campaign'), variant: 'default' as const },
      { label: 'View Stats', onClick: () => alert('View Stats'), variant: 'outline' as const }
    ]
  },
  advertisement: {
    title: 'Holiday Sale Banner',
    broadstreet_id: 11111,
    mongo_id: '507f1f77bcf86cd799439013',
    entityType: 'advertisement' as const,
    imageUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Holiday+Sale',
    subtitle: '728x90 Banner Ad',
    description: 'Eye-catching holiday promotion banner featuring seasonal graphics and compelling call-to-action.',
    isSelected: false,
    isLocal: false,
    isActive: true,
    topTags: [
      { label: 'Seasonal', variant: 'default' as const },
      { label: 'High CTR', variant: 'secondary' as const }
    ],
    statusBadge: { label: 'Live', variant: 'success' as const, icon: CheckCircle },
    displayData: [
      { label: 'Size', value: '728x90', type: 'string' as const },
      { label: 'CTR', value: 2.4, type: 'progress' as const },
      { label: 'Impressions', value: 125000, type: 'number' as const },
      { label: 'Created', value: new Date('2023-12-01'), type: 'date' as const }
    ],
    actionButtons: [
      { label: 'Preview', onClick: () => alert('Preview Ad'), variant: 'default' as const },
      { label: 'Edit Creative', onClick: () => alert('Edit Creative'), variant: 'outline' as const }
    ],
    bottomTags: [
      { label: 'Retail', variant: 'outline' as const },
      { label: 'Promotional', variant: 'outline' as const }
    ]
  },
  campaign: {
    title: 'Q1 Brand Awareness',
    broadstreet_id: 22222,
    mongo_id: '507f1f77bcf86cd799439014',
    entityType: 'campaign' as const,
    subtitle: 'Brand Campaign • Acme Corporation',
    description: 'Comprehensive brand awareness campaign targeting key demographics across multiple channels.',
    isSelected: false,
    isLocal: true,
    isActive: true,
    onDelete: () => alert('Delete Campaign'),
    topTags: [
      { label: 'Brand', variant: 'default' as const },
      { label: 'Multi-Channel', variant: 'secondary' as const }
    ],
    statusBadge: { label: 'Running', variant: 'success' as const, icon: Clock },
    displayData: [
      { label: 'Budget', value: '$50,000', type: 'string' as const },
      { label: 'Spent', value: 65, type: 'progress' as const },
      { label: 'Start Date', value: new Date('2024-01-01'), type: 'date' as const },
      { label: 'End Date', value: new Date('2024-03-31'), type: 'date' as const },
      { label: 'Placements', value: 8, type: 'number' as const }
    ],
    actionButtons: [
      { label: 'View Report', onClick: () => alert('View Report'), variant: 'default' as const },
      { label: 'Pause', onClick: () => alert('Pause Campaign'), variant: 'outline' as const }
    ],
    onCopyToTheme: async (themeName: string) => {
      alert(`Copying campaign zones to theme: ${themeName}`);
    }
  },
  placement: {
    title: 'Homepage Banner Placement',
    mongo_id: '507f1f77bcf86cd799439015',
    entityType: 'placement' as const,
    subtitle: 'Holiday Sale Banner → Tech News Zone',
    description: 'Strategic placement of holiday promotion on high-traffic technology news homepage.',
    isSelected: false,
    isLocal: true,
    isActive: true,
    onDelete: () => alert('Delete Placement'),
    topTags: [
      { label: 'Homepage', variant: 'default' as const },
      { label: 'High Traffic', variant: 'secondary' as const }
    ],
    statusBadge: { label: 'Active', variant: 'success' as const, icon: CheckCircle },
    displayData: [
      { label: 'Campaign', value: 'Q1 Brand Awareness', type: 'string' as const },
      { label: 'Advertisement', value: 'Holiday Sale Banner', type: 'string' as const },
      { label: 'Zone', value: 'Tech News Homepage', type: 'string' as const },
      { label: 'Impressions', value: 45000, type: 'number' as const },
      { label: 'Performance', value: 3.2, type: 'progress' as const }
    ],
    actionButtons: [
      { label: 'View Stats', onClick: () => alert('View Stats'), variant: 'default' as const },
      { label: 'Modify', onClick: () => alert('Modify Placement'), variant: 'outline' as const }
    ]
  },
  zone: {
    title: 'Tech News Homepage',
    broadstreet_id: 33333,
    mongo_id: '507f1f77bcf86cd799439016',
    entityType: 'zone' as const,
    subtitle: '728x90 • Above Fold',
    description: 'Premium above-the-fold banner position on technology news homepage with high engagement rates.',
    isSelected: false,
    isLocal: false,
    isActive: true,
    topTags: [
      { label: 'Premium', variant: 'default' as const },
      { label: 'Above Fold', variant: 'secondary' as const }
    ],
    statusBadge: { label: 'Available', variant: 'success' as const, icon: CheckCircle },
    displayData: [
      { label: 'Size', value: '728x90', type: 'string' as const },
      { label: 'Network', value: 'Sample Network', type: 'string' as const },
      { label: 'Daily Views', value: 15000, type: 'number' as const },
      { label: 'Fill Rate', value: 85, type: 'progress' as const }
    ],
    actionButtons: [
      { label: 'Create Placement', onClick: () => alert('Create Placement'), variant: 'default' as const },
      { label: 'View Analytics', onClick: () => alert('View Analytics'), variant: 'outline' as const }
    ],
    bottomTags: [
      { label: 'Technology', variant: 'outline' as const },
      { label: 'News', variant: 'outline' as const }
    ],
    onCopyToTheme: async (themeName: string) => {
      alert(`Adding zone to theme: ${themeName}`);
    }
  },
  theme: {
    title: 'Tech Vertical Theme',
    mongo_id: '507f1f77bcf86cd799439017',
    entityType: 'theme' as const,
    subtitle: '12 zones • Technology Focus',
    description: 'Curated collection of high-performing zones in the technology vertical for targeted campaigns.',
    isSelected: false,
    isLocal: true,
    isActive: true,
    onDelete: () => alert('Delete Theme'),
    topTags: [
      { label: 'Curated', variant: 'default' as const },
      { label: 'High Performance', variant: 'secondary' as const }
    ],
    statusBadge: { label: 'Active', variant: 'success' as const, icon: Folder },
    displayData: [
      { label: 'Zones', value: 12, type: 'number' as const },
      { label: 'Avg CTR', value: 2.8, type: 'progress' as const },
      { label: 'Created', value: new Date('2023-11-15'), type: 'date' as const },
      { label: 'Last Updated', value: new Date('2024-01-05'), type: 'date' as const }
    ],
    actionButtons: [
      { label: 'View Zones', onClick: () => alert('View Zones'), variant: 'default' as const },
      { label: 'Clone Theme', onClick: () => alert('Clone Theme'), variant: 'outline' as const }
    ],
    bottomTags: [
      { label: 'Technology', variant: 'outline' as const },
      { label: 'B2B', variant: 'outline' as const }
    ]
  }
};

const entityTypes = [
  { value: 'all', label: 'All Entity Types' },
  { value: 'network', label: 'Networks' },
  { value: 'advertiser', label: 'Advertisers' },
  { value: 'advertisement', label: 'Advertisements' },
  { value: 'campaign', label: 'Campaigns' },
  { value: 'placement', label: 'Placements' },
  { value: 'zone', label: 'Zones' },
  { value: 'theme', label: 'Themes' }
];

export default function TestPage() {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Filter sample data based on selected entity type
  const filteredData = useMemo(() => {
    if (selectedEntityType === 'all') {
      return Object.entries(sampleData);
    }
    return Object.entries(sampleData).filter(([key]) => key === selectedEntityType);
  }, [selectedEntityType]);

  // Handle card selection
  const handleCardSelect = (entityKey: string, isSelected: boolean) => {
    const newSelected = new Set(selectedCards);
    if (isSelected) {
      newSelected.add(entityKey);
    } else {
      newSelected.delete(entityKey);
    }
    setSelectedCards(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Universal Entity Card Test</h1>
          <p className="text-gray-600 mt-2">
            Testing the universal entity card component with sample data from all entity types.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Test Page
        </Badge>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-xs">
              <label htmlFor="entity-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger id="entity-filter">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Selected:</span>
              <Badge variant="secondary">{selectedCards.size}</Badge>
            </div>
            
            {selectedCards.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCards(new Set())}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(([entityKey, entityData]) => (
          <UniversalEntityCard
            key={entityKey}
            {...entityData}
            showCheckbox={true}
            isSelected={selectedCards.has(entityKey)}
            onSelect={(isSelected) => handleCardSelect(entityKey, isSelected)}
            onCardClick={() => alert(`Clicked on ${entityData.title}`)}
            testId={`test-card-${entityKey}`}
            ariaLabel={`${entityData.title} ${entityKey} card`}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entities found</h3>
          <p className="text-gray-600">
            No entities match the selected filter criteria.
          </p>
        </div>
      )}

      {/* Negative Filter Test Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Negative Filter TEST</CardTitle>
        </CardHeader>
        <CardContent>
          <NegativeFilterTest />
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-2">
            <div>
              <strong>Selected Entity Type:</strong> {selectedEntityType}
            </div>
            <div>
              <strong>Showing Cards:</strong> {filteredData.length}
            </div>
            <div>
              <strong>Selected Cards:</strong> {Array.from(selectedCards).join(', ') || 'None'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
