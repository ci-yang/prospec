import { z } from 'zod';

/**
 * CLI output verbosity level.
 */
export type LogLevel = 'quiet' | 'normal' | 'verbose';

/**
 * ProspecConfig schema — validates .prospec.yaml
 *
 * Uses Zod 4 unified `error` parameter for custom messages.
 */

const TechStackSchema = z.object({
  language: z.string().optional(),
  framework: z.string().optional(),
  package_manager: z.string().optional(),
}).optional();

export const KNOWLEDGE_FILE_TYPES = [
  'readme', 'api-surface', 'dependencies', 'patterns',
  'endpoints', 'components', 'screens',
] as const;

const KnowledgeSchema = z.object({
  base_path: z.string().optional(),
  files: z.array(z.string()).optional(),
}).optional();

export const VALID_AGENTS = ['claude', 'gemini', 'copilot', 'codex'] as const;

export const ProspecConfigSchema = z
  .object({
    version: z.string().optional(),
    project: z.object({
      name: z.string({ error: 'project.name 為必填欄位' }),
      version: z.string().optional(),
    }),
    tech_stack: TechStackSchema,
    paths: z.record(z.string(), z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    agents: z.array(z.enum(VALID_AGENTS)).optional(),
    knowledge: KnowledgeSchema,
  })
  .passthrough();

export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;
export type TechStack = z.infer<typeof TechStackSchema>;
