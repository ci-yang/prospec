import { z } from 'zod';

/**
 * ChangeMetadata schema — validates metadata.yaml in change directories
 *
 * State transitions: story → plan → tasks → (verified) → archived
 */

export const CHANGE_STATUSES = ['story', 'plan', 'tasks', 'verified', 'archived'] as const;

export const ChangeMetadataSchema = z.object({
  name: z.string(),
  created_at: z.string(), // ISO 8601
  status: z.enum(CHANGE_STATUSES),
  related_modules: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
