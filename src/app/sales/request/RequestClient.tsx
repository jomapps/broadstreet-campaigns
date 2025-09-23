'use client';

import { useState } from 'react';
import RequestForm from './RequestForm';
import { useRouter } from 'next/navigation';

interface RequestClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Request Client Component
 * Handles client-side state and navigation for request creation
 */
export default function RequestClient({ searchParams }: RequestClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCreated = (requestId: string) => {
    // Navigate to the open list with a success message
    router.push(`/sales/open-list?created=${requestId}`);
  };

  const handleCancel = () => {
    // Navigate back to sales dashboard or open list
    router.push('/sales/open-list');
  };

  return (
    <div className="space-y-6">
      <RequestForm
        onSubmit={handleRequestCreated}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </div>
  );
}
