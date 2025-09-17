'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Copy, Check, X } from 'lucide-react';
import Link from 'next/link';

interface Theme {
  _id: string;
  mongo_id: string;
  name: string;
  description?: string;
  zone_ids: number[];
  zone_count: number;
  createdAt: string;
  updatedAt: string;
}

interface ThemeCardProps {
  theme: Theme;
  onEdit?: (themeId: string, newName: string, newDescription?: string) => Promise<void>;
  onDelete?: (themeId: string) => Promise<void>;
  onClone?: (themeId: string, newName: string) => Promise<void>;
}

export default function ThemeCard({ theme, onEdit, onDelete, onClone }: ThemeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(theme.name);
  const [editDescription, setEditDescription] = useState(theme.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    if (!onEdit) return;
    
    setIsLoading(true);
    try {
      await onEdit(theme._id, editName.trim(), editDescription.trim() || undefined);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing theme:', error);
      // Reset to original values on error
      setEditName(theme.name);
      setEditDescription(theme.description || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditName(theme.name);
    setEditDescription(theme.description || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm(`Are you sure you want to delete "${theme.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onDelete(theme._id);
    } catch (error) {
      console.error('Error deleting theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = async () => {
    if (!onClone) return;
    
    const newName = prompt(`Enter name for cloned theme:`, `${theme.name} (Copy)`);
    if (!newName || newName.trim() === '') return;
    
    setIsLoading(true);
    try {
      await onClone(theme._id, newName.trim());
    } catch (error) {
      console.error('Error cloning theme:', error);
      alert('Failed to clone theme. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md border-2 border-gray-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Theme name"
                  className="font-semibold"
                  disabled={isLoading}
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="text-sm"
                  disabled={isLoading}
                />
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={isLoading || !editName.trim()}
                    className="h-7"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="h-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  <Link 
                    href={`/themes/${theme._id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {theme.name}
                  </Link>
                </CardTitle>
                {theme.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {theme.description}
                  </p>
                )}
              </>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex items-center space-x-1 ml-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onClone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClone}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {theme.zone_count} {theme.zone_count === 1 ? 'zone' : 'zones'}
          </Badge>
          
          <div className="text-xs text-gray-500">
            Created {new Date(theme.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
