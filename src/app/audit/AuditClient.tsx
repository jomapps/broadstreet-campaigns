/**
 * AUDIT CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the audit content. Follows the server-client pattern
 * established in Phase 2 and Phase 3.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

import { useEffect } from 'react';
import { useEntityStore } from '@/stores';
import AuditContent from './AuditContent';

/**
 * Props interface for AuditClient
 * Variable names follow docs/variable-origins.md registry
 */
interface AuditClientProps {
  initialAuditData: any;
  searchParams: any;
}

/**
 * AuditClient - Initializes Zustand stores and renders audit content
 * Variable names follow docs/variable-origins.md registry
 */
export default function AuditClient({ 
  initialAuditData,
  searchParams 
}: AuditClientProps) {
  // Get store actions using exact names from docs/variable-origins.md registry
  const { setAuditData } = useEntityStore();
  
  // Initialize store with server data on mount
  useEffect(() => {
    // Set audit data using exact variable names from registry
    if (setAuditData) {
      setAuditData(initialAuditData);
    }
  }, [
    initialAuditData,
    setAuditData
  ]);
  
  // Render the audit content component
  // The content will read from Zustand stores instead of props
  return <AuditContent initialData={initialAuditData} searchParams={searchParams} />;
}
