'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, X } from 'lucide-react';

interface FormActionsProps {
  currentSection: 'advertiser' | 'advertisement' | 'ai';
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitError?: string;
}

/**
 * Form Actions Component
 * Handles navigation between form sections and submission
 */
export default function FormActions({
  currentSection,
  onNext,
  onPrevious,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: FormActionsProps) {
  const isFirstSection = currentSection === 'advertiser';
  const isLastSection = currentSection === 'ai';

  return (
    <div className="border-t border-gray-200 pt-6 mt-8">
      {/* Submit Error */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>

          {/* Previous Button */}
          {!isFirstSection && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Next Button */}
          {!isLastSection && (
            <Button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* Submit Button */}
          {isLastSection && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Section Progress Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          {currentSection === 'advertiser' && 'Step 1 of 3: Advertiser Information'}
          {currentSection === 'advertisement' && 'Step 2 of 3: Advertisement Details'}
          {currentSection === 'ai' && 'Step 3 of 3: AI Intelligence & Targeting'}
        </p>
      </div>
    </div>
  );
}
