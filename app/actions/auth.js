'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const ALLOWED_OAUTH_REDIRECTS = new Set([
  'com.feedprism.app://auth/callback',
]);

export async function login(formData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signup(formData) {
  const supabase = await createClient();

  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const origin = headerList.get('origin') || `${protocol}://${host}`;

  const { error } = await supabase.auth.signUp({
    email: formData.get('email'),
    password: password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Check your email to confirm your account.' };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

function resolveGoogleRedirect(origin, redirectToOverride) {
  const defaultRedirect = `${origin}/auth/callback`;
  if (!redirectToOverride) return defaultRedirect;
  return ALLOWED_OAUTH_REDIRECTS.has(redirectToOverride)
    ? redirectToOverride
    : defaultRedirect;
}

export async function loginWithGoogle(redirectToOverride) {
  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const origin = headerList.get('origin') || `${protocol}://${host}`;
  const redirectTo = resolveGoogleRedirect(origin, redirectToOverride);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
