'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Building, 
  User, 
  Mail, 
  Calendar,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  Target,
  Tag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { IAdvertisingRequest } from '@/lib/models/advertising-request';
// import CompletionModal from './CompletionModal'; // TODO: Implement completion modal

interface RequestDetailClientProps {
  request: IAdvertisingRequest;
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Request Detail Client Component
 * Displays detailed view of an advertising request with management actions
 */
export default function RequestDetailClient({ 
  request, 
  searchParams 
}: RequestDetailClientProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/advertising-requests/${String(request._id)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Status updated to ${getStatusLabel(newStatus)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/advertising-requests/${String(request._id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      // Navigate back to open list
      router.push('/sales/open-list');
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request. Please try again.');
    }
  };

  const requestNumber = String(request._id).slice(-8).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {request.campaign_name || `Request ${requestNumber}`}
                </h1>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
              <p className="text-lg text-gray-600">
                {request.advertiser_name}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Status Update Buttons */}
              {request.status === 'new' && (
                <Button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                  className="flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Start Work</span>
                </Button>
              )}
              
              {request.status === 'in_progress' && (
                <Button
                  onClick={() => setShowCompletionModal(true)}
                  disabled={updating}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete</span>
                </Button>
              )}

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Advertiser</label>
                <p className="text-base text-gray-900">{request.advertiser_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Advertiser ID</label>
                <p className="text-base text-gray-900">{request.advertiser_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contract ID</label>
                <p className="text-base text-gray-900">{request.contract_id}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Campaign Name</label>
                <p className="text-base text-gray-900">{request.campaign_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contract Start</label>
                <p className="text-base text-gray-900">
                  {formatDate(request.contract_start_date)}
                </p>
              </div>
              {request.contract_end_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract End</label>
                  <p className="text-base text-gray-900">
                    {formatDate(request.contract_end_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertisements */}
      {request.advertisements && request.advertisements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Advertisements ({request.advertisements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.advertisements.map((ad, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={ad.image_url}
                      alt={ad.image_alt_text}
                      className="w-32 h-auto rounded border"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium text-gray-900">{ad.advertisement_name}</h4>
                      <p className="text-sm text-gray-600">
                        Size: {ad.width}x{ad.height} ({ad.size_coding})
                      </p>
                      <p className="text-sm text-gray-600">
                        Target: <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {ad.target_url}
                        </a>
                      </p>
                      {ad.html_code && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">HTML Code</label>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {ad.html_code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Marketing Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Ad Areas Sold</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {request.ad_areas_sold.map((area, index) => (
                  <Badge key={index} variant="outline">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            {request.themes && request.themes.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Themes</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.themes.map((theme, index) => (
                    <Badge key={index} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Intelligence */}
      {(request.keywords || request.info_url || request.extra_info) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>AI Intelligence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.keywords && request.keywords.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {request.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {request.info_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Info URL</label>
                  <p className="text-base text-gray-900">
                    <a href={request.info_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center space-x-1">
                      <span>{request.info_url}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </p>
                </div>
              )}
              {request.extra_info && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Extra Information</label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{request.extra_info}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Request History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Created by:</span>
              <span className="font-medium">{request.created_by_user_name}</span>
              <span className="text-gray-500">({request.created_by_user_email})</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Created at:</span>
              <span className="font-medium">{formatDate(request.created_at)}</span>
            </div>
            {request.updated_at && request.updated_at !== request.created_at && (
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Last updated:</span>
                <span className="font-medium">{formatDate(request.updated_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TODO: Add CompletionModal component */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Request</h3>
            <p className="text-gray-600 mb-4">
              Completion workflow will be implemented here. For now, this will mark the request as completed.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCompletionModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleStatusUpdate('completed');
                  setShowCompletionModal(false);
                }}
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
