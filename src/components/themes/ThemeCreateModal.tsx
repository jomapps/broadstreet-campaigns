'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface ThemeCreateModalProps {
  onCreateTheme: (name: string, description?: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export default function ThemeCreateModal({ onCreateTheme, trigger }: ThemeCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await onCreateTheme(name.trim(), description.trim() || undefined);
      
      // Reset form and close modal
      setName('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating theme:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Theme
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Create a new theme to group zones together for easier campaign management.
              You can add zones to the theme after creating it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="theme-name">
                Theme Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="theme-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter theme name..."
                disabled={isLoading}
                maxLength={100}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="theme-description">
                Description <span className="text-gray-500">(optional)</span>
              </Label>
              <Textarea
                id="theme-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this theme is for..."
                disabled={isLoading}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Theme'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
