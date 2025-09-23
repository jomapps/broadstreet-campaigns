import { Suspense } from 'react';
import { redirect } from 'next/navigation';

/**
 * Sales main page - redirects to request creation form
 * Following the established pattern where main pages redirect to primary functionality
 */
export default async function SalesPage() {
  // Redirect to the request creation page as the primary sales functionality
  redirect('/sales/request');
}
