/**
 * AUDIT CLIENT - ZUSTAND INTEGRATION
 * 
 * Client component that initializes Zustand stores with server data
 * and renders the audit content. Follows the server-client pattern
 * established in Phase 2 and Phase 3.
 * All variable names follow docs/variable-origins.md registry.
 */

'use client';

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
  // Pass audit data directly to content component (no store needed for audit)
  return <AuditContent initialData={initialAuditData} searchParams={searchParams} />;
}
