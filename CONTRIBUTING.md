# Contributing to Portfolio Admin

Thanks for your interest in contributing! This document describes the Git workflow, coding standards, and the CI checks your changes must pass.

## Prerequisites

- Node.js 20.x (recommended)
- npm (preferred) — use `npm ci` for reproducible installs
- Environment files are not committed. Create a local `.env` from `.env.example` when needed.

## Branching Strategy

We use a simple trunk-based workflow:

- `main`: stable, deployable branch
- Feature branches: `feature/<short-description>`
- Bugfix branches: `fix/<short-description>`
- Chores/maintenance: `chore/<short-description>`

Examples:

- `feature/mdx-renderer`
- `fix/blog-post-delete-modal`
- `chore/update-deps`

## Commit Message Convention

Follow Conventional Commits for clarity and automation:

- `feat(scope): add new capability`
- `fix(scope): correct a bug`
- `docs(scope): update documentation`
- `style(scope): formatting, missing semicolons, etc.`
- `refactor(scope): code changes that neither fix a bug nor add a feature`
- `perf(scope): improve performance`
- `test(scope): add or fix tests`
- `build(scope): build system or external dependencies changes`
- `ci(scope): CI configuration or scripts changes`
- `chore(scope): other changes that don’t modify src or tests`
- `revert: description` (if reverting a commit)

Example: `feat(blog): render MDX content with gfm`

## Pull Requests

Target branch: `main`

Checklist before marking Ready for Review:

- [ ] `npm ci` installs cleanly
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` and `npm run test:coverage` pass
- [ ] `npm run build` succeeds
- [ ] Add screenshots/GIFs for UI changes
- [ ] Update docs and .env.example if configuration changed

Small PRs are easier to review. Use Draft PRs for work in progress.

## Code Style & Quality

- TypeScript strictness: keep types accurate; prefer explicit types when helpful
- Accessibility: leverage utils in `src/utils/accessibility.ts` and hooks in `src/hooks/useAccessibility.ts`
- UI consistency: use components in `src/components/ui` and shared styles in `globals.css`
- Error handling: surface friendly UI messages and log via `src/services/error-reporting.ts` where appropriate

## Testing

- Write unit tests for new logic and components
- Keep tests deterministic; avoid network calls during tests
- Run tests locally: `npm test` or `npm run test:watch`

## CI Pipeline

Every push and pull request runs GitHub Actions:

1. Install dependencies (`npm ci`)
2. Type check (`npm run type-check`)
3. Lint (`npm run lint`)
4. Unit tests and coverage (`npm test`, `npm run test:coverage`)
5. Build (`npm run build`), with `NEXT_PUBLIC_BUILD_VERSION` set to the commit SHA

PRs must pass CI before merging. We recommend “Squash and merge” to keep a clean history.

## Releases

- Follow SemVer in `package.json` when publishing or tagging releases
- Tag format: `vX.Y.Z`
- Update `CHANGELOG.md` (optional) summarizing features/fixes

## Environment & Secrets

- Do not commit `.env` files; `.gitignore` already excludes them
- Use GitHub Secrets for CI if needed; locally, copy `.env.example` and fill values

## Getting Help

- Open a discussion or issue describing your goal/problem
- Include reproduction steps, logs, and environment info when reporting bugs

Thank you for contributing!
