'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ValidationCardProps {
  hasRequiredSelections: boolean;
  missingCriteria: string[];
  validationResult: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  error: string | null;
}

export default function ValidationCard({
  hasRequiredSelections,
  missingCriteria,
  validationResult,
  error
}: ValidationCardProps) {
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

  // Show validation results
  if (validationResult) {
    const { valid, errors, warnings } = validationResult;

    if (!valid) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Validation Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    }

    // Show success with warnings if any
    return (
      <Card className={warnings.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${warnings.length > 0 ? "text-yellow-800" : "text-green-800"}`}>
            {warnings.length > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {warnings.length > 0 ? "Ready with Warnings" : "Ready to Create"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`mb-2 ${warnings.length > 0 ? "text-yellow-700" : "text-green-700"}`}>
            All required criteria are selected. Placement combinations have been categorized by size type.
          </p>
          {warnings.length > 0 && (
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">Warnings:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          Processing...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Analyzing placement combinations...</p>
      </CardContent>
    </Card>
  );
}
