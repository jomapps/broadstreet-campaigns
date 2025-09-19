/**
 * THEMES CONTENT - MAIN THEMES UI
 * 
 * Main themes content component that displays themes grid and handles interactions.
 * Reads data from Zustand stores and provides theme management functionality.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityStore } from '@/stores';
import { SearchInput } from '@/components/ui/search-input';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import ThemeCreateModal from '@/components/themes/ThemeCreateModal';
import { useCreateTheme } from './useCreateTheme';

/**
 * ThemesList - Main themes display component
 * Variable names follow docs/variable-origins.md registry
 */
function ThemesList() {
  // Get data from Zustand stores using exact names from docs/variable-origins.md registry
  const { themes, isLoading } = useEntityStore();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Use custom hook for theme creation
  const { createTheme: handleCreateTheme } = useCreateTheme({ postCreateBehavior: 'refresh' });

  // Filter themes based on search term
  const filteredThemes = useMemo(() => {
    if (!searchTerm.trim()) return themes;

    const search = searchTerm.toLowerCase();
    return themes.filter(theme =>
      theme.name.toLowerCase().includes(search) ||
      theme.description?.toLowerCase().includes(search)
    );
  }, [themes, searchTerm]);


  // Handle theme editing
  const handleEditTheme = async (theme: any) => {
    const newName = prompt('Enter new theme name:', theme.name);
    if (!newName || newName.trim() === '' || newName.trim() === theme.name) return;

    const newDescription = prompt('Enter new description (optional):', theme.description || '');

    try {
      const response = await fetch(`/api/themes/${theme._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update theme');
      }

      // Refresh the page to show the updated theme
      router.refresh();
    } catch (error) {
      console.error('Error updating theme:', error);
      alert('Failed to update theme. Please try again.');
    }
  };

  // Handle theme cloning
  const handleCloneTheme = async (theme: any) => {
    const newName = prompt('Enter name for cloned theme:', `${theme.name} (Copy)`);
    if (!newName || newName.trim() === '') return;

    try {
      const response = await fetch(`/api/themes/${theme._id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone theme');
      }

      // Refresh the page to show the cloned theme
      router.refresh();
    } catch (error) {
      console.error('Error cloning theme:', error);
      alert('Failed to clone theme. Please try again.');
    }
  };

  // Handle theme deletion
  const handleDeleteTheme = async (themeId: string) => {
    const confirmed = confirm('Are you sure you want to delete this theme? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete theme');
      }

      // Refresh the page to remove the deleted theme
      router.refresh();
    } catch (error) {
      console.error('Error deleting theme:', error);
      alert('Failed to delete theme. Please try again.');
    }
  };

  if (isLoading.themes) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="max-w-md flex-1">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="max-w-md flex-1">
          <SearchInput
            placeholder="Search themes..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        
        {themes.length > 0 && (
          <div className="text-sm text-gray-500">
            {filteredThemes.length} of {themes.length} themes
          </div>
        )}
      </div>

      {filteredThemes.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm.trim() ? (
            <>
              <p className="text-gray-500 mb-4">No themes match your search.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">
                No themes yet. Create your first theme to get started.
              </p>
              <ThemeCreateModal 
                onCreateTheme={handleCreateTheme}
                trigger={
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                    Create Your First Theme
                  </button>
                }
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <UniversalEntityCard
              key={theme._id}
              title={theme.name}
              mongo_id={theme.mongo_id}
              entityType="theme"
              subtitle={theme.description}
              displayData={[
                { label: 'Zones', value: theme.zone_count ?? 0, type: 'number' as const },
                { label: 'Created', value: new Date(theme.createdAt), type: 'date' as const },
                { label: 'Updated', value: new Date(theme.updatedAt), type: 'date' as const },
              ]}
              actionButtons={[
                { label: 'View Zones', onClick: () => router.push(`/themes/${theme._id}`), variant: 'default' },
                { label: 'Edit', onClick: () => handleEditTheme(theme), variant: 'outline' },
                { label: 'Clone', onClick: () => handleCloneTheme(theme), variant: 'secondary' },
              ]}
              onCardClick={() => router.push(`/themes/${theme._id}`)}
              onDelete={() => handleDeleteTheme(theme._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ThemesContent - Main themes content component
 * Variable names follow docs/variable-origins.md registry
 */
export default function ThemesContent() {
  const { themes } = useEntityStore();

  // Use custom hook for theme creation
  const { createTheme: handleCreateTheme } = useCreateTheme({ postCreateBehavior: 'reload' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ThemeCreateModal onCreateTheme={handleCreateTheme} />
      </div>
      
      <ThemesList />
    </div>
  );
}
