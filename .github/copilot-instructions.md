# EduTrak AI Agent Instructions

## Architecture Overview

**EduTrak** is a multi-tenant School Management System (SMS) for Kenyan schools with role-based access (Super Admin, Admin, Teacher, Student, Parent).

### Tech Stack
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, shadcn/ui
- **Auth**: JWT tokens, bcrypt password hashing
- **Validation**: Zod (frontend forms), middleware (backend)

### Repository Structure
```
frontend/src/
├── api/            # Axios API clients (index.ts + domain-specific files)
├── components/     # Feature-organized UI (academic/, assessments/, classes/, etc.)
├── hooks/          # React Query hooks (use-*.ts pattern)
├── pages/          # Page-level components (route handlers)
├── store/          # Zustand stores (auth-store.ts)
├── types/          # TypeScript interfaces
└── services/       # Additional business logic

server/src/
├── routes/         # Express route handlers
├── controllers/    # Request handlers
├── services/       # Business logic
├── middleware/     # Auth, error handling, logging
├── dtos/           # Request/response schemas
└── validation/     # Input validation
```

## Critical Patterns (Must Follow These)

### 1. Frontend Data Fetching
**Always use React Query through custom hooks** - direct `fetch` or `useEffect` is prohibited:

```typescript
// ✅ CORRECT: Custom hook pattern
export function useStudents(params: StudentFilters) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.getAll(params),
  });
}

// ✅ CORRECT: Usage in component
const { data: students, isLoading } = useStudents({ page: 1 });
```

**Pattern**: One hook file per domain (`use-students.ts`, `use-assessments.ts`, etc.). Each contains `useQuery` (GET), `useMutation` (POST/PUT/DELETE) operations.

### 2. Frontend Form Validation
Use React Hook Form + Zod, never raw validation:

```typescript
// Schema first (Zod)
const studentSchema = z.object({
  firstName: z.string().min(2),
  email: z.string().email(),
  admissionNo: z.string().optional(),
});

// Component
function StudentForm({ onSubmit }) {
  const form = useForm({ resolver: zodResolver(studentSchema) });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('firstName')} />
      {form.formState.errors.firstName && (
        <span>{form.formState.errors.firstName.message}</span>
      )}
    </form>
  );
}
```

### 3. API Client Structure
Frontend API clients are namespaced and centralized:

```typescript
// frontend/src/api/index.ts exports:
export const studentsApi = { getAll, getById, create, update, delete, enroll };
export const classesApi = { getAll, create, assignSubject };
export const assessmentApi = { getAssessments, recordResult, getResults };
// etc.
```

### 4. Component Patterns
- **Pages** (`/pages`): Dashboard-level containers, manage page-wide state
- **Modals** (`*FormModal.tsx`, `*DetailsModal.tsx`): Encapsulated CRUD dialogs
- **Tables**: Use `@tanstack/react-table`, wrap with `DataTable` component
- **All modals**: Accept `open` + `onOpenChange` props for controlled state
- **All mutations**: Show toast notifications (`sonner` library)

```typescript
// Pattern: Page with embedded modals
export function StudentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: students } = useStudents();
  
  return (
    <>
      <PageHeader title="Students" />
      <DataTable data={students} />
      <StudentFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}
```

### 5. Backend Service Layer
All business logic in services, controllers stay thin:

```typescript
// ✅ server/src/services/student.service.ts
export class StudentService {
  async enrollStudent(studentId, classId) {
    // Validation, calculation, related records
  }
}

// ✅ server/src/controllers/student.controller.ts
export async function enroll(req, res) {
  const result = await studentService.enrollStudent(req.body.studentId, req.body.classId);
  res.json(result);
}
```

### 6. Multi-Tenancy (School Context)
Every request operates within a school context:

**Backend**: `schoolId` extracted from JWT token/header, passed to services
```typescript
// Middleware adds schoolId to req
router.post('/students', authenticate, async (req, res) => {
  const { schoolId } = req.user; // From token
  const students = await StudentService.getBySchool(schoolId);
});
```

**Frontend**: `useSchoolContext()` hook provides `schoolId` from auth store
```typescript
const { schoolId } = useSchoolContext(); // Always include in queries
const { data } = useStudents({ schoolId, page: 1 });
```

### 7. Referential Integrity: Never Duplicate Enum Fields
**Problem**: `ClassSubject.subjectCategory` duplicates `Subject.category` enum. Do NOT accept it as a parameter.

**✅ CORRECT**: Fetch category from Subject when creating/updating ClassSubject:
```typescript
// When assigning subject to class
async assignSubjectToClass(data: { classId, subjectId, ... }) {
  // Fetch the subject to get its category
  const subject = await this.prisma.subject.findUnique({
    where: { id: data.subjectId }
  });
  
  if (!subject) throw new Error('Subject not found');
  
  // Use subject.category, NOT accept it as parameter
  const classSubject = await this.prisma.classSubject.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      subjectCategory: subject.category, // From Subject model, not parameter
      // ... other fields
    }
  });
}
```

**❌ WRONG** - Never accept subjectCategory as parameter:
```typescript
// BAD: Allows inconsistency
async assignSubjectToClass(data: { 
  classId, subjectId, subjectCategory, // ← Don't accept this!
  ...
}) { ... }
```

**Impact**: ClassSubject category must always reflect Subject category. Currently all new assignments default to CORE due to parameter omission. Services affected: `ClassSubjectService`, `TeacherService`, `StudentClassSubjectService`.

## Key Developer Workflows

### Building a New Feature (Frontend Page)

1. **Create hook** (`frontend/src/hooks/use-feature.ts`):
   - Query for GET, Mutation for POST/PUT/DELETE
   - Invalidate cache on success
   - Handle toast notifications

2. **Create modal components** (if CRUD):
   - `FeatureFormModal.tsx` — form with validation
   - `FeatureDetailsModal.tsx` — read-only details

3. **Create page** (`frontend/src/pages/feature/FeaturePage.tsx`):
   - Use hooks, manage modal state
   - Import and embed modals
   - Use `PageHeader`, `DataTable` components

4. **Update router** (`frontend/src/App.tsx`):
   - Add route with role checks
   - Import page component

5. **Update sidebar** (`frontend/src/config/sidebarConfig.ts`):
   - Add menu item with icon + role restrictions

### Running Locally

**Backend**:
```bash
cd server
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev  # Apply schema changes
npm run dev            # Starts on http://localhost:3000
```

**Frontend**:
```bash
cd frontend
cp .env.example .env  # VITE_API_URL should be http://localhost:3000/api
npm install
npm run dev           # Starts on http://localhost:5173
```

### Testing a Feature

1. **Backend**: Verify endpoint via Postman/curl with proper JWT
2. **Frontend**: Check React Query DevTools (should cache responses)
3. **Check**: Network tab for 401/403 errors, browser console for TypeScript warnings

### Common Commands

| Task | Command |
|------|---------|
| Backend dev | `cd server && npm run dev` |
| Frontend dev | `cd frontend && npm run dev` |
| Run migrations | `cd server && npx prisma migrate dev --name <name>` |
| Reset DB (dev only) | `cd server && npx prisma migrate reset` |
| Lint frontend | `cd frontend && npm run lint` |
| Lint backend | `cd server && npm run lint` |
| Backend tests | `cd server && npm test` |

## Project-Specific Conventions

### Naming
- **Hooks**: `use<Feature>.ts` (e.g., `use-students.ts`, `use-assessments.ts`)
- **APIs**: Domain namespaces (e.g., `studentsApi.create()`)
- **Components**: PascalCase for components, kebab-case for files
- **Modals**: `*FormModal.tsx` (create/edit), `*DetailsModal.tsx` (read)
- **Pages**: Feature-based directories with `index.tsx` or `PageName.tsx`

### Data Constraints
- **Admission Numbers**: Auto-generated per school via sequence system
- **Grades**: Mapped from numerical scores → A–E for 8-4-4 curriculum
- **Competency Levels**: Mapping (1–4) for CBC curriculum
- **Class Capacity**: No hard limit in schema (validated by business logic)
- **Multi-Tenancy**: Enforce `schoolId` in all queries

### Critical Endpoints (Reference)
```
Students:  POST /api/students, GET /api/students/:id, PUT /api/students/:id
Classes:   POST /api/classes, GET /api/classes, PATCH /api/classes/:id/stream
Subjects:  POST /api/subjects, GET /api/subjects, DELETE /api/subjects/:id
Teachers:  POST /api/teachers, PUT /api/teachers/:id
Assessments: POST /api/assessments, GET /api/assessments, POST /api/results
Auth:      POST /api/auth/login, POST /api/auth/refresh
```

## Integration Points & Cross-Component Communication

### School Context Flow
1. User logs in → JWT token contains `schoolId`
2. `useSchoolContext()` reads from `auth-store.ts`
3. All hooks include `schoolId` in query keys/params
4. Backend middleware enforces school isolation

### Assessment to Grade Entry Flow
1. Teacher creates `AssessmentDefinition` (term, class, subject)
2. Frontend fetches students enrolled in subject (`useStudentsEnrolledInSubject`)
3. Teacher records grades in `GradeEntryTable`
4. Mutation posts to `/api/results` with assessment ID + scores
5. Results cached by React Query, dashboard reflects updates

### Student Enrollment Flow
1. Admin enrolls student in class → `StudentClass` record created
2. System auto-enrolls core subjects → `StudentClassSubject` records
3. Student selects electives via `ElectiveSubjectSelectionDialog`
4. Frontend reflects in subject roster when viewing assessments

## External Dependencies
- **JWT Auth**: Tokens in `Authorization` header (Bearer scheme)
- **Prisma**: Single schema source of truth at `server/prisma/schema.prisma`
- **TanStack Query**: Cache invalidation key: `['resource', params]`
- **Zustand**: Minimal global store (auth only, no redux boilerplate)
- **Docker Compose**: Optional, defined in root `docker-compose.yml` for local Postgres

## Troubleshooting Guide for Agents

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT in `Authorization` header, verify token not expired |
| 403 Forbidden | User lacks role for endpoint, check `roles` middleware |
| Query not updating | Invalidate cache: `queryClient.invalidateQueries({ queryKey: ['resource'] })` |
| Modal not appearing | Verify `open` + `onOpenChange` props connected to state |
| Component won't render | Check `isLoading` state, ensure data exists before mapping |
| Type errors | Import types from `frontend/src/types/index.ts` |
| API mismatch | Compare endpoint in browser Network tab to `frontend/src/api/index.ts` |
| ClassSubject has wrong category | Always fetch `subject.category` when creating ClassSubject, never pass as parameter. See referential integrity pattern (§7) |
| All subjects showing as CORE | Verify `assignSubjectToClass()` fetches category from Subject model, not from request body |

## References
- **Full Architecture**: [docs/project-outline.md](../docs/project-outline.md)
- **Frontend Guide**: [docs/FRONTEND_BUILD_GUIDE.md](../docs/FRONTEND_BUILD_GUIDE.md)
- **API Docs**: [server/APIdoc.md](../server/APIdoc.md)
- **Prisma Schema**: [server/prisma/schema.prisma](../server/prisma/schema.prisma)
- **Integration Guide**: [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)
