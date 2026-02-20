import { createClient } from '@/lib/supabase/server';
import { getPreferences, updatePreferences } from '@/app/actions/preferences';
import SettingsForm from './SettingsForm';

export const metadata = {
  title: 'Settings — Feed Prism',
  description: 'Customize your news preferences.',
};

const ALL_CATEGORIES = [
  'Technology',
  'AI & ML',
  'Global News',
  'Outbreaks & Health',
  'Company News',
  'Cloud & Infrastructure',
  'Developer & Engineering',
  'Startups',
  'Security',
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const preferences = await getPreferences();

  // Get all sources for selection
  const { data: sources } = await supabase
    .from('sources')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category')
    .order('name');

  return (
    <SettingsForm
      categories={ALL_CATEGORIES}
      sources={sources || []}
      preferences={preferences}
      updatePreferences={updatePreferences}
    />
  );
}
