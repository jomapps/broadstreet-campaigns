'use client';

import RequestForm from './RequestForm';

interface RequestClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * Request Client Component
 * Simple wrapper for the RequestForm
 */
export default function RequestClient({ searchParams }: RequestClientProps) {
  return (
    <div className="space-y-6">
      <RequestForm />
    </div>
  );
}