# Contributing to Prospec

Thank you for considering contributing to Prospec! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/prospec.git
cd prospec

# Install dependencies
npm install

# Build
npm run build

# Link globally for local testing
npm link
```

## Development Workflow

```bash
# Watch mode (recompile on change)
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck

# Lint
npm run lint
```

## Project Structure

```
src/
├── cli/          — Commander.js commands + formatters
├── services/     — Business logic (one service per command)
├── lib/          — Pure utility functions
├── types/        — Zod schemas + TypeScript types
└── templates/    — Handlebars templates (.hbs)

tests/
├── unit/         — Unit tests (lib + services)
├── contract/     — Contract tests (CLI output + Skill format)
├── integration/  — Integration tests (multi-service flows)
└── e2e/          — End-to-end tests (real CLI process)
```

## Coding Standards

- **Language**: TypeScript strict mode, no `any`
- **Style**: Follow ESLint + Prettier configuration
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Imports**: Use `.js` extension for relative imports (ESM)
- **Error handling**: Use custom error classes from `src/types/errors.ts`
- **Testing**: Every new service/feature requires tests

## Making Changes

### 1. Create a branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Use Prospec's own SDD workflow

Prospec uses itself for development! Use the Skills:

```bash
# Describe your change
/prospec-new-story your-feature

# Generate implementation plan
/prospec-plan

# Break down tasks
/prospec-tasks

# Implement
/prospec-implement

# Verify
/prospec-verify
```

### 3. Write tests

- Unit tests for new services/utilities
- Contract tests if adding new Skills or CLI output formats
- E2E tests for new CLI commands

### 4. Commit

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new feature
fix(scope): fix specific bug
docs: update documentation
test: add or update tests
refactor(scope): restructure code
chore: dependency updates, config changes
```

### 5. Submit a Pull Request

- Write a clear description of what changed and why
- Reference any related issues
- Ensure all tests pass

## Adding a New Skill

1. Add skill definition to `src/types/skill.ts` (SKILL_DEFINITIONS array)
2. Create template at `src/templates/skills/your-skill-name.hbs`
3. If the skill needs references, create `src/templates/skills/references/your-ref.hbs`
4. Update contract tests in `tests/contract/skill-format.test.ts`
5. Run `prospec agent sync` to generate the new Skill files

## Adding a New CLI Command

1. Create service at `src/services/your-command.service.ts`
2. Create command at `src/cli/commands/your-command.ts`
3. Create formatter at `src/cli/formatters/your-command-output.ts`
4. Register in `src/cli/index.ts`
5. Add unit tests for the service
6. Add E2E tests in `tests/e2e/cli.test.ts`

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include steps to reproduce for bugs
- Include your Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
