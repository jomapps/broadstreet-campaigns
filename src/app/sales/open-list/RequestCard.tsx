'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  DollarSign,
  Target,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';
import { useRouter } from 'next/navigation';

interface RequestCardProps {
  request: IAdvertisingRequest;
  onStatusUpdate: (requestId: string, newStatus: string, notes?: string) => Promise<void>;
  onDelete: (requestId: string) => Promise<void>;
}

/**
 * Request Card Component
 * Displays individual advertising request using universal card design principles
 */
export default function RequestCard({
  request,
  onStatusUpdate,
  onDelete,
}: RequestCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'New':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusUpdate(String(request._id), newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(String(request._id));
  };

  const handleView = () => {
    router.push(`/sales/requests/${String(request._id)}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {request.request_number}
              </h3>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {request.advertiser_info.company_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Update Buttons */}
            {request.status === 'New' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('In Progress')}
                disabled={updating}
              >
                Start Work
              </Button>
            )}
            
            {request.status === 'In Progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('Completed')}
                disabled={updating}
              >
                Complete
              </Button>
            )}

            {/* Action Buttons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleView}
              className="text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Contact:</span>
            <span className="font-medium">{request.advertiser_info.contact_person}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{request.advertiser_info.email}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDate(request.createdAt)}</span>
          </div>
        </div>

        {/* Advertisement Info */}
        {request.advertisement && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Advertisement</h4>
              {request.advertisement.image_files && request.advertisement.image_files.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <ImageIcon className="w-4 h-4" />
                  <span>{request.advertisement.image_files.length} files</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mb-2">
              <strong>Name:</strong> {request.advertisement.name}
            </p>
            
            {request.advertisement?.target_audience && (
              <p className="text-sm text-gray-700 mb-2">
                <strong>Target:</strong> {request.advertisement.target_audience}
              </p>
            )}

            {request.advertisement?.budget_range && (
              <p className="text-sm text-gray-700">
                <strong>Budget:</strong> {request.advertisement.budget_range}
              </p>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show More</span>
              </>
            )}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Description */}
              {request.advertisement?.description && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Description</h5>
                  <p className="text-sm text-gray-700">{request.advertisement.description}</p>
                </div>
              )}

              {/* Campaign Goals */}
              {request.advertisement?.campaign_goals && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Campaign Goals</h5>
                  <p className="text-sm text-gray-700">{request.advertisement.campaign_goals}</p>
                </div>
              )}

              {/* Preferred Zones */}
              {request.advertisement?.preferred_zones && request.advertisement.preferred_zones.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Preferred Zones</h5>
                  <div className="flex flex-wrap gap-1">
                    {request.advertisement.preferred_zones.map((zone, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Intelligence */}
              {request.ai_intelligence && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">AI Intelligence</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {request.ai_intelligence.target_demographics && (
                      <p><strong>Demographics:</strong> {request.ai_intelligence.target_demographics}</p>
                    )}
                    {request.ai_intelligence.interests && request.ai_intelligence.interests.length > 0 && (
                      <p><strong>Interests:</strong> {request.ai_intelligence.interests.join(', ')}</p>
                    )}
                    {request.ai_intelligence.optimal_timing && (
                      <p><strong>Timing:</strong> {request.ai_intelligence.optimal_timing}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Contact Details</h5>
                <div className="text-sm text-gray-700 space-y-1">
                  {request.advertiser_info.phone && (
                    <p><strong>Phone:</strong> {request.advertiser_info.phone}</p>
                  )}
                  {request.advertiser_info.website && (
                    <p><strong>Website:</strong> {request.advertiser_info.website}</p>
                  )}
                  {request.advertiser_info.address && (
                    <p><strong>Address:</strong> {[
                      request.advertiser_info.address.street,
                      request.advertiser_info.address.city,
                      request.advertiser_info.address.state,
                      request.advertiser_info.address.postal_code,
                      request.advertiser_info.address.country
                    ].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
