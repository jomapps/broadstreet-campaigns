'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSizeTypeDisplayInfo, getIgnoredDisplayInfo } from '@/lib/utils/placement-categorization';
import type { CategorizedPlacements, PlacementCombination } from '@/lib/utils/placement-categorization';

interface PlacementCategoryCardsProps {
  categories: CategorizedPlacements;
}

interface CategoryCardProps {
  title: string;
  description: string;
  count: number;
  combinations: PlacementCombination[];
  colorClass: string;
}

function CategoryCard({ title, description, count, combinations, colorClass }: CategoryCardProps) {
  return (
    <Card className={`border-2 ${colorClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className={`${colorClass} font-bold`}>
            {count}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-gray-500 italic">No combinations</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {combinations.slice(0, 10).map((combination, index) => (
              <div key={index} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                <div className="font-medium text-gray-900 truncate">
                  {combination.zone.name}
                </div>
                <div className="text-gray-600 truncate">
                  × {combination.advertisement.name}
                </div>
              </div>
            ))}
            {combinations.length > 10 && (
              <div className="text-xs text-gray-500 italic pt-2 border-t">
                ... and {combinations.length - 10} more combinations
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlacementCategoryCards({ categories }: PlacementCategoryCardsProps) {
  const sqInfo = getSizeTypeDisplayInfo('SQ');
  const lsInfo = getSizeTypeDisplayInfo('LS');
  const ptInfo = getSizeTypeDisplayInfo('PT');
  const ignoredInfo = getIgnoredDisplayInfo();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* SQ Category */}
      <CategoryCard
        title={sqInfo.label}
        description={sqInfo.description}
        count={categories.SQ.length}
        combinations={categories.SQ}
        colorClass={sqInfo.color}
      />

      {/* LS Category */}
      <CategoryCard
        title={lsInfo.label}
        description={lsInfo.description}
        count={categories.LS.length}
        combinations={categories.LS}
        colorClass={lsInfo.color}
      />

      {/* PT Category */}
      <CategoryCard
        title={ptInfo.label}
        description={ptInfo.description}
        count={categories.PT.length}
        combinations={categories.PT}
        colorClass={ptInfo.color}
      />

      {/* IGNORED Category */}
      <CategoryCard
        title={ignoredInfo.label}
        description={ignoredInfo.description}
        count={categories.IGNORED.length}
        combinations={categories.IGNORED}
        colorClass={ignoredInfo.color}
      />
    </div>
  );
}
