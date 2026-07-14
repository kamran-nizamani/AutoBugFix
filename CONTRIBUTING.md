# Contributing to AutoBugFix

Thanks for your interest in contributing.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and set `AI_API_KEY` (see the [README](README.md#environment-variables)).
4. Run the dev server: `npm run dev`

## Development Workflow

1. Create a branch off `main`: `git checkout -b feature/short-description`
2. Make your changes.
3. Type-check before committing: `npm run lint`
4. Build to confirm production output is unaffected: `npm run build`
5. Commit with a clear, descriptive message (see below).
6. Push your branch and open a pull request against `main`.

## Commit Messages

Use short, imperative commit messages that explain *why*, not just *what*:

```
fix(server): load AI_API_KEY from .env.local, not just .env
feat(triage): add severity override for manual AI triage results
```

## Code Style

- TypeScript throughout; keep `npm run lint` passing (no `tsc` errors).
- No unused dependencies, files, or dead code — if you remove a feature's last usage, remove the code/dependency with it.
- Prefer editing existing files/components over adding new abstractions.
- No secrets, API keys, or `.env*` files (other than `.env.example`) in commits.

## Pull Requests

- Keep PRs focused on one change; avoid bundling unrelated refactors.
- Describe what changed and why in the PR description.
- Make sure `npm run lint` and `npm run build` both succeed before requesting review.

## Reporting Issues

Open a GitHub issue with steps to reproduce, expected vs. actual behavior, and relevant logs/screenshots.
