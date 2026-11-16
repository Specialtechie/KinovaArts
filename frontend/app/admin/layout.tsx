import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/admin';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Kinova Admin' }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell name={user.name}>{children}</AdminShell>;
}
