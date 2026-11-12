<div align="center">

# RabbitHR

**Open source applicant tracking system (ATS) and recruitment CRM for staffing and recruitment agencies**

Manage clients, jobs, candidates, pipelines, interviews, offers and email in one place. Give every candidate a branded self-service portal. Self-host it or run it as multi-tenant SaaS.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#features) · [Screenshots](#screenshots) · [Quick start](#quick-start) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Contributing](#contributing)

![RabbitHR dashboard](docs/screenshots/dashboard.jpg)

</div>

## Why RabbitHR

Most applicant tracking systems are built for in-house HR teams hiring for one company. Recruitment and staffing agencies work differently: they hire **for many clients at once**, juggle permanent, contract and temporary roles, and live in their inbox. RabbitHR is an **agency-first ATS** built around that workflow, and it is fully open source.

- **Agency native**: clients and contacts, jobs per client, placements, client interview stages
- **Global by default**: any currency, locale, time zone and date format, configured per organization
- **Multi-tenant**: run one instance for many agencies, each with isolated data, roles and branding
- **Own your data**: self-host on your own infrastructure under the AGPL-3.0 license

## Features

### Recruiting core
- **Clients and contacts**: client accounts, contacts, billing details, notes, jobs and email history per client
- **Jobs**: permanent, contract and temporary roles with pay ranges, departments, hiring managers and openings
- **Candidates**: searchable talent database with skills, tags, sources, ratings, documents and custom fields
- **Pipeline**: drag and drop kanban board with configurable stages, time-in-stage targets and bulk actions
- **Activity timeline**: every email, call, note, stage change and portal action on one timeline
- **Tasks**: follow-ups linked to candidates, jobs and clients with due dates and owners

### Interviews and offers
- **Interview scheduling** with panels, scorecards and feedback tracking
- **Self-scheduling booking links** based on each recruiter's availability
- **Offers** with approval chains and **built-in e-signature** for candidates

### Communication
- **Gmail-style shared inbox**: connect Gmail or Outlook, threads are auto-linked to candidates and clients
- **Email templates** with merge fields
- **Calls and WhatsApp** (via Plivo and WappCloud), shown only when the integration is connected
- **Calendar sync and meeting links** for Google Calendar, Microsoft 365 and Zoom

### Candidate portal
- **Passwordless sign in** with a one-time email code
- **Branded per organization** with logo, name and brand colour
- Candidates track applications, see interviews, **sign offers**, upload documents, update their profile and apply to more jobs

### Distribution and insight
- **Public careers page** with apply form, per organization
- **Job board XML feed** for Indeed, LinkedIn and other boards
- **Reports**: funnel and conversion, time to hire, source effectiveness, recruiter performance, offers and more
- **Dashboard** with the day's priorities

### Platform
- **Role based access control** with own, team and all scopes
- **Custom fields** on candidates and jobs, **custom pipeline stages**
- **Audit log** of every change
- **Dark mode**, keyboard shortcuts and a command palette

## Screenshots

| Pipeline | Candidate profile |
| --- | --- |
| ![Kanban hiring pipeline](docs/screenshots/pipeline.jpg) | ![Candidate profile drawer](docs/screenshots/candidate.jpg) |
| **Shared inbox** | **Reports** |
| ![Gmail style recruiter inbox](docs/screenshots/inbox.jpg) | ![Recruitment reports](docs/screenshots/reports.jpg) |

<p align="center">
  <img src="docs/screenshots/portal.jpg" alt="Candidate self-service portal" width="80%" />
  <br />
  <em>Candidate portal</em>
</p>

## Quick start

### Prerequisites

- Node.js 20 or newer
- pnpm 9 (`corepack enable`)
- PostgreSQL 14 or newer
- Redis 6 or newer (queues, rate limits and caching)

### Run locally

```bash
git clone https://github.com/geekyowls/rabbit-hr.git
cd rabbit-hr
pnpm install
pnpm build:packages

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.template apps/frontend/.env.local
# edit apps/backend/.env: set DB_URL, JWT secrets and Redis connection

pnpm --filter backend seed        # demo organization and sample recruiting data
pnpm --filter backend dev         # API on http://localhost:4000 (Swagger at /api/docs)
pnpm --filter backend start:worker # background jobs (email sync, reminders)
pnpm --filter frontend dev        # app on http://localhost:3000
```

Sign in at `http://localhost:3000` with the seeded demo admin `admin@rabbithr.test` / `Admin@123`. Change it before exposing the app anywhere.

The careers page lives at `/careers?org=<slug>` and the candidate portal at `/portal/login?org=<slug>`.

### Integrations

Every integration is optional. Features that depend on one stay hidden until it is connected under **Settings > Integrations**. Provider credentials (Google, Microsoft, Zoom, Plivo, WappCloud) are configured through environment variables, see `apps/backend/.env.example`.

## Architecture

```
apps/
  backend/     NestJS 11 API and BullMQ worker, TypeORM, PostgreSQL
  frontend/    Next.js 15 static export, fully client side
packages/
  shared/      frontend-safe types, permissions, utils and events
  core/        backend services (mail, storage, cache, integrations)
```

- **Backend**: command and use case pattern, JWT access and refresh tokens, separate candidate portal tokens, Redis backed queues and rate limits
- **Frontend**: shadcn/ui, Radix and Tailwind CSS, TanStack Query and Table, react-hook-form and zod
- **Processes**: one image runs as the API or the worker
- **Database**: TypeORM `synchronize` in development; generate migrations before deploying to production

Contributor conventions live in [`CLAUDE.md`](CLAUDE.md), [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md) and [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md).

## Roadmap

- [x] Core ATS: clients, jobs, candidates, pipeline, tasks, documents, careers page
- [x] Settings: custom stages, custom fields, hiring team, interviews, offers, reports
- [x] Integrations: shared inbox, calendar sync, meeting and booking links, calls, WhatsApp, job feed, e-sign
- [x] Candidate portal with passwordless sign in
- [ ] Real-time chat between recruiters and candidates
- [ ] Multilingual interface
- [ ] AI resume parsing, candidate matching and automation agents
- [ ] Per-job pipeline templates
- [ ] Custom domains and subdomains per organization

Have an idea? [Open a feature request](https://github.com/geekyowls/rabbit-hr/issues/new/choose).

## Contributing

Contributions are welcome. Read the [contributing guide](CONTRIBUTING.md) to get set up, and please follow the [code of conduct](CODE_OF_CONDUCT.md).

Found a security issue? Please report it privately as described in [SECURITY.md](SECURITY.md).

## License

RabbitHR is licensed under the [GNU Affero General Public License v3.0](LICENSE). You can use, modify and self-host it freely. If you run a modified version as a network service, you must make your source code available to its users under the same license.
