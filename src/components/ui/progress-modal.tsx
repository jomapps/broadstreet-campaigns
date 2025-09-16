'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, XCircle, AlertCircle, Loader2, Upload, Trash2 } from 'lucide-react';

export interface SyncStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  error?: string;
  count?: number;
  total?: number;
}

export interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: SyncStep[];
  currentStep?: string;
  overallProgress: number;
  isComplete: boolean;
  hasErrors: boolean;
  onRetry?: () => void;
  onConfirm?: () => void;
  'data-testid'?: string;
}

export function ProgressModal({
  isOpen,
  onClose,
  title,
  steps,
  currentStep,
  overallProgress,
  isComplete,
  hasErrors,
  onRetry,
  onConfirm,
  'data-testid': dataTestId
}: ProgressModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isComplete || hasErrors) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 200);
    }
  };

  const getStepIcon = (step: SyncStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepStatusColor = (step: SyncStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card 
        className={`w-full max-w-2xl max-h-[80vh] overflow-hidden transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        data-testid={dataTestId}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={!isComplete && !hasErrors}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-gray-600">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {steps.map((step) => (
              <div
                key={step.stepId}
                className={`p-3 rounded-lg border transition-all duration-200 ${getStepStatusColor(step)} ${
                  currentStep === step.stepId ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          step.status === 'completed' ? 'border-green-300 text-green-700' :
                          step.status === 'failed' ? 'border-red-300 text-red-700' :
                          step.status === 'in_progress' ? 'border-blue-300 text-blue-700' :
                          'border-gray-300 text-gray-700'
                        }`}
                      >
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {step.message && (
                      <p className="text-xs text-gray-600 mb-1">{step.message}</p>
                    )}
                    
                    {step.error && (
                      <div className="flex items-start space-x-1">
                        <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">{step.error}</p>
                      </div>
                    )}
                    
                    {step.count !== undefined && step.total !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{step.count} / {step.total}</span>
                        </div>
                        <Progress 
                          value={(step.count / step.total) * 100} 
                          className="h-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {isComplete && !hasErrors && (
              <Button onClick={onConfirm || onClose} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            
            {hasErrors && onRetry && (
              <Button onClick={onRetry} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            
            {isComplete || hasErrors ? (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            ) : (
              <Button onClick={onClose} variant="outline" disabled>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing sync progress
export function useSyncProgress() {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<SyncStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  const initializeSteps = (entityCounts: Record<string, number>) => {
    const newSteps: SyncStep[] = [
      {
        id: 'dry-run',
        name: 'Dry Run Validation',
        status: 'pending',
        message: 'Checking for name conflicts...'
      },
      {
        id: 'networks',
        name: 'Syncing Networks',
        status: 'pending',
        count: 0,
        total: entityCounts.networks || 0
      },
      {
        id: 'advertisers',
        name: 'Syncing Advertisers',
        status: 'pending',
        count: 0,
        total: entityCounts.advertisers || 0
      },
      {
        id: 'zones',
        name: 'Syncing Zones',
        status: 'pending',
        count: 0,
        total: entityCounts.zones || 0
      },
      {
        id: 'advertisements',
        name: 'Syncing Advertisements',
        status: 'pending',
        count: 0,
        total: entityCounts.advertisements || 0
      },
      {
        id: 'campaigns',
        name: 'Syncing Campaigns',
        status: 'pending',
        count: 0,
        total: entityCounts.campaigns || 0
      }
    ];
    
    setSteps(newSteps);
    setCurrentStep('');
    setOverallProgress(0);
    setIsComplete(false);
    setHasErrors(false);
  };

  const updateStep = (stepId: string, updates: Partial<SyncStep>) => {
    setSteps(prev => prev.map(step =>
      step.stepId === stepId ? { ...step, ...updates } : step
    ));
  };

  const setStepInProgress = (stepId: string) => {
    setCurrentStep(stepId);
    updateStep(stepId, { status: 'in_progress' });
  };

  const setStepCompleted = (stepId: string, message?: string) => {
    updateStep(stepId, { 
      status: 'completed', 
      message: message || 'Completed successfully'
    });
  };

  const setStepFailed = (stepId: string, error: string) => {
    updateStep(stepId, { 
      status: 'failed', 
      error 
    });
    setHasErrors(true);
  };

  const updateStepProgress = (stepId: string, count: number) => {
    updateStep(stepId, { count });
  };

  const calculateOverallProgress = () => {
    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const inProgressSteps = steps.filter(step => step.status === 'in_progress').length;
    
    let progress = (completedSteps / totalSteps) * 100;
    
    // Add partial progress for in-progress step
    if (inProgressSteps > 0) {
      const inProgressStep = steps.find(step => step.status === 'in_progress');
      if (inProgressStep && inProgressStep.total && inProgressStep.total > 0) {
        const stepProgress = ((inProgressStep.count || 0) / inProgressStep.total) * 100;
        progress += (stepProgress / totalSteps);
      }
    }
    
    setOverallProgress(Math.min(progress, 100));
  };

  const completeSync = (success: boolean, errors?: string[]) => {
    setIsComplete(true);
    if (errors && errors.length > 0) {
      setHasErrors(true);
    }
    
    // Update final step
    const finalStep = steps[steps.length - 1];
    if (finalStep) {
      updateStep(finalStep.stepId, {
        status: success ? 'completed' : 'failed',
        message: success ? 'Sync completed successfully' : 'Sync completed with errors',
        error: errors && errors.length > 0 ? errors.join(', ') : undefined
      });
    }
  };

  // Update overall progress when steps change
  useEffect(() => {
    calculateOverallProgress();
  }, [steps]);

  return {
    isOpen,
    setIsOpen,
    steps,
    currentStep,
    overallProgress,
    isComplete,
    hasErrors,
    initializeSteps,
    updateStep,
    setStepInProgress,
    setStepCompleted,
    setStepFailed,
    updateStepProgress,
    completeSync
  };
}
