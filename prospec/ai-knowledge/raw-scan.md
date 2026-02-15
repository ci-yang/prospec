# Raw Scan: prospec

> 此檔案由 `prospec knowledge init` 自動產生，供 `/prospec-knowledge-generate` Skill 分析使用。
> 請勿手動編輯。每次執行 `prospec knowledge init` 時會重新產生。

## Tech Stack

| 項目 | 值 |
|------|-----|
| Language | typescript |
| Framework | — |
| Package Manager | pnpm |

## Entry Points

- `dist/index.js`
- `dist/cli/index.js`
- `src/cli/index.ts`

## Directory Tree

```
docs/
  ai-knowledge/
    modules/
      cli/
      lib/
      services/
      templates/
      tests/
      types/
  specs/
prospec/
  ai-knowledge/
ralph-sdd/
  docs/
  hooks/
    scripts/
  templates/
specs/
  001-prospec-mvp-cli/
    checklists/
    contracts/
src/
  cli/
    commands/
    formatters/
  lib/
  services/
  templates/
    agent-configs/
    change/
    init/
    knowledge/
    skills/
      references/
    steering/
  types/
tests/
  contract/
  e2e/
  integration/
  unit/
    lib/
    services/
```

## Dependencies

- `@commander-js/extra-typings` @ ^14.0.0
- `@inquirer/prompts` @ ^8.2.0
- `commander` @ ^14.0.3
- `fast-glob` @ ^3.3.3
- `handlebars` @ ^4.7.8
- `picocolors` @ ^1.1.1
- `yaml` @ ^2.8.2
- `zod` @ ^4.3.6
- `@eslint/js` @ ^9.39.2
- `@types/node` @ ^25.2.0
- `eslint` @ ^9.39.2
- `memfs` @ ^4.56.10
- `typescript` @ 5.9
- `typescript-eslint` @ ^8.54.0
- `vitest` @ ^4.0.18

## Config Files

- `eslint.config.mjs`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`

## File Stats

| 指標 | 值 |
|------|-----|
| 總檔案數 | 175 |
| 掃描深度 | 10 |
