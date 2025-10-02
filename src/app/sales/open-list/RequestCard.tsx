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
      case 'new':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
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
    router.push(`/sales/request/${String(request._id)}/view`);
  };

  const requestNumber = String(request._id).slice(-8).toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {request.campaign_name || requestNumber}
              </h3>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {request.advertiser_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status Update Buttons */}
            {request.status === 'new' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updating}
              >
                Start Work
              </Button>
            )}
            
            {request.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate('completed')}
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
            <span className="font-medium">{request.created_by_user_name}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{request.created_by_user_email}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDate(request.created_at)}</span>
          </div>
        </div>

        {/* Advertisement Info */}
        {request.advertisements && request.advertisements.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Advertisements</h4>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <ImageIcon className="w-4 h-4" />
                <span>{request.advertisements.length} file{request.advertisements.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contract:</strong> {request.contract_id}
            </p>
            
            {request.ad_areas_sold && request.ad_areas_sold.length > 0 && (
              <p className="text-sm text-gray-700 mb-2">
                <strong>Ad Areas:</strong> {request.ad_areas_sold.length}
              </p>
            )}

            {request.themes && request.themes.length > 0 && (
              <p className="text-sm text-gray-700">
                <strong>Themes:</strong> {request.themes.join(', ')}
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
              {request.extra_info && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Details</h5>
                  <p className="text-sm text-gray-700">{request.extra_info}</p>
                </div>
              )}

              {/* Campaign Goals */}
              {request.advertisements && request.advertisements.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Advertisement Details</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {request.advertisements.map((ad, index) => (
                      <div key={index}>
                        <p><strong>Name:</strong> {ad.advertisement_name}</p>
                        <p><strong>Size:</strong> {ad.width}x{ad.height} ({ad.size_coding})</p>
                        <p><strong>Target URL:</strong> {ad.target_url}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Zones */}
              {request.ad_areas_sold && request.ad_areas_sold.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Ad Areas</h5>
                  <div className="flex flex-wrap gap-1">
                    {request.ad_areas_sold.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getStatusLabel(area)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Intelligence */}
              {(request.keywords || request.info_url) && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">AI Intelligence</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {request.keywords && request.keywords.length > 0 && (
                      <p><strong>Keywords:</strong> {request.keywords.join(', ')}</p>
                    )}
                    {request.info_url && (
                      <p><strong>Info URL:</strong> {request.info_url}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Details */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Contact Details</h5>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Created By:</strong> {request.created_by_user_name}</p>
                  <p><strong>Email:</strong> {request.created_by_user_email}</p>
                  <p><strong>Created At:</strong> {formatDate(request.created_at)}</p>
                  {request.completed_at && (
                    <p><strong>Completed At:</strong> {formatDate(request.completed_at)}</p>
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
