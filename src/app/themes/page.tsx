'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemes } from '@/hooks/useThemes';
import { SearchInput } from '@/components/ui/search-input';
import ThemeCard from '@/components/themes/ThemeCard';
import { UniversalEntityCard } from '@/components/ui/universal-entity-card';
import ThemeCreateModal from '@/components/themes/ThemeCreateModal';

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-lg"></div>
      ))}
    </div>
  );
}

export default function ThemesPage() {
  const { themes, isLoading, error, createTheme, updateTheme, deleteTheme, cloneTheme } = useThemes();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredThemes = useMemo(() => {
    if (!searchTerm.trim()) return themes;
    
    const search = searchTerm.toLowerCase();
    return themes.filter(theme => 
      theme.name.toLowerCase().includes(search) ||
      theme.description?.toLowerCase().includes(search)
    );
  }, [themes, searchTerm]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Themes</h1>
            <p className="text-gray-600 mt-1">
              Group zones together for easier campaign management
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Themes</h1>
          <p className="text-gray-600 mt-1">
            Group zones together for easier campaign management
          </p>
        </div>
        
        <ThemeCreateModal onCreateTheme={createTheme} />
      </div>

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

      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredThemes.length === 0 ? (
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
                onCreateTheme={createTheme}
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
                { label: 'Zones', value: theme.zone_count, type: 'number' as const },
                { label: 'Created', value: new Date(theme.createdAt), type: 'date' as const },
                { label: 'Updated', value: new Date(theme.updatedAt), type: 'date' as const },
              ]}
              actionButtons={[
                { label: 'View Zones', onClick: () => router.push(`/themes/${theme._id}`), variant: 'default' },
                { label: 'Edit', onClick: () => updateTheme?.(theme._id, theme.name, theme.description), variant: 'outline' },
                { label: 'Clone', onClick: () => cloneTheme?.(theme._id, `${theme.name} (Copy)`), variant: 'secondary' },
              ]}
              onCardClick={() => router.push(`/themes/${theme._id}`)}
              onDelete={deleteTheme ? () => deleteTheme(theme._id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
