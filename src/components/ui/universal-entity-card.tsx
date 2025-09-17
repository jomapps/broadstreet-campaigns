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

  if (type === 'date' && value instanceof Date) {
    return format ? value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : value.toLocaleDateString();
  }

  if (type === 'number' && typeof value === 'number') {
    return format ? value.toLocaleString() : value.toString();
  }

  if (type === 'badge' && typeof value === 'string') {
    return <Badge variant="outline" className="text-xs">{value}</Badge>;
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

  // Handle Date objects that aren't explicitly typed as 'date'
  if (value instanceof Date) {
    return value.toLocaleDateString();
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
  
  // Get entity icon
  const EntityIcon = entityType ? entityIcons[entityType] : null;
  
  // Generate fallback text
  const fallbackText = imageFallback || title.charAt(0).toUpperCase();
  
  return (
    <Card
      className={cn(
        'h-full transition-all duration-200 cursor-pointer border-2',
        cardClasses,
        variant === 'compact' && 'p-4',
        variant === 'detailed' && 'p-8',
        className
      )}
      onClick={handleCardClick}
      aria-label={ariaLabel || `${title} card`}
      data-testid={testId}
    >
      {/* Header Row */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {/* Local Badge */}
            {isLocal && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                LOCAL
              </Badge>
            )}
            
            {/* Selection Checkbox */}
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${title}`}
              />
            )}
          </div>
          
          {/* Delete Button */}
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
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Section */}
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
        
        {/* Image Fallback */}
        {(imageError || (!imageUrl && entityType)) && (
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              {EntityIcon ? (
                <EntityIcon className="h-8 w-8 text-primary-foreground" />
              ) : (
                <span className="text-primary-foreground font-bold text-xl">{fallbackText}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-600 truncate">{subtitle}</p>
        )}
        
        {/* ID Badges */}
        <EntityIdBadge 
          broadstreet_id={broadstreet_id}
          mongo_id={mongo_id}
        />
        
        {/* Status Badge */}
        {statusBadge && (
          <Badge variant={statusBadge.variant === 'success' || statusBadge.variant === 'warning' ? 'default' : statusBadge.variant || 'default'}>
            {statusBadge.icon && <statusBadge.icon className="h-3 w-3 mr-1" />}
            {statusBadge.label}
          </Badge>
        )}
        
        {/* Description */}
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
        
        {/* Display Data */}
        {displayData.length > 0 && (
          <div className="space-y-2">
            {displayData.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                {item.label && (
                  <span className="text-gray-600 font-medium">{item.label}:</span>
                )}
                <span className={cn("text-gray-900", item.className)}>
                  {formatDisplayValue(item)}
                </span>
              </div>
            ))}
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
