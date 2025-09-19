'use client';

import { useState } from 'react';
import { DualSearchInput } from '@/components/ui/dual-search-input';

// TEST data for zones
const TEST_ZONES = [
  { _id: '1', name: 'Homepage Banner TEST', alias: 'home-banner', size_type: 'LS', network_id: 9396 },
  { _id: '2', name: 'Sidebar Square TEST', alias: 'sidebar-sq', size_type: 'SQ', network_id: 9396 },
  { _id: '3', name: 'Footer Leaderboard', alias: 'footer-lead', size_type: 'LS', network_id: 9396 },
  { _id: '4', name: 'Mobile Banner TEST', alias: 'mobile-banner', size_type: 'PT', network_id: 9396 },
  { _id: '5', name: 'Content Rectangle', alias: 'content-rect', size_type: 'SQ', network_id: 9396 },
];

export default function NegativeFilterTest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [negativeSearchTerm, setNegativeSearchTerm] = useState('');

  // Apply filtering logic similar to zones page
  const filteredZones = TEST_ZONES.filter(zone => {
    // Apply positive search filter first
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = zone.name.toLowerCase().includes(search) ||
                           (zone.alias && zone.alias.toLowerCase().includes(search));
      if (!matchesSearch) return false;
    }

    // Apply negative search filter (supersedes positive search)
    if (negativeSearchTerm.trim()) {
      const negativeSearch = negativeSearchTerm.toLowerCase();
      const zoneData = [
        zone.name,
        zone.alias,
        zone.size_type,
        zone._id
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (zoneData.includes(negativeSearch)) return false;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Negative Filter TEST</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Search Controls</h2>
        <div className="max-w-md">
          <DualSearchInput
            searchPlaceholder="Search zones..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            negativeSearchPlaceholder="Exclude zones containing..."
            negativeSearchValue={negativeSearchTerm}
            onNegativeSearchChange={setNegativeSearchTerm}
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Results ({filteredZones.length} of {TEST_ZONES.length} zones)
        </h2>
        
        {filteredZones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No zones match your search criteria
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredZones.map(zone => (
              <div key={zone._id} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold">{zone.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  <span>Alias: {zone.alias}</span>
                  <span className="ml-4">Size: {zone.size_type}</span>
                  <span className="ml-4">ID: {zone._id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">TEST Instructions:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Try searching for "TEST" in the positive search - should show 3 zones</li>
          <li>• Try excluding "TEST" in the negative search - should hide those 3 zones</li>
          <li>• Try searching "Banner" and excluding "Mobile" - should show only Homepage Banner</li>
          <li>• Negative filter supersedes positive search as per requirements</li>
        </ul>
      </div>
    </div>
  );
}
