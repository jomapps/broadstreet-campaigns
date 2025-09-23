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
    const created = new Date(request.createdAt);
    const updated = new Date(request.updatedAt);
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {getStatusIcon(request.status)}
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
            <span className="text-gray-600">Contact:</span>
            <span className="font-medium">{request.advertiser_info.contact_person}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDate(request.createdAt)}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium">{formatDate(request.updatedAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{getDuration()}</span>
          </div>
        </div>

        {/* Advertisement Summary */}
        {request.advertisement && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Advertisement</h4>
              {request.advertisement.image_files && request.advertisement.image_files.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {request.advertisement.image_files.length} files
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{request.advertisement.name}</span>
              </div>
              
              {request.advertisement?.target_audience && (
                <div>
                  <span className="text-gray-600">Target:</span>
                  <span className="ml-2 font-medium">{request.advertisement.target_audience}</span>
                </div>
              )}

              {request.advertisement?.budget_range && (
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-medium">{request.advertisement.budget_range}</span>
                </div>
              )}

              {request.advertisement?.preferred_zones && request.advertisement.preferred_zones.length > 0 && (
                <div>
                  <span className="text-gray-600">Zones:</span>
                  <span className="ml-2 font-medium">{request.advertisement.preferred_zones.length} selected</span>
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
                      <span className="ml-2 font-medium">{lastStatus.changed_by}</span>
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
              {/* Full Contact Details */}
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><strong>Email:</strong> {request.advertiser_info.email}</div>
                  {request.advertiser_info.phone && (
                    <div><strong>Phone:</strong> {request.advertiser_info.phone}</div>
                  )}
                  {request.advertiser_info.website && (
                    <div><strong>Website:</strong> {request.advertiser_info.website}</div>
                  )}
                </div>
              </div>

              {/* Full Advertisement Details */}
              {request.advertisement && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Advertisement Details</h5>
                  <div className="text-sm text-gray-700 space-y-2">
                    {request.advertisement.description && (
                      <div><strong>Description:</strong> {request.advertisement.description}</div>
                    )}
                    {request.advertisement?.campaign_goals && (
                      <div><strong>Goals:</strong> {request.advertisement.campaign_goals}</div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Intelligence Summary */}
              {request.ai_intelligence && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">AI Intelligence</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    {request.ai_intelligence.target_demographics && (
                      <div><strong>Demographics:</strong> {request.ai_intelligence.target_demographics}</div>
                    )}
                    {request.ai_intelligence.interests && request.ai_intelligence.interests.length > 0 && (
                      <div><strong>Interests:</strong> {request.ai_intelligence.interests.join(', ')}</div>
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
                        <span className="text-gray-600">{status.changed_by}</span>
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
