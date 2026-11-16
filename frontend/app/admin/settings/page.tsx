import type { Metadata } from 'next';
import SettingsForm from '@/components/admin/SettingsForm';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsAdmin() {
  const settings = await adminGet('/settings', '/admin/settings');

  return (
    <div className="max-w-xl">
      <PageTitle title="Settings" />
      <SettingsForm rate={Number(settings.usd_to_ngn_rate)} />
    </div>
  );
}
