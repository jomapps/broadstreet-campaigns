'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EntityIdBadge } from '@/components/ui/entity-id-badge';
import { cardStateClasses } from '@/lib/ui/cardStateClasses';
import { cn } from '@/lib/utils';
import { 
  Globe, Users, Image as ImageIcon, Calendar, Target, Folder, 
  Trash2, Copy, Check, X 
} from 'lucide-react';
import Link from 'next/link';

// Type definitions
interface TagConfig {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BadgeConfig {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }>;
}

interface DisplayDataItem {
  label?: string;
  value: string | number | Date | React.ReactNode;
  type?: 'string' | 'number' | 'date' | 'badge' | 'progress' | 'custom';
  format?: string;
  className?: string;
  ariaLabel?: string;
}

interface ActionButtonConfig {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  loading?: boolean;
}

// Auto-fit text to container by adjusting font size between bounds
function AutoFitText({
  text,
  className,
  minFontSize = 10,
  maxFontSize = 14
}: {
  text: string | number;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const textRef = React.useRef<HTMLSpanElement | null>(null);
  const [fontSize, setFontSize] = React.useState<number>(maxFontSize);

  const fit = React.useCallback(() => {
    const container = containerRef.current;
    const span = textRef.current;
    if (!container || !span) return;

    // Start optimistic: use max, then shrink as needed
    let current = maxFontSize;
    span.style.fontSize = `${current}px`;

    // If it overflows, shrink until it fits or reach min
    // Limit iterations to avoid long loops
    let safety = 16;
    while (safety-- > 0 && current > minFontSize && span.scrollWidth > container.clientWidth) {
      current -= 1;
      span.style.fontSize = `${current}px`;
    }
    setFontSize(current);
  }, [maxFontSize, minFontSize]);

  React.useEffect(() => {
    fit();
  }, [text, fit]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(container);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <span ref={textRef} style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }} className="block truncate">
        {String(text)}
      </span>
    </div>
  );
}

interface ParentCrumb {
  name: string;
  broadstreet_id?: number;
  mongo_id?: string;
}

interface UniversalEntityCardProps {
  // === REQUIRED PROPS ===
  title: string;
  
  // === IDENTIFICATION ===
  broadstreet_id?: number;
  mongo_id?: string;
  entityType?: 'network' | 'advertiser' | 'advertisement' | 'campaign' | 'placement' | 'zone' | 'theme';
  
  // === VISUAL CONTENT ===
  imageUrl?: string;
  imageFallback?: string;
  subtitle?: string;
  description?: string;
  
  // === NAVIGATION ===
  titleUrl?: string;
  onCardClick?: () => void;
  
  // === STATE MANAGEMENT ===
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  showCheckbox?: boolean;
  
  // === ENTITY STATUS ===
  isLocal?: boolean;
  isActive?: boolean;
  
  // === TAGS AND BADGES ===
  topTags?: TagConfig[];
  bottomTags?: TagConfig[];
  statusBadge?: BadgeConfig;
  
  // === DYNAMIC DATA DISPLAY ===
  displayData?: DisplayDataItem[];
  parentsBreadcrumb?: ParentCrumb[]; // New: parent path, rendered under title
  
  // === ACTIONS ===
  actionButtons?: ActionButtonConfig[];
  onDelete?: () => void;
  onCopyToTheme?: (themeName: string, description?: string) => Promise<void>;
  
  // === STYLING ===
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  
  // === ACCESSIBILITY ===
  ariaLabel?: string;
  testId?: string;
}

// Entity type icons
const entityIcons = {
  network: Globe,
  advertiser: Users,
  advertisement: ImageIcon,
  campaign: Calendar,
  placement: Target,
  zone: Target,
  theme: Folder
};

// Helper function to check if element is interactive
const isInteractiveElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof HTMLElement)) return false;
  
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  const interactiveRoles = ['button', 'link', 'checkbox'];
  
  return interactiveTags.includes(element.tagName) ||
         interactiveRoles.includes(element.getAttribute('role') || '') ||
         element.closest('button, a, input, select, textarea') !== null;
};

// Format display data value
const formatDisplayValue = (item: DisplayDataItem): React.ReactNode => {
  const { value, type, format } = item;

  // Helper: format a Date as dd/mm/yy
  const formatAsDdMmYy = (d: Date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);

  // Helper: try to coerce strings/numbers into Date if sensible
  const coerceToDate = (val: unknown): Date | null => {
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val === 'string') {
      // ISO-like 2024-01-10 or 2024-01-10T...
      if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(val)) {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }
      // dd/mm/yy or dd/mm/yyyy – already formatted or parseable
      const ddMmYy = val.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
      if (ddMmYy) {
        const [_, dd, mm, yy] = ddMmYy;
        const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
        const d = new Date(year, Number(mm) - 1, Number(dd));
        return isNaN(d.getTime()) ? null : d;
      }
      // Fallback generic parse (avoid mis-parsing short strings)
      if (val.length >= 8) {
        const parsed = Date.parse(val);
        if (!isNaN(parsed)) return new Date(parsed);
      }
    }
    return null;
  };

  // Dates: use dd/mm/yy format universally for display data area
  if (type === 'date') {
    const d = coerceToDate(value);
    if (d) return formatAsDdMmYy(d);
  }

  if (type === 'number' && typeof value === 'number') {
    // Currency formatting (EUR)
    if (format && /currency|eur|€/i.test(format)) {
      try {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
      } catch {
        return `€${value.toLocaleString()}`;
      }
    }
    return format ? value.toLocaleString() : value.toString();
  }

  if (type === 'badge' && typeof value === 'string') {
    return <Badge variant="outline" className="text-xs">{value.replace(/\$/g, '€')}</Badge>;
  }

  if (type === 'progress' && typeof value === 'number') {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{value}%</span>
      </div>
    );
  }

  // Handle Date objects or date-like strings that aren't explicitly typed as 'date'
  {
    const d = coerceToDate(value);
    if (d) return formatAsDdMmYy(d);
  }

  // Replace dollar signs with Euro for string values
  if (typeof value === 'string') {
    return value.replace(/\$/g, '€');
  }

  return value;
};

export function UniversalEntityCard({
  title,
  broadstreet_id,
  mongo_id,
  entityType,
  imageUrl,
  imageFallback,
  subtitle,
  description,
  titleUrl,
  onCardClick,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  isLocal = false,
  isActive,
  topTags = [],
  bottomTags = [],
  statusBadge,
  displayData = [],
  parentsBreadcrumb = [],
  actionButtons = [],
  onDelete,
  onCopyToTheme,
  className,
  variant = 'default',
  ariaLabel,
  testId
}: UniversalEntityCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [expandedDescription, setExpandedDescription] = React.useState(false);
  
  // Generate card classes
  const cardClasses = cardStateClasses({ 
    isLocal: !!isLocal, 
    isSelected: !!isSelected 
  });
  
  // Handle card click
  const handleCardClick = (e: React.MouseEvent) => {
    if (isInteractiveElement(e.target)) return;
    
    if (onCardClick) {
      onCardClick();
    } else if (onSelect) {
      onSelect(!isSelected);
    }
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };
  
  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };
  
  // Get entity icon (kept for potential future use, not rendered without image)
  const EntityIcon = entityType ? entityIcons[entityType] : null;
  
  // Generate fallback text (not rendered when no image)
  const fallbackText = imageFallback || title.charAt(0).toUpperCase();
  const hasImage = !!(imageUrl && !imageError);
  
  return (
    <Card
      className={cn(
        'h-full transition-all duration-200 cursor-pointer border-2',
        cardClasses,
        // Tighten header-to-content gap when no image
        !hasImage && 'gap-1',
        variant === 'compact' && 'p-4',
        variant === 'detailed' && 'p-8',
        className
      )}
      onClick={handleCardClick}
      aria-label={ariaLabel || `${title} card`}
      data-testid={testId}
    >
      {/* Header Row */}
      <CardHeader className={cn(hasImage ? "pb-3" : "pb-0") }>
        <div className="flex items-center justify-between">
          {/* Left: Checkbox + ID Badges */}
          <div className="flex items-center gap-2">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${title}`}
              />
            )}
            <EntityIdBadge 
              broadstreet_id={broadstreet_id}
              mongo_id={mongo_id}
            />
          </div>

          {/* Right: Local badge + Delete */}
          <div className="flex items-center gap-2">
            {isLocal && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                LOCAL
              </Badge>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDeleteClick}
                aria-label={`Delete ${title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Section - collapse fully when no image or on error */}
        {imageUrl && !imageError && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt={`${title} image`}
              className="w-full max-w-[300px] h-auto max-h-[200px] object-cover rounded-lg border"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        {/* Top Tags (merge status badge here, remove separate status row) */}
        {(topTags.length > 0 || statusBadge) && (
          <div className="flex flex-wrap gap-1">
            {statusBadge && (
              <Badge variant={statusBadge.variant === 'success' || statusBadge.variant === 'warning' ? 'default' : statusBadge.variant || 'default'} className="text-xs">
                {statusBadge.icon && <statusBadge.icon className="h-3 w-3 mr-1" />}
                {statusBadge.label}
              </Badge>
            )}
            {topTags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant={tag.variant || 'secondary'} className="text-xs">
                {tag.icon && <tag.icon className="h-3 w-3 mr-1" />}
                {tag.label}
              </Badge>
            ))}
            {topTags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{topTags.length - 5}
              </Badge>
            )}
          </div>
        )}
        
        {/* Title Section */}
        <div>
          {titleUrl ? (
            <Link 
              href={titleUrl} 
              className="font-semibold text-lg hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {title}
            </Link>
          ) : (
            <h3 className="font-semibold text-lg truncate">{title}</h3>
          )}
        </div>

        {/* Parents Breadcrumb */}
        {parentsBreadcrumb.length > 0 && (
          <div className="text-[11px] text-gray-600">
            {parentsBreadcrumb.map((p, idx) => {
              const idText = typeof p.broadstreet_id === 'number'
                ? String(p.broadstreet_id)
                : (p.mongo_id ? (p.mongo_id.length > 8 ? `…${p.mongo_id.slice(-8)}` : p.mongo_id) : '');
              const name = p.name.length > 10 ? `${p.name.slice(0, 10)}…` : p.name;
              return (
                <span key={idx} className="whitespace-nowrap">
                  {name}{idText ? ` (${idText})` : ''}
                  {idx < parentsBreadcrumb.length - 1 && <span className="mx-1">&gt;</span>}
                </span>
              );
            })}
          </div>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-600 truncate">{subtitle}</p>
        )}
        
        {/* (ID badges moved to header left next to checkbox) */}
        
        {/* Description - no whitespace when collapsed */}
        {description && (
          <div>
            <p className={cn(
              "text-sm text-gray-700",
              !expandedDescription && "line-clamp-3"
            )}>
              {description}
            </p>
            {description.length > 150 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedDescription(!expandedDescription);
                }}
              >
                {expandedDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
        
        {/* Display Data - 4-column tight mini-cards with bold values */}
        {displayData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {displayData.map((item, index) => {
              const valueNode = formatDisplayValue(item);
              const isPlain = typeof valueNode === 'string' || typeof valueNode === 'number';
              return (
                <div key={index} className="border rounded-md p-2 bg-white">
                  <div className="text-[11px] text-gray-600 truncate">{item.label}</div>
                  {isPlain ? (
                    <AutoFitText
                      text={valueNode as string | number}
                      className={cn("font-semibold text-gray-900", item.className)}
                      minFontSize={10}
                      maxFontSize={14}
                    />
                  ) : (
                    <div className={cn("text-sm font-semibold text-gray-900 truncate", item.className)}>
                      {valueNode}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Action Buttons */}
        {actionButtons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actionButtons.slice(0, 3).map((button, index) => (
              <Button
                key={index}
                variant={button.variant || 'default'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  button.onClick();
                }}
                disabled={button.disabled || button.loading}
                className="text-xs"
              >
                {button.loading ? (
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                ) : (
                  button.icon && <button.icon className="h-3 w-3 mr-1" />
                )}
                {button.label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Bottom Tags */}
        {bottomTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bottomTags.map((tag, index) => (
              <Badge key={index} variant={tag.variant || 'outline'} className="text-xs">
                {tag.icon && <tag.icon className="h-3 w-3 mr-1" />}
                {tag.label}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Copy to Theme Button */}
        {onCopyToTheme && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // This would open a modal or prompt for theme name
              const themeName = prompt('Enter theme name:');
              if (themeName) {
                onCopyToTheme(themeName);
              }
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy to Theme
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default UniversalEntityCard;
