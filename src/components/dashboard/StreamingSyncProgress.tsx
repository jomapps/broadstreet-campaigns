'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, Clock } from 'lucide-react';

interface SyncStep {
  key: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  error?: string;
  count?: number;
  progress?: number;
}

interface StreamingSyncProgressProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

export default function StreamingSyncProgress({ onComplete, onClose }: StreamingSyncProgressProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [, setCurrentPhase] = useState('connecting');
  const [currentMessage, setCurrentMessage] = useState('Connecting to Broadstreet API...');
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [steps, setSteps] = useState<SyncStep[]>([
    { key: 'cleanup', name: 'Cleanup', status: 'pending' },
    { key: 'networks', name: 'Networks', status: 'pending' },
    { key: 'advertisers', name: 'Advertisers', status: 'pending' },
    { key: 'zones', name: 'Zones', status: 'pending' },
    { key: 'campaigns', name: 'Campaigns', status: 'pending' },
    { key: 'advertisements', name: 'Advertisements', status: 'pending' },
    { key: 'placements', name: 'Placements', status: 'pending' },
  ]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const [startTime] = useState(Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Start the streaming sync
    const eventSource = new EventSource('/api/sync/stream', {
      withCredentials: false
    });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[StreamingSync] Connection opened');
    };

    eventSource.addEventListener('status', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Status update:', data);

        setCurrentPhase(data.phase);
        setCurrentMessage(data.message);
        setOverallProgress(data.progress);

        if (data.phase === 'initializing') {
          setIsConnecting(false);
        }
      } catch (error) {
        console.error('[StreamingSync] Failed to parse status event data:', error, event.data);
        return; // Skip processing this event
      }
    });

    eventSource.addEventListener('step-start', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Step start:', data);

        setCurrentPhase(data.phase);
        setCurrentMessage(data.message);
        setOverallProgress(data.progress);

        // Update step status
        setSteps(prev => prev.map(step =>
          step.key === data.phase
            ? { ...step, status: 'in_progress', message: data.message }
            : step
        ));

        // Calculate estimated time remaining
        if (data.currentStep && data.totalSteps) {
          const elapsed = Date.now() - startTime;
          const avgTimePerStep = elapsed / data.currentStep;
          const remainingSteps = data.totalSteps - data.currentStep;
          const estimated = Math.round((avgTimePerStep * remainingSteps) / 1000);
          setEstimatedTimeRemaining(estimated);
        }
      } catch (error) {
        console.error('[StreamingSync] Failed to parse step-start event data:', error, event.data);
        return; // Skip processing this event
      }
    });

    eventSource.addEventListener('step-progress', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Step progress:', data);

        setCurrentPhase(data.phase);
        setCurrentMessage(data.message);
        setOverallProgress(data.progress);

        // Update step with real-time count
        setSteps(prev => prev.map(step =>
          step.key === data.phase
            ? {
                ...step,
                status: 'in_progress',
                message: data.message,
                count: data.currentCount,
                progress: data.currentCount && data.totalCampaigns
                  ? Math.round((data.currentCount / (data.totalCampaigns * 10)) * 100)
                  : undefined
              }
            : step
        ));
      } catch (error) {
        console.error('[StreamingSync] Failed to parse step-progress event data:', error, event.data);
        return; // Skip processing this event
      }
    });

    eventSource.addEventListener('step-complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Step complete:', data);

        setOverallProgress(data.progress);

        // Update step status
        setSteps(prev => prev.map(step =>
          step.key === data.phase
            ? {
                ...step,
                status: 'completed',
                message: data.message,
                count: data.stepResult?.count
              }
            : step
        ));
      } catch (error) {
        console.error('[StreamingSync] Failed to parse step-complete event data:', error, event.data);
        return; // Skip processing this event
      }
    });

    eventSource.addEventListener('step-error', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Step error:', data);

        setHasErrors(true);
        setOverallProgress(data.progress);

        // Update step status
        setSteps(prev => prev.map(step =>
          step.key === data.phase
            ? {
                ...step,
                status: 'failed',
                message: data.message,
                error: data.stepResult?.error
              }
            : step
        ));
      } catch (error) {
        console.error('[StreamingSync] Failed to parse step-error event data:', error, event.data);
        return; // Skip processing this event
      }
    });

    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[StreamingSync] Sync complete:', data);

        setIsComplete(true);
        setCurrentPhase('completed');
        setCurrentMessage(data.message);
        setOverallProgress(100);
        setEstimatedTimeRemaining(0);

        onComplete(data.overallSuccess);
      } catch (error) {
        console.error('[StreamingSync] Failed to parse complete event data:', error, event.data);
        // Still mark as complete but with error state
        setIsComplete(true);
        setHasErrors(true);
        setCurrentPhase('error');
        setCurrentMessage('Sync completed but failed to parse completion data');
        setOverallProgress(100);
        setEstimatedTimeRemaining(0);
        onComplete(false);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as any).data);
        console.error('[StreamingSync] Sync error:', data);

        setIsComplete(true);
        setHasErrors(true);
        setCurrentPhase('error');
        setCurrentMessage(data.message);
        setOverallProgress(100);
        setEstimatedTimeRemaining(0);

        onComplete(false);
      } catch (e) {
        // Handle case where event.data doesn't exist or isn't JSON
        console.error('[StreamingSync] Sync error event:', event);

        setIsComplete(true);
        setHasErrors(true);
        setCurrentPhase('error');
        setCurrentMessage('Sync error occurred');
        setOverallProgress(100);
        setEstimatedTimeRemaining(0);

        onComplete(false);
      }
    });

    eventSource.onerror = (error) => {
      console.error('[StreamingSync] EventSource error:', error);
      setIsComplete(true);
      setHasErrors(true);
      setCurrentMessage('Connection error occurred');
      onComplete(false);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [onComplete, startTime]);

  const getStatusIcon = (status: SyncStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SyncStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'failed':
        return 'text-red-700';
      case 'in_progress':
        return 'text-blue-700';
      default:
        return 'text-gray-500';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Real-time Sync Progress
            </CardTitle>
            <CardDescription>
              Syncing data from Broadstreet API with rate limiting (1 request every 5s)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={!isComplete}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{currentMessage}</span>
            <div className="flex items-center gap-2">
              {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                <span className="text-muted-foreground">
                  ~{formatTime(estimatedTimeRemaining)} remaining
                </span>
              )}
              <span className="font-mono">{Math.round(overallProgress)}%</span>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">Connecting to API</p>
              <p className="text-xs text-blue-700">Establishing connection with rate limiting...</p>
            </div>
          </div>
        )}

        {/* Individual Steps */}
        {!isConnecting && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sync Steps</h4>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                        {step.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {step.count !== undefined && (
                          <Badge
                            variant={step.status === 'in_progress' ? "default" : "secondary"}
                            className={`text-xs ${
                              step.status === 'in_progress' && step.key === 'placements'
                                ? 'bg-blue-500 text-white animate-pulse'
                                : ''
                            }`}
                          >
                            {step.count.toLocaleString()} {step.key === 'placements' ? 'placements' : 'records'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {step.message && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {step.message}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {step.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Status */}
        {isComplete && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            hasErrors 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            {hasErrors ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                hasErrors ? 'text-red-900' : 'text-green-900'
              }`}>
                {hasErrors ? 'Sync completed with errors' : 'Sync completed successfully'}
              </p>
              <p className={`text-xs ${
                hasErrors ? 'text-red-700' : 'text-green-700'
              }`}>
                {hasErrors 
                  ? 'Some operations failed. Check the steps above for details.'
                  : 'All data has been synchronized successfully.'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
