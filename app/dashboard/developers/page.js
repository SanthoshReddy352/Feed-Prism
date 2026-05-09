import { createClient } from '@/lib/supabase/server';
import { getApiKey } from '@/app/actions/apikeys';
import ApiBuilder from './ApiBuilder';

export const metadata = {
  title: 'Developer Portal — Feed Prism',
  description: 'Generate API keys and build custom news feeds with the Feed Prism public API.',
};

export default async function DevelopersPage() {
  const supabase = await createClient();

  // Fetch the user's existing API key
  const existingKey = await getApiKey();

  // Fetch available sources for the selector
  const { data: sources } = await supabase
    .from('sources')
    .select('id, name, category')
    .eq('is_active', true)
    .order('category')
    .order('name');

  return (
    <ApiBuilder
      initialApiKey={existingKey}
      sources={sources || []}
    />
  );
}
