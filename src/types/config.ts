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
  'readme', 'endpoints', 'components', 'screens',
] as const;

/**
 * Knowledge module partitioning strategies.
 *
 * - auto: AI determines best strategy based on project structure
 * - architecture: Split by src/ top-level directories (CLI tools, libs)
 * - domain: Split by business domain (frontend/backend apps)
 * - package: Split by workspace packages (monorepos)
 */
export const KNOWLEDGE_STRATEGIES = ['auto', 'architecture', 'domain', 'package'] as const;
export type KnowledgeStrategy = typeof KNOWLEDGE_STRATEGIES[number];

const TokenBudgetSchema = z.object({
  l0_max: z.number().optional(),
  l1_per_module: z.number().optional(),
  readme_max_lines: z.number().optional(),
}).optional();

export type TokenBudget = z.infer<typeof TokenBudgetSchema>;

const KnowledgeSchema = z.object({
  base_path: z.string().optional(),
  files: z.array(z.string()).optional(),
  strategy: z.enum(KNOWLEDGE_STRATEGIES).optional(),
  token_budget: TokenBudgetSchema,
}).optional();

export const DEFAULT_BASE_DIR = 'prospec';

export const VALID_AGENTS = ['claude', 'gemini', 'copilot', 'codex'] as const;

export const ProspecConfigSchema = z
  .object({
    version: z.string().optional(),
    project: z.object({
      name: z.string({ error: 'project.name 為必填欄位' }),
      version: z.string().optional(),
    }),
    tech_stack: TechStackSchema,
    paths: z.object({
      base_dir: z.string().optional(),
    }).catchall(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    agents: z.array(z.enum(VALID_AGENTS)).optional(),
    knowledge: KnowledgeSchema,
  })
  .passthrough();

export type ProspecConfig = z.infer<typeof ProspecConfigSchema>;
export type TechStack = z.infer<typeof TechStackSchema>;
