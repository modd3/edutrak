# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EduTrak is a multi-tenant School Management System (SMS) for Kenyan schools (Primary, Secondary, TVET, Special Needs). It's a full-stack monorepo with:
- **Backend**: Node.js + TypeScript + Express + Prisma (PostgreSQL)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query + Zustand + shadcn/ui + Tailwind CSS

The system supports role-based access (Super Admin, Admin, Teacher, Student, Parent) and manages students, teachers, academic years, classes, subjects, assessments, and reporting.

## Common Development Commands

### Backend (server/)
```bash
# Development
cd server
npm install
npm run dev                    # Start dev server with nodemon

# Database
npm run db:generate            # Generate Prisma client
npm run db:migrate             # Run migrations (dev)
npm run db:reset               # Reset database
npm run db:seed                # Seed database
npm run db:studio              # Open Prisma Studio

# Build & Production
npm run build                  # Compile TypeScript
npm start                      # Start production server

# Testing & Linting
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint errors
```

### Frontend (frontend/)
```bash
# Development
cd frontend
npm install
npm run dev                    # Start Vite dev server

# Build & Production
npm run build                  # Type check + build
npm run preview                # Preview production build

# Linting
npm run lint                   # Run ESLint
```

### Docker Development Stack
```bash
# Full stack (Postgres + Backend + Frontend)
docker-compose up              # Start all services
docker-compose up -d           # Start in detached mode
docker-compose down            # Stop all services
docker-compose logs -f backend # Follow backend logs
```

### Running Individual Tests
```bash
# Backend
cd server
npm test -- auth.test.ts       # Run specific test file
npm test -- --testNamePattern="login" # Run specific test by name

# Frontend (when tests are added)
cd frontend
npm test -- SubjectsList       # Run specific test file
```

## High-Level Architecture

### Multi-Tenancy & Security Model

**Critical**: This is a **multi-tenant system** with school-based data isolation.

- The `School` model is the top-level tenant entity
- Nearly every model links to `schoolId` (directly or indirectly)
- **Two middleware layers enforce isolation**:
  1. `authenticate` (`server/src/middleware/auth.middleware.ts`): Verifies JWT tokens
  2. `enforceSchoolContext` (`server/src/middleware/school-context.ts`): **CRITICAL for multi-tenant security**
     - Super Admins can access all schools (no schoolId filter)
     - All other roles MUST have a schoolId and can only access their school's data
     - Automatically injects `req.schoolId` for query filtering
     - Validates resource ownership on POST/PUT/PATCH requests

**When writing queries or endpoints**: Always use `enforceSchoolContext` middleware and filter by `req.schoolId` unless the user is a Super Admin.

### Backend Service Architecture

The backend follows **Service-Oriented Architecture**:

```
Routes → Controllers → Services → Prisma (Database)
         ↓
    Middleware (Auth, School Context, Validation)
```

**Key services** (`server/src/services/`):
- `auth.service.ts`: JWT authentication, login, token refresh
- `school.service.ts`: School (tenant) management
- `user.service.ts` & `user-creation.service.ts`: User CRUD + complex atomic user creation with role profiles
- `student.service.ts`: Student lifecycle (enrollment, promotion, transfer)
- `teacher.service.ts`: Teacher management and subject assignments
- `guardian.service.ts`: Parent/guardian management
- `academic.service.ts`: AcademicYears, Terms, Classes, Streams
- `subject.service.ts`: Core subjects and school-specific SubjectOfferings
- `assessment.service.ts`: Assessment definitions, grading, reports
- `class-subject.service.ts`: Teacher-subject-class assignments (timetable foundation)
- `sequence-generator.service.ts`: Thread-safe sequential ID generation (e.g., `STU-2024-0001`)

**Service patterns**:
- All services extend `BaseService` and use dependency injection
- Business logic is encapsulated in services (not controllers)
- Controllers are thin: validate input → call service → return response
- Services use Prisma transactions for atomic operations

### Frontend Architecture

Domain-driven structure organized by feature:

```
src/
  ├── pages/           # Route components (domain-organized)
  ├── components/      # Reusable UI components (domain-organized)
  ├── hooks/           # Custom React Query hooks (use-*.ts)
  ├── services/        # API client services
  ├── store/           # Zustand stores (auth-store.ts)
  ├── lib/             # Utilities (cn helper, etc.)
  └── types/           # TypeScript type definitions
```

**Data fetching pattern**:
- **TanStack Query** for all server state (fetching, caching, mutations)
- Custom hooks (`use-*.ts`) encapsulate queries and mutations
- **Zustand** for global client state (currently only auth)
- All hooks follow the pattern:
  ```typescript
  useEntities()              // List with pagination
  useCreateEntity()          // Create mutation
  useUpdateEntity()          // Update mutation
  useDeleteEntity()          // Delete mutation
  ```

**Component patterns**:
- Pages use shadcn/ui components (Button, Dialog, Table, etc.)
- Forms use React Hook Form + Zod validation
- Modal components follow `*FormModal` and `*DetailsModal` conventions
- All mutations show toast notifications on success/error

### Data Model Key Relationships

**User & Role Profiles**:
- Central `User` model (login credentials)
- One-to-one with role-specific profiles: `Student`, `Teacher`, or `Guardian`
- Separation allows flexible authentication with detailed profile data

**Student Enrollment**:
- `StudentClass` junction table represents enrollment in a `Class` for an `AcademicYear`
- Tracks status: `ACTIVE`, `PROMOTED`, `TRANSFERRED`, `GRADUATED`, `WITHDRAWN`
- Critical for academic progression tracking

**Teaching Assignments**:
- `ClassSubject` links `Teacher`, `Subject`, `Class` for a specific `Term` and `AcademicYear`
- Foundation for timetables and assessment assignments

**Assessments**:
- `AssessmentDefinition`: What the assessment is (name, type, max marks)
- `AssessmentResult`: Individual student scores for that assessment
- Supports three types: `COMPETENCY`, `GRADE_BASED`, `HOLISTIC`

**Sequential IDs**:
- `Sequence` model generates unique, auto-incrementing identifiers
- Used for admission numbers, employee numbers, etc.
- Scoped by school and/or year for proper isolation

## Environment Setup

### Backend Environment Variables (server/.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edutrak_db"

# Auth
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Email (optional, for Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Frontend Environment Variables (frontend/.env)
```bash
VITE_API_URL=http://localhost:4000/api
```

## Project-Specific Conventions

### TypeScript & Code Style
- Strict TypeScript enabled on both frontend and backend
- Use explicit types (avoid `any` unless necessary)
- Backend: Controllers use `ResponseUtil` helper for consistent API responses
- Frontend: Use Zod schemas for form validation and type inference

### Authentication Flow
1. User logs in via `/api/auth/login`
2. Backend returns JWT access token (1h) and refresh token (7d)
3. Frontend stores token in Zustand auth store and localStorage
4. Frontend adds `Authorization: Bearer <token>` header to all API requests
5. Backend `authenticate` middleware verifies token on protected routes
6. Backend `enforceSchoolContext` middleware enforces school-based access control

### API Response Format
All backend responses follow this structure:
```typescript
{
  success: boolean,
  message: string,
  data?: any,
  error?: string,
  errors?: ValidationError[]
}
```

### Validation
- Backend: `express-validator` for request validation + Zod in some services
- Frontend: Zod schemas with React Hook Form

### Database Migrations
- Always create migrations with descriptive names: `npx prisma migrate dev --name add_guardian_fields`
- After schema changes, regenerate Prisma client: `npm run db:generate`
- For large schema changes, consider using `prisma migrate reset` in development

### Bulk Operations
- CSV import supported for users (see `user-creation.service.ts`)
- Uses `csv-parse` library for parsing
- Always wrapped in transactions to ensure atomicity

## Testing

- Backend tests use Jest + Supertest
- Test files located in `server/tests/`
- Run tests before committing changes
- Key test files: `auth.test.ts`, `user.test.ts`

## Important Documentation

- `GEMINI.md`: Comprehensive project overview and architecture details
- `INTEGRATION_GUIDE.md`: How to integrate new frontend components
- `QUICK_REFERENCE.md`: Frontend hooks, components, and service methods
- `docs/`: Additional design docs and implementation guides
- `server/prisma/schema.prisma`: Source of truth for data model

## Common Pitfalls & Gotchas

1. **Multi-tenancy**: Never forget to apply `enforceSchoolContext` middleware on routes that access school-scoped data
2. **Prisma relations**: When querying nested data, use `include` properly to avoid N+1 queries
3. **Sequence generation**: Use `sequence-generator.service.ts` for all sequential IDs; don't implement custom counters
4. **JWT secrets**: Must be at least 32 characters for security
5. **Docker networking**: Backend connects to database at `db:5432` (container name), not `localhost:5432`
6. **Frontend API calls**: Always go through service files, not direct axios calls
7. **Role checks**: Super Admins bypass school filtering; always check `req.isSuperAdmin` when needed
8. **Prisma transactions**: Use `$transaction` for operations that must succeed or fail together (e.g., user + profile creation)

## Deployment Notes

- Backend runs on port 4000 (configurable via PORT env var)
- Frontend dev server runs on port 3000 (Vite default) or 5173
- Production frontend builds to `dist/` directory
- Database requires PostgreSQL 12+
- Node.js 18+ required (see `server/package.json` engines field)

