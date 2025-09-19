'use client';

import { Button } from '@/components/ui/button';
import { getTotalPlacementCount, getCategorizedPlacementCount } from '@/lib/utils/placement-categorization';
import type { CategorizedPlacements } from '@/lib/utils/placement-categorization';

interface CreationButtonsProps {
  categories: CategorizedPlacements;
  onCreateWithIgnored: () => void;
  onCreateWithoutIgnored: () => void;
  isCreating: boolean;
  disabled: boolean;
}

export default function CreationButtons({
  categories,
  onCreateWithIgnored,
  onCreateWithoutIgnored,
  isCreating,
  disabled
}: CreationButtonsProps) {
  const totalCount = getTotalPlacementCount(categories);
  const categorizedCount = getCategorizedPlacementCount(categories);
  const ignoredCount = categories.IGNORED.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Summary Information */}
      <div className="text-center text-sm text-gray-600">
        <p>
          <span className="font-medium">{categorizedCount}</span> categorized placements 
          {ignoredCount > 0 && (
            <>
              {' + '}
              <span className="font-medium text-red-600">{ignoredCount}</span> ignored placements
            </>
          )}
          {' = '}
          <span className="font-medium">{totalCount}</span> total combinations
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Create with IGNORED button */}
        <Button
          onClick={onCreateWithIgnored}
          disabled={disabled || isCreating}
          className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 min-w-[200px]"
          size="lg"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Creating...
            </div>
          ) : (
            <>
              Create Placements with IGNORED
              <span className="ml-2 text-red-200">({totalCount})</span>
            </>
          )}
        </Button>

        {/* Create without IGNORED button */}
        <Button
          onClick={onCreateWithoutIgnored}
          disabled={disabled || isCreating || categorizedCount === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 min-w-[200px]"
          size="lg"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Creating...
            </div>
          ) : (
            <>
              Create Placements without IGNORED
              <span className="ml-2 text-green-200">({categorizedCount})</span>
            </>
          )}
        </Button>
      </div>

      {/* Additional Information */}
      {ignoredCount > 0 && (
        <div className="text-center text-xs text-gray-500 max-w-md">
          <p>
            <strong>With IGNORED:</strong> Creates all {totalCount} combinations including those without matching size types.
          </p>
          <p className="mt-1">
            <strong>Without IGNORED:</strong> Creates only {categorizedCount} combinations with matching size types (SQ, LS, PT).
          </p>
        </div>
      )}

      {categorizedCount === 0 && ignoredCount > 0 && (
        <div className="text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md">
          <p className="font-medium">⚠️ No Categorized Placements</p>
          <p className="text-xs mt-1">
            All combinations are in IGNORED category. Consider reviewing zone and advertisement naming for size type matching.
          </p>
        </div>
      )}
    </div>
  );
}
