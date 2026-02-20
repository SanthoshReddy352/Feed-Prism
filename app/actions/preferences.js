'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Get user preferences
 */
export async function getPreferences() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data || {
    preferred_categories: [],
    preferred_sources: [],
    view_mode: 'detailed',
  };
}

/**
 * Update user preferences
 */
export async function updatePreferences(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const categories = formData.getAll('categories');
  const sources = formData.getAll('sources');
  const viewMode = formData.get('view_mode') || 'detailed';

  const preferences = {
    user_id: user.id,
    preferred_categories: categories,
    preferred_sources: sources,
    view_mode: viewMode,
  };

  // Upsert preferences
  const { error } = await supabase
    .from('user_preferences')
    .upsert(preferences, { onConflict: 'user_id' });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  return { success: true };
}
