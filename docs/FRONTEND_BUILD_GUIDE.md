# EduTrak Frontend Build Guide & Recommendations

## Current State Analysis

### ✅ What's Working Well

1. **Tech Stack** - Modern and well-chosen:
   - React 18 + TypeScript
   - Vite for fast builds
   - TanStack Query for server state
   - Zustand for client state
   - shadcn/ui components
   - Tailwind CSS v3
   - React Router v6

2. **Architecture**:
   - Clean separation of concerns
   - Service layer pattern
   - Custom hooks for data fetching
   - Type-safe with TypeScript
   - Proper authentication flow

3. **Components Already Built**:
   - DashboardLayout with responsive sidebar
   - Role-based navigation
   - Login page
   - Dashboard pages (Admin, Teacher, Student, Parent)
   - Schools management
   - Users management
   - Classes management

### ⚠️ Issues Identified & Fixed

#### 1. **Environment Configuration Missing**
**Problem**: No `.env` files for configuration
**Solution**: Created `.env.example` files

#### 2. **API Client Token Management**
**Problem**: Token stored in localStorage but auth store uses different storage
**Solution**: Updated api-client.ts to use Zustand store

#### 3. **Missing shadcn Components**
**Problem**: Using shadcn components that may not be installed
**Solution**: Need to verify and install missing components

#### 4. **Assessment Service Type Mismatch**
**Problem**: Frontend expects different structure than backend provides
**Solution**: Updated types and service methods

## Build Strategy

### Phase 1: Foundation Setup (Immediate)

1. **Install Missing Dependencies**
```bash
cd frontend
npm install
```

2. **Verify shadcn Components**
Check if these components are installed:
- Dialog
- Button
- Input
- Select
- Table
- Card
- Tabs
- Toast/Sonner
- Form components

3. **Environment Setup**
Create `.env` file based on `.env.example`

### Phase 2: Complete Missing Pages

#### Priority 1: Assessment Pages
- [ ] Assessment List Page
- [ ] Create Assessment Page
- [ ] Grade Entry Page
- [ ] Student Grades View
- [ ] Assessment Reports

#### Priority 2: Student Management
- [ ] Students List Page
- [ ] Student Details Page
- [ ] Student Enrollment Page
- [ ] Student Promotion Page

#### Priority 3: Teacher Management
- [ ] Teachers List Page
- [ ] Teacher Details Page
- [ ] Teacher Assignment Page

#### Priority 4: Academic Management
- [ ] Academic Year Management
- [ ] Term Management
- [ ] Subject Management
- [ ] Timetable Management

### Phase 3: Enhanced Features

1. **Dashboard Enhancements**
   - Real data integration (currently using mock data)
   - Charts using Recharts
   - Real-time statistics
   - Recent activities from API

2. **Search Functionality**
   - Implement global search in header
   - Search students, teachers, classes

3. **Notifications**
   - Notification center
   - Real-time updates
   - Push notifications

4. **Reports**
   - Performance reports
   - Term reports
   - Class analysis
   - Export functionality (PDF/Excel)

### Phase 4: User Experience

1. **Loading States**
   - Skeleton loaders
   - Progress indicators
   - Optimistic updates

2. **Error Handling**
   - Better error messages
   - Error boundaries
   - Retry mechanisms

3. **Form Validation**
   - Client-side validation with Zod
   - Better error display
   - Field-level validation

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

## Recommended File Structure

```
frontend/src/
├── components/
│   ├── ui/                    # shadcn components
│   ├── layout/               # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── shared/               # Shared components
│   │   ├── DataTable.tsx
│   │   ├── SearchInput.tsx
│   │   ├── StatusBadge.tsx
│   │   └── EmptyState.tsx
│   ├── students/             # Student-specific components
│   ├── teachers/             # Teacher-specific components
│   ├── assessments/          # Assessment components
│   └── classes/              # Class components
├── hooks/                    # Custom hooks
│   ├── use-auth.ts
│   ├── use-students.ts
│   ├── use-teachers.ts
│   ├── use-assessments.ts
│   └── use-classes.ts
├── lib/                      # Utilities
│   ├── api-client.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
├── pages/                    # Page components
│   ├── auth/
│   ├── dashboards/
│   ├── students/
│   ├── teachers/
│   ├── assessments/
│   ├── classes/
│   ├── reports/
│   └── settings/
├── services/                 # API services
│   ├── auth.service.ts
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── assessment.service.ts
│   └── class.service.ts
├── store/                    # State management
│   ├── auth-store.ts
│   └── ui-store.ts
├── types/                    # TypeScript types
│   └── index.ts
├── config/                   # Configuration
│   └── sidebarConfig.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Development Workflow

### 1. Start Development Server
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Build for Production
```bash
cd frontend
npm run build
npm run preview  # Test production build
```

### 3. Type Checking
```bash
npm run build  # TypeScript compilation happens during build
```

## API Integration Guidelines

### 1. Use React Query for All API Calls
```typescript
// Good ✅
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getAll(),
  });
}

// Bad ❌
const [students, setStudents] = useState([]);
useEffect(() => {
  fetch('/api/students').then(res => setStudents(res.data));
}, []);
```

### 2. Handle Loading and Error States
```typescript
function StudentsList() {
  const { data, isLoading, error } = useStudents();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <DataTable data={data} />;
}
```

### 3. Use Mutations for Write Operations
```typescript
export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => studentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created');
    },
  });
}
```

## Component Guidelines

### 1. Use shadcn Components
```typescript
// Good ✅
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// Bad ❌
<button className="px-4 py-2 bg-blue-500...">Click</button>
```

### 2. Keep Components Small and Focused
```typescript
// Good ✅
function StudentCard({ student }) {
  return <Card>...</Card>;
}

function StudentsList() {
  return students.map(s => <StudentCard student={s} />);
}

// Bad ❌
function StudentsList() {
  return students.map(s => (
    <div className="...">
      {/* 100 lines of JSX */}
    </div>
  ));
}
```

### 3. Use TypeScript Properly
```typescript
// Good ✅
interface StudentCardProps {
  student: Student;
  onEdit?: (id: string) => void;
}

export function StudentCard({ student, onEdit }: StudentCardProps) {
  // ...
}

// Bad ❌
export function StudentCard({ student, onEdit }: any) {
  // ...
}
```

## Testing Strategy

### 1. Unit Tests (Future)
- Test utility functions
- Test custom hooks
- Test service methods

### 2. Integration Tests (Future)
- Test page components
- Test user flows
- Test API integration

### 3. E2E Tests (Future)
- Test critical user journeys
- Test authentication flow
- Test data entry workflows

## Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load pages
const AssessmentPage = lazy(() => import('./pages/assessments/AssessmentPage'));
```

### 2. Memoization
```typescript
// Memoize expensive computations
const sortedStudents = useMemo(
  () => students.sort((a, b) => a.name.localeCompare(b.name)),
  [students]
);
```

### 3. Virtualization for Large Lists
```typescript
// Use react-window or similar for large datasets
import { FixedSizeList } from 'react-window';
```

## Security Considerations

### 1. Token Management
- ✅ Tokens stored in Zustand with persistence
- ✅ Automatic token refresh
- ✅ Redirect on 401

### 2. Role-Based Access
- ✅ Navigation filtered by role
- ✅ Protected routes
- ⚠️ Need to add permission checks on components

### 3. Input Validation
- ✅ Zod schemas for validation
- ⚠️ Need to implement on all forms

## Next Steps

### Immediate (This Week)
1. ✅ Fix API client token management
2. ✅ Create environment files
3. ⬜ Verify all shadcn components installed
4. ⬜ Create missing service files
5. ⬜ Build assessment pages

### Short Term (Next 2 Weeks)
1. Complete student management pages
2. Complete teacher management pages
3. Implement real data in dashboards
4. Add charts and visualizations
5. Implement search functionality

### Medium Term (Next Month)
1. Build reports section
2. Add notification system
3. Implement bulk operations UI
4. Add export functionality
5. Improve error handling

### Long Term (Next Quarter)
1. Add comprehensive testing
2. Performance optimization
3. Accessibility improvements
4. Mobile responsiveness
5. Progressive Web App features

## Common Patterns to Follow

### 1. Page Component Pattern
```typescript
export function StudentsPage() {
  const { data, isLoading } = useStudents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Students"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            Add Student
          </Button>
        }
      />
      
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable data={data} columns={columns} />
      )}
      
      <CreateStudentModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
```

### 2. Form Pattern
```typescript
const formSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

export function StudentForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });
  
  const { mutate, isPending } = useCreateStudent();
  
  const onSubmit = (data) => {
    mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Student'}
        </Button>
      </form>
    </Form>
  );
}
```

### 3. Modal Pattern
```typescript
export function CreateStudentModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Student</DialogTitle>
        </DialogHeader>
        <StudentForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
```

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

## Support

For questions or issues:
1. Check this guide first
2. Review the project-outline.md
3. Check the backend API documentation (APIdoc.md)
4. Consult the team

---

**Last Updated**: December 2024
**Version**: 1.0.0