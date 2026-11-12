# Security policy

## Reporting a vulnerability

Please do not report security issues through public GitHub issues.

Use [GitHub private vulnerability reporting](https://github.com/geekyowls/rabbit-hr/security/advisories/new) instead. Include the affected version or commit, steps to reproduce and the impact you expect.

We aim to acknowledge reports within 3 business days and to share a fix timeline after triage. We will credit you in the advisory unless you prefer to stay anonymous.

## Supported versions

Security fixes are applied to the latest commit on `main`.

## Hardening checklist for self-hosting

- Replace every secret in `apps/backend/.env.example` with strong random values
- Change or remove the seeded demo admin account
- Run the API behind HTTPS
- Generate database migrations instead of relying on `synchronize` in production
- Keep PostgreSQL and Redis off the public internet
