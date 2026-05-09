'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Get the current user's active API key
 */
export async function getApiKey() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, api_key, name, status, created_at, last_used_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Generate a new API key for the current user.
 * Revokes any existing active key before creating a new one.
 */
export async function generateApiKey(name = 'Default Project Key') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Revoke all existing active keys for this user
  await supabase
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Generate a new key: fp_live_ prefix + UUID for easy identification
  const newKey = `fp_live_${randomUUID().replace(/-/g, '')}`;

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      api_key: newKey,
      name: name || 'Default Project Key',
      status: 'active',
    })
    .select('id, api_key, name, status, created_at')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/developers');
  return { data };
}

/**
 * Revoke an API key by its ID
 */
export async function revokeApiKey(keyId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('id', keyId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/developers');
  return { success: true };
}
