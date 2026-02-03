import * as fs from 'node:fs';
import * as path from 'node:path';
import { select } from '@inquirer/prompts';
import { PrerequisiteError } from '../types/errors.js';
import { readConfig } from '../lib/config.js';
import { atomicWrite } from '../lib/fs-utils.js';
import { renderTemplate } from '../lib/template.js';
import { parseYaml, stringifyYaml } from '../lib/yaml-utils.js';
import type { ChangeMetadata } from '../types/change.js';

export interface ChangeTasksOptions {
  change?: string;
  quiet?: boolean;
  cwd?: string;
}

export interface ChangeTasksResult {
  changeName: string;
  changeDir: string;
  createdFiles: string[];
  relatedModules: string[];
}

/**
 * Execute the change tasks workflow:
 *
 * 1. Resolve which change to work on (auto-detect / prompt / --change)
 * 2. Read plan.md to validate prerequisite
 * 3. Render tasks.md template
 * 4. Update metadata.yaml status to 'tasks'
 */
export async function execute(options: ChangeTasksOptions): Promise<ChangeTasksResult> {
  const cwd = options.cwd ?? process.cwd();

  // 1. Read config (validates .prospec.yaml exists)
  await readConfig(cwd);

  // 2. Resolve change name
  const changeName = await resolveChange(cwd, options.change, options.quiet);

  const changeDir = path.join(cwd, '.prospec', 'changes', changeName);

  // 3. Validate plan.md exists (prerequisite for tasks)
  const planPath = path.join(changeDir, 'plan.md');
  if (!fs.existsSync(planPath)) {
    throw new PrerequisiteError(
      `plan.md 不存在於 .prospec/changes/${changeName}/`,
      '請先執行 `prospec change plan` 生成實作計劃',
    );
  }

  // 4. Read metadata for related_modules
  const metadataPath = path.join(changeDir, 'metadata.yaml');
  let relatedModules: string[] = [];
  if (fs.existsSync(metadataPath)) {
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = parseYaml<ChangeMetadata>(metadataContent, metadataPath);
    relatedModules = metadata.related_modules ?? [];
  }

  // 5. Build template context
  const templateContext = {
    change_name: changeName,
    related_modules: relatedModules.length > 0
      ? relatedModules.map((name) => ({ name }))
      : undefined,
  };

  const createdFiles: string[] = [];

  // 6. Render tasks.md
  const tasksContent = renderTemplate('change/tasks.md.hbs', templateContext);
  const tasksPath = path.join(changeDir, 'tasks.md');
  await atomicWrite(tasksPath, tasksContent);
  createdFiles.push(`.prospec/changes/${changeName}/tasks.md`);

  // 7. Update metadata.yaml status to 'tasks'
  await updateMetadataStatus(metadataPath);

  return {
    changeName,
    changeDir,
    createdFiles,
    relatedModules,
  };
}

/**
 * Resolve which change to work on.
 *
 * Strategy (per contracts/cli-commands.md):
 * 1. If --change is provided → use it directly
 * 2. Scan .prospec/changes/ directory
 * 3. If 1 change → auto-select
 * 4. If multiple → interactive prompt (or error in --quiet mode)
 * 5. If 0 changes → PrerequisiteError
 */
async function resolveChange(
  cwd: string,
  explicitChange: string | undefined,
  quiet: boolean | undefined,
): Promise<string> {
  if (explicitChange) {
    // Validate the specified change exists
    const changeDir = path.join(cwd, '.prospec', 'changes', explicitChange);
    if (!fs.existsSync(changeDir)) {
      throw new PrerequisiteError(
        `找不到變更 '${explicitChange}'`,
        '請確認變更名稱正確，或執行 `prospec change story` 建立新的變更',
      );
    }
    return explicitChange;
  }

  const changesDir = path.join(cwd, '.prospec', 'changes');
  if (!fs.existsSync(changesDir)) {
    throw new PrerequisiteError(
      '找不到任何變更',
      '請先執行 `prospec change story <name>` 建立變更需求',
    );
  }

  const entries = fs.readdirSync(changesDir, { withFileTypes: true });
  const changeNames = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  if (changeNames.length === 0) {
    throw new PrerequisiteError(
      '找不到任何變更',
      '請先執行 `prospec change story <name>` 建立變更需求',
    );
  }

  if (changeNames.length === 1) {
    return changeNames[0]!;
  }

  // Multiple changes found
  if (quiet) {
    throw new PrerequisiteError(
      `找到多個變更：${changeNames.join(', ')}`,
      '請使用 `--change <name>` 指定要使用的變更',
    );
  }

  // Interactive prompt
  const selected = await select({
    message: '請選擇要生成任務清單的變更：',
    choices: changeNames.map((name) => ({ name, value: name })),
  });

  return selected;
}

/**
 * Update metadata.yaml status to 'tasks'.
 * Preserves existing fields and comments where possible.
 */
async function updateMetadataStatus(
  metadataPath: string,
): Promise<void> {
  if (!fs.existsSync(metadataPath)) return;

  const content = fs.readFileSync(metadataPath, 'utf-8');
  const metadata = parseYaml<ChangeMetadata>(content, metadataPath);
  metadata.status = 'tasks';
  const updated = stringifyYaml(metadata);
  await atomicWrite(metadataPath, updated);
}
