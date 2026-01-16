# EduTrak — Project Outline (Updated)

This document is the canonical, actionable project outline for EduTrak (Kenyan School Management System). It describes the system, repository layout, development workflows, and recommended next steps.

## Project summary
EduTrak is a multi-tenant School Management System (SMS) for Kenyan schools (Primary, Secondary, TVET, Special Needs). The system provides role-based access for Super Admin, Admin, Teacher, Student and Parent and supports core features: schools, users, students, classes/streams, academic years/terms, subjects, assessments, grading and reporting.

Tech stack (short)
- Frontend: React 18, TypeScript, Vite, TanStack Query, Zustand, shadcn/ui, Tailwind CSS
- Backend: Node.js, TypeScript, Express, Prisma (Postgres)
- Auth: JWT, password hashing (bcrypt)
- Validation: Zod
- Dev tooling: npm, docker-compose (local), Prisma migrations

## Repository layout
- frontend/ — React SPA (Vite). Contains src/, package.json, .env.example
- server/ — Express API with Prisma schema at server/prisma/schema.prisma, migrations, seed scripts
- docs/ — architecture, guides, and implementation notes
- docker-compose.yml — optional local dev stack
- .github/ — workflows (CI), issue/PR templates (recommended)

## Key files (where to look)
- server/prisma/schema.prisma — database schema and enums (source of truth for models)
- server/src — Express app, controllers, services
- frontend/src — feature-based layout (api/, pages/, components/, hooks/, store/)
- docs/FRONTEND_BUILD_GUIDE.md — frontend design and build recommendations
- docs/project-outline.md — (this file)

## Local development (short)
1. Backend
   - copy env: `cp server/.env.example server/.env` and update DATABASE_URL, JWT secrets
   - install: `cd server && npm install`
   - migrate: `npx prisma migrate dev --name init`
   - seed (if provided): `npm run seed`
   - start: `npm run dev` (starts Express on PORT)

2. Frontend
   - copy env: `cp frontend/.env.example frontend/.env`
   - install: `cd frontend && npm install`
   - start: `npm run dev` (Vite dev server)

3. Using docker-compose
   - `docker-compose up` (if configured) — brings up Postgres, api, etc.

## API contract and frontend integration
- Add an OpenAPI/Swagger spec (server/openapi.yaml or docs/openapi.yaml) as the single source of truth for endpoints and request/response schemas.
- Frontend types should be generated from OpenAPI or the Prisma schema to avoid drift.

## Data & migrations
- Keep Prisma schema as source of truth. Use migration scripts and add a `server/prisma/seed.ts` script for sample data.
- Provide deterministic sample data (one sample school, admin user, a teacher, some students) for local development and demo.

## CI / Quality gates (minimum recommended)
- Linting and TypeScript checks
- Unit tests (frontend + backend)
- Integration tests for a couple of backend endpoints (auth, health, school list)
- Build step for frontend and backend (to ensure production bundling works)
- Run migrations (or at least `prisma migrate status`) in CI to catch schema issues

## Security & ops
- Never commit secrets — use .env.example only.
- Add a health endpoint (`/health`) and basic readiness/liveness checks.
- Set up a secrets manager for production (AWS Secrets Manager, GitHub Secrets, or similar).
- Add logging, request tracing and rate limiting as needed.

## Roadmap / next priorities (short)
1. Stabilize API contract (OpenAPI) and seed data (0.5–1 day)
2. Add CI workflow (0.5 day)
3. Add .env.example for both frontend and backend and basic README dev steps (already done) (0.25 day)
4. Implement a small test suite and run it in CI (1 day)
5. Build frontend pages for assessments and student lifecycle items identified in FRONTEND_BUILD_GUIDE (2–5 days depending on scope)
6. Prepare deployment pipeline (Docker image build, registry push, staging environment) (1–2 days)

## Contributing
- Follow TypeScript rules and linting
- Add tests for new features
- Keep API changes backward compatible where possible; coordinate breaking changes by updating OpenAPI and bumping API version
