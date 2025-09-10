'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SyncStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  count?: number;
  error?: string;
}

interface SyncProgressProps {
  onComplete: (success: boolean) => void;
  onClose: () => void;
}

const SYNC_STEPS: Omit<SyncStep, 'status' | 'progress' | 'count' | 'error'>[] = [
  { name: 'Networks' },
  { name: 'Advertisers' },
  { name: 'Zones' },
  { name: 'Campaigns' },
  { name: 'Advertisements' },
];

export default function SyncProgress({ onComplete, onClose }: SyncProgressProps) {
  const [steps, setSteps] = useState<SyncStep[]>(
    SYNC_STEPS.map(step => ({
      ...step,
      status: 'pending',
      progress: 0,
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  const getStatusIcon = (status: SyncStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
        );
      case 'in_progress':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        );
      case 'completed':
        return (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: SyncStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-muted-foreground';
      case 'in_progress':
        return 'text-primary';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  const startSync = async () => {
    setIsInitializing(true);
    setIsRunning(true);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0 })));
    setOverallProgress(0);

    try {
      // Start the sync process - this is where the 20s delay happens
      const response = await fetch('/api/sync/all', { method: 'POST' });
      const result = await response.json();
      
      // Hide spinner once we get the API response
      setIsInitializing(false);

      if (result.success) {
        // Simulate progress for each step
        for (let i = 0; i < steps.length; i++) {
          const stepName = steps[i].name.toLowerCase();
          const stepResult = result.results[stepName];
          
          // Mark step as in progress
          setSteps(prev => prev.map((step, index) => 
            index === i ? { ...step, status: 'in_progress', progress: 0 } : step
          ));

          // Simulate progress animation
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setSteps(prev => prev.map((step, index) => 
              index === i ? { ...step, progress } : step
            ));
          }

          // Mark step as completed
          setSteps(prev => prev.map((step, index) => 
            index === i ? {
              ...step,
              status: 'completed',
              progress: 100,
              count: stepResult?.count || 0,
            } : step
          ));
        }
        
        setOverallProgress(100);
        onComplete(true);
      } else {
        // Mark failed steps as error
        setSteps(prev => prev.map(step => {
          const stepResult = result.results[step.name.toLowerCase()];
          return {
            ...step,
            status: stepResult?.success ? 'completed' : 'error',
            progress: stepResult?.success ? 100 : 0,
            count: stepResult?.count || 0,
            error: stepResult?.error,
          };
        }));
        onComplete(false);
      }
    } catch (error) {
      // Mark all steps as error
      setSteps(prev => prev.map(step => ({
        ...step,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })));
      onComplete(false);
    } finally {
      setIsRunning(false);
    }
  };

  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const currentProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  useEffect(() => {
    setOverallProgress(currentProgress);
  }, [currentProgress]);

  // Auto-start sync when component mounts
  useEffect(() => {
    startSync();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Progress
            </CardTitle>
            <CardDescription>
              Syncing data from Broadstreet API
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isRunning || isInitializing}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Call Spinner */}
        {isInitializing && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground">Connecting to Broadstreet API...</span>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        {!isInitializing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Individual Steps */}
        {!isInitializing && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sync Steps</h4>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.name} className="flex items-center gap-3 p-3 rounded-lg border">
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
                          <Badge variant="secondary" className="text-xs">
                            {step.count} records
                          </Badge>
                        )}
                        {step.status === 'in_progress' && (
                          <span className="text-xs text-muted-foreground">
                            {step.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                    {step.status === 'in_progress' && (
                      <Progress value={step.progress} className="h-1 mt-2" />
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isInitializing && !isRunning && overallProgress > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
