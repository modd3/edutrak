# Frontend Components - Quick Reference Guide

## Page Components Quick Links

### Subjects Management
```typescript
// Import
import { SubjectsList } from '@/pages/subjects/SubjectsList';

// Usage
<Route path="/subjects" element={<SubjectsList />} />

// Features: CRUD, Search, Filter by curriculum
```

### Guardians Management  
```typescript
// Import
import { GuardiansList } from '@/pages/guardians/GuardiansList';

// Usage
<Route path="/guardians" element={<GuardiansList />} />

// Features: CRUD, Link to students, Contact management
```

### Assessment Definitions
```typescript
// Import
import { AssessmentDefinitionsList } from '@/pages/assessments/AssessmentDefinitionsList';

// Usage
<Route path="/assessments/definitions" element={<AssessmentDefinitionsList />} />

// Features: CRUD, Record results, Auto-grading
```

---

## Modal Components Quick Reference

### Subject Management
```typescript
import { SubjectFormModal } from '@/components/subjects/SubjectFormModal';
import { SubjectDetailsModal } from '@/components/subjects/SubjectDetailsModal';

// Form Modal
<SubjectFormModal 
  open={isOpen} 
  onOpenChange={setIsOpen}
  mode="create" | "edit"
  subject={selectedSubject}
/>

// Details Modal
<SubjectDetailsModal 
  open={isOpen}
  onOpenChange={setIsOpen}
  subject={subject}
/>
```

### Guardian Management
```typescript
import { GuardianFormModal } from '@/components/guardians/GuardianFormModal';
import { GuardianDetailsModal } from '@/components/guardians/GuardianDetailsModal';

// Form Modal
<GuardianFormModal 
  open={isOpen}
  onOpenChange={setIsOpen}
  mode="create" | "edit"
  guardian={selectedGuardian}
/>

// Details Modal  
<GuardianDetailsModal 
  open={isOpen}
  onOpenChange={setIsOpen}
  guardian={guardian}
/>
```

### Assessment Management
```typescript
import { AssessmentDefinitionFormModal } from '@/components/assessments/AssessmentDefinitionFormModal';
import { AssessmentResultsEntryModal } from '@/components/assessments/AssessmentResultsEntryModal';

// Definition Form
<AssessmentDefinitionFormModal 
  open={isOpen}
  onOpenChange={setIsOpen}
  mode="create" | "edit"
  assessment={selectedAssessment}
  termId={termId}
  classSubjectId={classSubjectId}
/>

// Results Entry
<AssessmentResultsEntryModal 
  open={isOpen}
  onOpenChange={setIsOpen}
  assessmentId={assessmentId}
  maxMarks={100}
  classId={classId}
/>
```

---

## Hook Usage Examples

### Subject Hooks
```typescript
import { 
  useSubjects, 
  useCreateSubject, 
  useUpdateSubject, 
  useDeleteSubject 
} from '@/hooks/use-subjects';

// List subjects
const { data, isLoading } = useSubjects({
  page: 1,
  pageSize: 10,
  search: 'Math'
});

// Create
const { mutate: createSubject } = useCreateSubject();
createSubject({ name: 'Mathematics', code: 'MAT', ... });

// Update
const { mutate: updateSubject } = useUpdateSubject();
updateSubject({ id: 'subj-1', data: { name: 'New Name' } });

// Delete
const { mutate: deleteSubject } = useDeleteSubject();
deleteSubject('subj-1');
```

### Guardian Hooks
```typescript
import { 
  useGuardians,
  useGuardiansByStudent,
  useCreateGuardian,
  useUpdateGuardian,
  useDeleteGuardian,
  useLinkGuardianToStudent
} from '@/hooks/use-guardians';

// List all guardians
const { data } = useGuardians({ page: 1, pageSize: 10 });

// Get guardians for student
const { data: guardians } = useGuardiansByStudent('student-123');

// Create guardian
const { mutate: create } = useCreateGuardian();
create({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', ... });

// Link to student
const { mutate: link } = useLinkGuardianToStudent();
link({ guardianId: 'g-1', studentId: 's-1' });
```

### Assessment Hooks
```typescript
import {
  useAssessmentDefinitions,
  useCreateAssessmentDefinition,
  useDeleteAssessmentDefinition,
  useCreateAssessmentResult
} from '@/hooks/use-assessments';

// List definitions
const { data } = useAssessmentDefinitions({ page: 1, pageSize: 10 });

// Create definition
const { mutate: createDef } = useCreateAssessmentDefinition();
createDef({ name: 'Midterm', type: 'GRADE_BASED', maxMarks: 100, ... });

// Record result
const { mutate: recordResult } = useCreateAssessmentResult();
recordResult({ 
  assessmentId: 'a-1', 
  studentId: 's-1', 
  marks: 85, 
  remarks: 'Good performance' 
});
```

---

## Service Methods Quick Lookup

### Subject Service
```typescript
import { subjectService } from '@/services/subject.service';

await subjectService.getAllSubjects({ page: 1, name: 'Math' });
await subjectService.createSubject({ name: 'Science', code: 'SCI', ... });
await subjectService.updateSubject('id', { name: 'New Name' });
await subjectService.deleteSubject('id');
```

### Guardian Service
```typescript
import { guardianService } from '@/services/guardian.service';

await guardianService.getAll({ page: 1, search: 'John' });
await guardianService.getById('guardian-id');
await guardianService.create({ firstName: 'John', ... });
await guardianService.update('id', { occupation: 'Teacher' });
await guardianService.delete('id');
await guardianService.linkToStudent('guardian-id', 'student-id');
await guardianService.getByStudent('student-id');
```

### Assessment Service
```typescript
import { assessmentService } from '@/services/assessment.service';

await assessmentService.createDefinition({ name: 'Test', type: 'GRADE_BASED', ... });
await assessmentService.getDefinitionById('id');
await assessmentService.updateDefinition('id', { name: 'Updated' });
await assessmentService.deleteDefinition('id');
await assessmentService.create({ studentId: 's-1', marks: 85, ... });
await assessmentService.getAll({ classId: 'c-1', termId: 't-1' });
```

### Sequence Service
```typescript
import { sequenceService } from '@/services/sequence.service';

// Preview next admission number
const preview = await sequenceService.preview('ADMISSION_NUMBER', 'school-1');
// Returns: { nextValue: 'STU/2024/00001' }

// Generate next
const generated = await sequenceService.generate('EMPLOYEE_NUMBER', 'school-1');

// Get history
const history = await sequenceService.getHistory('ADMISSION_NUMBER', 'school-1');

// Reset (admin only)
await sequenceService.reset('ADMISSION_NUMBER', 'school-1');
```

---

## Common Patterns

### Complete CRUD Example
```typescript
import { useState } from 'react';
import { useSubjects, useCreateSubject, useDeleteSubject } from '@/hooks/use-subjects';
import { SubjectFormModal } from '@/components/subjects/SubjectFormModal';

export function SubjectsManager() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  const { data: subjects, isLoading } = useSubjects({ page, pageSize: 10 });
  const { mutate: createSubject } = useCreateSubject();
  const { mutate: deleteSubject } = useDeleteSubject();

  const handleCreate = (data) => {
    createSubject(data, {
      onSuccess: () => setOpen(false)
    });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this subject?')) {
      deleteSubject(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Subject</Button>
      
      <DataTable 
        data={subjects?.data || []}
        columns={columns}
      />

      <SubjectFormModal 
        open={open}
        onOpenChange={setOpen}
        mode="create"
      />
    </>
  );
}
```

### Modal with Form State
```typescript
function MyModalComponent({ open, onOpenChange }) {
  const { mutate: create, isPending } = useCreateGuardian();
  const form = useForm({...});

  const onSubmit = (data) => {
    create(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Enum & Type Reference

### Assessment Types
```typescript
type AssessmentType = 'COMPETENCY' | 'GRADE_BASED' | 'HOLISTIC';
```

### Subject Categories
```typescript
type SubjectCategory = 'CORE' | 'ELECTIVE' | 'COMPETENCY';
```

### Curricula
```typescript
type Curriculum = '8_4_4' | 'CBC';
```

### Guardian Relationships
```typescript
type Relationship = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'UNCLE' | 'AUNT' | 'GRANDPARENT' | 'OTHER';
```

### Sequence Types
```typescript
type SequenceType = 
  | 'ADMISSION_NUMBER' 
  | 'EMPLOYEE_NUMBER' 
  | 'RECEIPT_NUMBER' 
  | 'INVOICE_NUMBER'
  | 'ASSESSMENT_NUMBER'
  | 'CLASS_CODE';
```

---

## Error Handling

All mutations include built-in error handling:

```typescript
const { mutate, isPending, error } = useCreateSubject();

mutate(data, {
  onSuccess: () => {
    // Auto toast.success shown
  },
  onError: (error) => {
    // Auto toast.error shown
    console.error(error.response?.data?.message);
  }
});
```

---

## Loading & Empty States

All list pages include:

```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data?.data?.length) return <EmptyState title="No items found" />;

return <DataTable data={data.data} columns={columns} />;
```

---

## Icons Used

```typescript
import {
  PlusCircle,    // Create button
  MoreHorizontal, // Action menu
  Edit,          // Edit action
  Trash,         // Delete action
  Eye,           // View details
  BarChart3,     // Assessment/Analytics
  Mail,          // Email contact
  Phone,         // Phone contact
  Building2,     // Organization
} from 'lucide-react';
```

---

## Testing Checklist Template

```typescript
describe('SubjectsList', () => {
  it('should display list of subjects', () => { /* ... */ });
  it('should open create modal', () => { /* ... */ });
  it('should submit form with valid data', () => { /* ... */ });
  it('should show confirmation on delete', () => { /* ... */ });
  it('should filter results by search', () => { /* ... */ });
  it('should paginate results', () => { /* ... */ });
  it('should handle API errors gracefully', () => { /* ... */ });
});
```

---

## Useful Links & Resources

- **Component Files:** `src/components/` subdirectories
- **Page Files:** `src/pages/` subdirectories  
- **Service Files:** `src/services/`
- **Hook Files:** `src/hooks/`
- **Type Definitions:** `src/types/index.ts`
- **Documentation:** See main documentation files

---

**Last Updated:** January 5, 2026  
**Version:** 1.0  
**Status:** Production Ready
