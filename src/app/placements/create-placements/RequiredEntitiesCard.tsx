'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Network, Building, Target } from 'lucide-react';
import { getEntityId } from '@/lib/utils/entity-helpers';

interface RequiredEntitiesCardProps {
  hasRequiredSelections: boolean;
  missingCriteria: string[];
  selectedNetwork: any;
  selectedAdvertiser: any;
  selectedCampaign: any;
  selectedZones: any[];
  selectedAdvertisements: any[];
  error: string | null;
}

export default function RequiredEntitiesCard({
  hasRequiredSelections,
  missingCriteria,
  selectedNetwork,
  selectedAdvertiser,
  selectedCampaign,
  selectedZones,
  selectedAdvertisements,
  error
}: RequiredEntitiesCardProps) {
  // Show error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Show missing criteria
  if (!hasRequiredSelections) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Missing Required Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-3">
            Placement creation cannot proceed. Please select the following:
          </p>
          <ul className="list-disc list-inside space-y-1 text-orange-700">
            {missingCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // Show required entities when all selections are present
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <CheckCircle className="h-5 w-5" />
          Required Entities Selected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-700 mb-4">
          All required entities are selected. Placements will be created using:
        </p>
        
        {/* Network */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
          <Network className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{selectedNetwork?.name}</span>
              <Badge variant="outline" className="text-xs">
                ID: {getEntityId(selectedNetwork)}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Network</p>
          </div>
        </div>

        {/* Advertiser */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
          <Building className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{selectedAdvertiser?.name}</span>
              <Badge variant="outline" className="text-xs">
                ID: {getEntityId(selectedAdvertiser)}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Advertiser</p>
          </div>
        </div>

        {/* Campaign */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
          <Target className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{selectedCampaign?.name}</span>
              <Badge variant="outline" className="text-xs">
                ID: {getEntityId(selectedCampaign)}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Campaign</p>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-blue-200">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>Selected for placement creation:</span>
            <div className="flex gap-4">
              <span>{selectedZones.length} zones</span>
              <span>{selectedAdvertisements.length} advertisements</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
