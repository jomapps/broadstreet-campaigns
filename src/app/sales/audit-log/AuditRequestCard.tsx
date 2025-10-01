'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Building, 
  User, 
  Mail, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';
import { useRouter } from 'next/navigation';

interface AuditRequestCardProps {
  request: IAdvertisingRequest;
}

/**
 * Audit Request Card Component
 * Displays completed/cancelled advertising requests in read-only format
 */
export default function AuditRequestCard({ request }: AuditRequestCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
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

  const getDuration = () => {
    const created = new Date(request.created_at);
    const updated = new Date(request.updated_at);
    const diffMs = updated.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m`;
    }
  };

  const handleView = () => {
    router.push(`/sales/requests/${String(request._id)}`);
  };

  // Generate request number from ID
  const requestNumber = String(request._id).slice(-8).toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {getStatusIcon(request.status)}
              <h3 className="font-semibold text-lg text-gray-900">
                {request.campaign_name || requestNumber}
              </h3>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {request.advertiser_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleView}
              className="text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Created By:</span>
            <span className="font-medium">{request.created_by_user_name}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDate(request.created_at)}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium">{formatDate(request.updated_at)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{getDuration()}</span>
          </div>
        </div>

        {/* Advertisement Summary */}
        {request.advertisements && request.advertisements.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Advertisements</h4>
              <Badge variant="outline" className="text-xs">
                {request.advertisements.length} file{request.advertisements.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Contract:</span>
                <span className="ml-2 font-medium">{request.contract_id}</span>
              </div>
              
              {request.ad_areas_sold && request.ad_areas_sold.length > 0 && (
                <div>
                  <span className="text-gray-600">Ad Areas:</span>
                  <span className="ml-2 font-medium">{request.ad_areas_sold.length} area{request.ad_areas_sold.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {request.themes && request.themes.length > 0 && (
                <div>
                  <span className="text-gray-600">Themes:</span>
                  <span className="ml-2 font-medium">{request.themes.length} theme{request.themes.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {request.completed_campaign_id && (
                <div>
                  <span className="text-gray-600">Campaign ID:</span>
                  <span className="ml-2 font-medium">{request.completed_campaign_id}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status History Summary */}
        {request.status_history && request.status_history.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Final Status</h4>
            <div className="text-sm">
              {(() => {
                const lastStatus = request.status_history[request.status_history.length - 1];
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-600">Changed to:</span>
                      <span className="ml-2 font-medium">{lastStatus.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">By:</span>
                      <span className="ml-2 font-medium">{lastStatus.changed_by_user_name}</span>
                    </div>
                  </div>
                );
              })()}
              {(() => {
                const lastStatus = request.status_history[request.status_history.length - 1];
                return lastStatus.notes && (
                  <div className="mt-2">
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2 text-gray-700">{lastStatus.notes}</span>
                  </div>
                );
              })()}
            </div>
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
                <span>Show Details</span>
              </>
            )}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Full Advertiser Details */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Advertiser Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><strong>Advertiser ID:</strong> {request.advertiser_id}</div>
                  <div><strong>Contract ID:</strong> {request.contract_id}</div>
                  <div><strong>Contract Start:</strong> {formatDate(request.contract_start_date)}</div>
                  {request.contract_end_date && (
                    <div><strong>Contract End:</strong> {formatDate(request.contract_end_date)}</div>
                  )}
                </div>
              </div>

              {/* Full Advertisement Details */}
              {request.advertisements && request.advertisements.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Advertisement Details</h5>
                  <div className="text-sm text-gray-700 space-y-2">
                    {request.advertisements.map((ad, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div><strong>Name:</strong> {ad.advertisement_name}</div>
                        <div><strong>Size:</strong> {ad.width}x{ad.height} ({ad.size_coding})</div>
                        {ad.target_url && (
                          <div><strong>URL:</strong> {ad.target_url}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Intelligence Summary */}
              {(request.keywords || request.info_url || request.extra_info) && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">AI Intelligence</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {request.keywords && request.keywords.length > 0 && (
                      <div><strong>Keywords:</strong> {request.keywords.join(', ')}</div>
                    )}
                    {request.info_url && (
                      <div><strong>Info URL:</strong> {request.info_url}</div>
                    )}
                    {request.extra_info && (
                      <div><strong>Extra Info:</strong> {request.extra_info}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Complete Status History */}
              {request.status_history && request.status_history.length > 1 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Status History</h5>
                  <div className="space-y-2">
                    {request.status_history.map((status, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {status.status}
                          </Badge>
                          <span className="text-gray-600">{formatDate(status.changed_at)}</span>
                        </div>
                        <span className="text-gray-600">{status.changed_by_user_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
