'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreationModal from './CreationModal';

interface CreationButtonProps {
  className?: string;
}

export default function CreationButton({ className = '' }: CreationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  // Determine what type of entity to create based on current page
  const getEntityType = () => {
    if (pathname.includes('/advertisers')) return 'advertiser';
    if (pathname.includes('/campaigns')) return 'campaign';
    if (pathname.includes('/advertisements')) return 'advertisement';
    if (pathname.includes('/zones')) return 'zone';
    if (pathname.includes('/networks')) return 'network';
    return null;
  };

  const entityType = getEntityType();

  // Don't show button if we can't determine entity type
  if (!entityType) {
    return null;
  }

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="lg"
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${className}`}
        aria-label={`Create new ${entityType}`}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <CreationModal
        isOpen={isModalOpen}
        onClose={handleClose}
        entityType={entityType}
      />
    </>
  );
}
