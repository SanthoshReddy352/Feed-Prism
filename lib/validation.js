import { z } from 'zod';

/**
 * Zod validation schemas for all API inputs
 */

// Articles query params
export const articlesQuerySchema = z.object({
  category: z.string().optional(),
  source: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().max(200).optional(),
});

// Bookmark body
export const bookmarkSchema = z.object({
  article_id: z.string().uuid(),
});

// Preferences body
export const preferencesSchema = z.object({
  preferred_categories: z.array(z.string()).default([]),
  preferred_sources: z.array(z.string().uuid()).default([]),
  view_mode: z.enum(['compact', 'detailed']).default('detailed'),
});

// Search query params
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  source: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
