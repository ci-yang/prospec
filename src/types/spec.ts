import { z } from 'zod';

/**
 * Spec frontmatter schemas — validates Feature Spec and Product Spec YAML frontmatter
 *
 * Feature Spec: specs/features/{name}.md
 * Product Spec: specs/product.md
 */

export const FEATURE_SPEC_STATUSES = ['active', 'deprecated'] as const;

export const FeatureSpecFrontmatterSchema = z.object({
  feature: z.string(),
  status: z.enum(FEATURE_SPEC_STATUSES),
  last_updated: z.string(), // YYYY-MM-DD
  story_count: z.number().int().nonnegative(),
  req_count: z.number().int().nonnegative(),
});

export type FeatureSpecFrontmatter = z.infer<typeof FeatureSpecFrontmatterSchema>;
export type FeatureSpecStatus = (typeof FEATURE_SPEC_STATUSES)[number];

export const ProductSpecFrontmatterSchema = z.object({
  product: z.string(),
  version: z.string().optional(),
  last_updated: z.string(), // YYYY-MM-DD
});

export type ProductSpecFrontmatter = z.infer<typeof ProductSpecFrontmatterSchema>;
