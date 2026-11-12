# Contributing to RabbitHR

Thanks for helping build an open source ATS for recruitment agencies. This guide gets you from clone to pull request.

## Ways to contribute

- Report bugs and suggest features through [issues](https://github.com/geekyowls/rabbit-hr/issues/new/choose)
- Improve documentation
- Pick an issue labelled `good first issue` or `help wanted`
- Add or improve integrations, reports and translations

For larger changes, open an issue first so we can agree on the approach before you invest time.

## Development setup

Follow the [quick start](README.md#quick-start) to run the API, worker and frontend locally with seeded demo data.

## Project conventions

The full conventions are in [`CLAUDE.md`](CLAUDE.md), [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md) and [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md). The essentials:

- **Backend**: command and use case pattern, responses wrapped in `{ data }`, every endpoint guarded with `@RequirePermissions` or `@RequireAuthentication`, entities registered in `DatabaseModule`
- **Frontend**: every page is a client component, API calls go through `fetchApi` and `API_ROUTES`, forms use react-hook-form with zod v4, reuse components from `@/components/patterns`
- **Code style**: self-documenting code without comments, small focused changes, no duplicated logic
- **UI copy**: sentence case, no trailing periods on short labels, no em or en dashes
- **Dark mode**: use semantic color tokens or pair every custom color with a `dark:` variant

## Before you open a pull request

```bash
pnpm build:packages
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend exec tsc --noEmit
pnpm lint
```

All four must pass with zero errors. A pre-commit hook runs the same checks.

## Commits and branches

- Branch from `main` using `feat/`, `fix/`, `chore/` or `docs/` prefixes
- Use lowercase [conventional commit](https://www.conventionalcommits.org) messages, for example `feat: add bulk stage move`
- Keep pull requests focused on one change and fill in the template

## License

By contributing you agree that your contributions are licensed under the [AGPL-3.0](LICENSE).
