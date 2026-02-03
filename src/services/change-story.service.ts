import * as fs from 'node:fs';
import * as path from 'node:path';
import { AlreadyExistsError, PrerequisiteError } from '../types/errors.js';
import { readConfig } from '../lib/config.js';
import { ensureDir, atomicWrite } from '../lib/fs-utils.js';
import { renderTemplate } from '../lib/template.js';

export interface ChangeStoryOptions {
  name: string;
  description?: string;
  cwd?: string;
}

export interface RelatedModule {
  name: string;
  description: string;
}

export interface ChangeStoryResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: RelatedModule[];
  description?: string;
}

/**
 * Execute the change story workflow:
 *
 * 1. Read config to get knowledge base path
 * 2. Validate change directory does not exist → AlreadyExistsError
 * 3. Match related modules from _index.md keywords
 * 4. Render proposal.md and metadata.yaml templates
 * 5. Write files to .prospec/changes/{name}/
 */
export async function execute(options: ChangeStoryOptions): Promise<ChangeStoryResult> {
  const cwd = options.cwd ?? process.cwd();
  const changeName = options.name;

  // 1. Read config
  const config = await readConfig(cwd);
  const knowledgeBasePath = config.knowledge?.base_path ?? 'docs/ai-knowledge';

  // 2. Validate change directory does not exist
  const changeDir = path.join(cwd, '.prospec', 'changes', changeName);
  if (fs.existsSync(changeDir)) {
    throw new AlreadyExistsError(`.prospec/changes/${changeName}`);
  }

  // 3. Match related modules from _index.md
  const relatedModules = matchRelatedModules(changeName, knowledgeBasePath, cwd);

  // 4. Create change directory
  await ensureDir(changeDir);

  // 5. Render templates
  const templateContext = {
    change_name: changeName,
    description: options.description,
    related_modules: relatedModules.length > 0 ? relatedModules : undefined,
  };

  const createdFiles: string[] = [];

  // proposal.md
  const proposalContent = renderTemplate('change/proposal.md.hbs', templateContext);
  const proposalPath = path.join(changeDir, 'proposal.md');
  await atomicWrite(proposalPath, proposalContent);
  createdFiles.push(`.prospec/changes/${changeName}/proposal.md`);

  // metadata.yaml
  const metadataContent = renderTemplate('change/metadata.yaml.hbs', templateContext);
  const metadataPath = path.join(changeDir, 'metadata.yaml');
  await atomicWrite(metadataPath, metadataContent);
  createdFiles.push(`.prospec/changes/${changeName}/metadata.yaml`);

  return {
    changeName,
    changeDir,
    createdFiles,
    relatedModules,
    description: options.description,
  };
}

/**
 * Match related modules by comparing change name keywords against _index.md.
 *
 * Reads the _index.md Markdown table and matches keywords from module entries
 * against words extracted from the kebab-case change name.
 */
function matchRelatedModules(
  changeName: string,
  knowledgeBasePath: string,
  cwd: string,
): RelatedModule[] {
  const indexPath = path.join(cwd, knowledgeBasePath, '_index.md');

  let indexContent: string;
  try {
    indexContent = fs.readFileSync(indexPath, 'utf-8');
  } catch {
    // No _index.md — return empty (not an error, just no modules to match)
    return [];
  }

  // Extract words from kebab-case change name
  const changeWords = changeName
    .toLowerCase()
    .split('-')
    .filter((w) => w.length > 1);

  if (changeWords.length === 0) return [];

  // Parse _index.md table rows
  // Expected format: | Module | Keywords | Status | Description | Depends On |
  const lines = indexContent.split('\n');
  const modules: RelatedModule[] = [];

  for (const line of lines) {
    // Skip non-table lines and header/separator rows
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    if (line.toLowerCase().includes('| module')) continue;

    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length < 4) continue;

    const moduleName = cells[0] ?? '';
    const keywordsCell = cells[1];
    if (!keywordsCell) continue;
    const keywords = keywordsCell.toLowerCase().split(',').map((k) => k.trim());
    const description = cells[3] ?? '';

    // Check if any change word matches any module keyword
    const isMatch = changeWords.some((word) =>
      keywords.some((keyword) => keyword.includes(word) || word.includes(keyword)),
    );

    if (isMatch) {
      modules.push({ name: moduleName, description });
    }
  }

  return modules;
}
