'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Toggle bookmark for an article
 */
export async function toggleBookmark(articleId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('article_id', articleId)
    .single();

  if (existing) {
    // Remove bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existing.id);

    if (error) return { error: error.message };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookmarks');
    return { bookmarked: false };
  } else {
    // Add bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, article_id: articleId });

    if (error) return { error: error.message };
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookmarks');
    return { bookmarked: true };
  }
}

/**
 * Get bookmark status for multiple articles
 */
export async function getBookmarkedArticleIds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('bookmarks')
    .select('article_id')
    .eq('user_id', user.id);

  return (data || []).map((b) => b.article_id);
}
