'use client';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Theme {
  _id: string;
  name: string;
  zone_count?: number;
}

interface ThemeBadgeProps {
  theme: Theme;
  className?: string;
  clickable?: boolean;
}

export default function ThemeBadge({ theme, className = '', clickable = true }: ThemeBadgeProps) {
  const badgeContent = (
    <Badge 
      variant="outline" 
      className={`text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors ${className}`}
    >
      {theme.name}
    </Badge>
  );

  if (clickable) {
    return (
      <Link href={`/themes/${theme._id}`} className="inline-block">
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
}

interface ThemeBadgesProps {
  themes: Theme[];
  maxDisplay?: number;
  className?: string;
}

export function ThemeBadges({ themes, maxDisplay = 3, className = '' }: ThemeBadgesProps) {
  if (!themes || themes.length === 0) {
    return null;
  }

  const displayThemes = themes.slice(0, maxDisplay);
  const remainingCount = themes.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayThemes.map((theme) => (
        <ThemeBadge key={theme._id} theme={theme} />
      ))}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-xs bg-gray-50 border-gray-200 text-gray-600"
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
