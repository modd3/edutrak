# EduTrak Feature Gap Matrix

## Summary
This document maps backend feature support to frontend implementation coverage, identifies current gaps, and proposes a prioritized next plan.

---

## 1. Backend feature support

### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-session`
- `POST /api/auth/validate-password`
- `GET /api/auth/profile`
- `POST /api/auth/change-password`

### Multi-tenant school management
- `POST /api/schools`
- `PUT /api/schools/:id`
- `DELETE /api/schools/:id`
- `GET /api/schools`
- `GET /api/schools/:id`
- `GET /api/schools/:id/branding`
- `PUT /api/schools/:id/branding`
- `GET /api/schools/:id/statistics`
- `GET /api/schools/:id/performance`

### Users
- `POST /api/users`
- `POST /api/users/bulk`
- `GET /api/users`
- `GET /api/users/stats`
- `GET /api/users/school/:id`
- `GET /api/users/profile`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/activate`
- `PATCH /api/users/:id/deactivate`

### Teachers
- `POST /api/teachers`
- `POST /api/teachers/with-user`
- `POST /api/teachers/assign-subject`
- `GET /api/teachers`
- `GET /api/teachers/:id`
- `GET /api/teachers/user/:userId`
- `GET /api/teachers/tsc/:tscNumber`
- `GET /api/teachers/:teacherId/workload`
- `GET /api/teachers/:teacherId/timetable`
- `GET /api/teachers/:teacherId/performance`
- `PUT /api/teachers/:id`

### Guardians
- `POST /api/guardians`
- `POST /api/guardians/with-user`
- `PATCH /api/guardians/set-primary`
- `DELETE /api/guardians/students/:studentId/guardians/:guardianId`
- `GET /api/guardians`
- `GET /api/guardians/:id`
- `GET /api/guardians/user/:userId`
- `GET /api/guardians/:guardianId/students`
- `GET /api/guardians/students/:studentId/guardians`
- `GET /api/guardians/:guardianId/notifications`
- `PUT /api/guardians/:id`

### Academic structure
- `POST /api/academic/years`
- `GET /api/academic/years`
- `GET /api/academic/years/active`
- `GET /api/academic/years/:id`
- `PATCH /api/academic/years/:id/activate`
- `POST /api/academic/terms`
- `GET /api/academic/terms/:id`
- `GET /api/academic/years/:academicYearId/terms`
- `POST /api/academic/classes`
- `POST /api/academic/classes/bulk`
- `GET /api/academic/classes`
- `GET /api/academic/classes/:id`
- `PATCH /api/academic/classes/:id`
- `POST /api/academic/streams`
- `GET /api/academic/streams/:id`
- `GET /api/academic/classes/:classId/streams`
- `PATCH /api/academic/streams/:id`
- `DELETE /api/academic/streams/:id`
- `GET /api/academic/statistics`
- `GET /api/academic/classes/:classId/performance`
- `GET /api/academic/overview`
- `POST /api/academic/years/clone-structure`
- `POST /api/academic/classes/bulk-promote`
- `POST /api/academic/classes/:classId/graduate`

### Class subject management
- `POST /api/academic/class-subject`
- `PATCH /api/academic/class-subject/:id/teacher`
- `GET /api/academic/class-subject/class/:classId`
- `GET /api/academic/class-subject/:classSubjectId/students`
- `GET /api/academic/class-subject/teacher/:teacherId`
- `POST /api/academic/class-subject/:classId/assign-core-subjects`

### Student lifecycle and enrollment
- `POST /api/students/enroll`
- `POST /api/students/promote`
- `POST /api/students/transfer`
- `GET /api/students/class/:classId`
- `GET /api/students/admission/:admissionNo`
- `GET /api/students/stats/overview`
- `GET /api/students`
- `GET /api/students/:id`
- `GET /api/students/:studentId/performance`
- `PUT /api/students/enrollment/:enrollmentId`
- `PATCH /api/students/:id/profile`
- `PATCH /api/students/enrollment/:enrollmentId/status`
- `DELETE /api/students/:id`

### Student class enrollment routes
- `POST /api/student-classes`
- `GET /api/student-classes/class/:classId/year/:academicYearId`
- `GET /api/student-classes/:id`
- `PUT /api/student-classes/:id`
- `POST /api/student-classes/promote`
- `POST /api/student-classes/transfer`
- `GET /api/student-classes/history/:studentId`

### Student subject enrollment (new relational model)
- `POST /api/academic/student-class-subject/enroll`
- `POST /api/academic/student-class-subject/bulk-enroll`
- `POST /api/academic/student-class-subject/drop`
- `GET /api/academic/student-class-subject/enrollment/:enrollmentId`
- `GET /api/academic/student-class-subject/available-subjects`
- `GET /api/academic/student-class-subject/students/:studentId`
- `GET /api/academic/student-class-subject/subject-roster`
- `GET /api/academic/student-class-subject/count`
- `PATCH /api/academic/student-class-subject/status`
- `PATCH /api/academic/student-class-subject/bulk-status`

### Strand management
- `POST /api/academic/class-subject-strand/assign`
- `POST /api/academic/class-subject-strand/bulk-assign`
- `GET /api/academic/class-subject-strand/class-subject`
- `GET /api/academic/class-subject-strand/strand/:strandId`
- `GET /api/academic/class-subject-strand/count`
- `DELETE /api/academic/class-subject-strand/remove`
- `GET /api/academic/class-subject-strand/validate`

### Assessment definitions and grading
- `POST /api/assessments`
- `POST /api/assessments/bulk`
- `GET /api/assessments`
- `GET /api/assessments/stats`
- `GET /api/assessments/class/:classId/term/:termId`
- `GET /api/assessments/class-subject/:classSubjectId`
- `GET /api/assessments/results`
- `GET /api/assessments/:id`
- `PUT /api/assessments/:id`
- `DELETE /api/assessments/:id`
- `POST /api/assessments/results`
- `POST /api/assessments/results/bulk`
- `POST /api/assessments/results/upload/:assessmentId`
- `PUT /api/assessments/results/:id`
- `DELETE /api/assessments/results/:id`
- `GET /api/assessments/reports/student/:studentId/term/:termId`
- `GET /api/assessments/reports/class/:classId/term/:termId`

### Fee management
- `POST /api/fees/structures`
- `POST /api/fees/structures/clone`
- `GET /api/fees/structures`
- `GET /api/fees/structures/:id`
- `PATCH /api/fees/structures/:id`
- `POST /api/fees/structures/:structureId/items`
- `PATCH /api/fees/items/:itemId`
- `DELETE /api/fees/items/:itemId`
- `POST /api/fees/invoices`
- `POST /api/fees/invoices/bulk`
- `GET /api/fees/invoices`
- `GET /api/fees/invoices/:id`
- `PATCH /api/fees/invoices/:id`
- `PATCH /api/fees/invoices/:id/cancel`
- `POST /api/fees/payments`
- `GET /api/fees/payments`
- `GET /api/fees/payments/:id`
- `PATCH /api/fees/payments/:id/reverse`
- `GET /api/fees/reports/collection`
- `GET /api/fees/reports/defaulters`

### Billing and subscriptions
- `PUT /api/billing-accounts`
- `GET /api/billing-accounts/school/:schoolId`
- `POST /api/billing/invoices`
- `GET /api/billing/invoices`
- `POST /api/billing/payments`
- `POST /api/subscriptions`
- `GET /api/subscriptions`
- `GET /api/subscriptions/:id`
- `PATCH /api/subscriptions/:id/status`

### Utility and admin support
- `GET /api/sequences/:type/preview`
- `GET /api/sequences/:type/current`
- `GET /api/sequences/:type/stats`
- `POST /api/sequences/:type/reset`
- `POST /api/sequences/:type/batch`

---

## 2. Frontend coverage status

### Fully wired frontend areas
- Authentication login page and profile handling
- `SchoolsList` page
- `UsersList` and bulk user flows
- `StudentsList`, `CreateStudent`, `EditStudent`, `StudentDetails`, `StudentEnrollments`, `SubjectEnrollment`
- `TeachersList` and teacher detail forms
- `ClassesList` and `StreamsList`
- `SubjectsList`, `SubjectOfferingsList`, `StudentSubjectManagementPage`
- `AcademicYearsPage`, `YearEndWizard`
- `AssessmentsPage`, `GradeEntryPage`, `ReportsPage`, `StrandManagementPage`, `ClassSubjectStrands`
- Fee management hub and related tabs: structures, invoices, payments, reports

### Partially implemented or inconsistent areas
- `BillingAdminPage` exists but is a raw API console and not a real UI workflow
- `Guardians` page exists in `frontend/src/pages/guardians/GuardiansList.tsx` and sidebar menu is configured, but `App.tsx` does not register `/guardians`
- `Subject offering` management appears implemented via services, but no explicit app route or page may cover all backend subject offering operations
- `Teacher workload`, `timetable`, and `performance` endpoints exist in backend but have no clear dedicated pages
- `School statistics` and `performance` endpoints are supported in backend but not clearly surfaced as pages
- `Subscriptions` backend is present with routes, but no frontend page or route exists
- `Sequence` endpoints are backend-only with no frontend UI
- `DocumentTemplate` and `UsageMetric` are backend-only support with no frontend UI

---

## 3. Mismatch and risk areas

### Path mismatches in frontend services
- `frontend/src/api/index.ts` exposes `assessmentApi.createDefinition` and `getDefinition` under `/assessments/definitions`, but backend uses `/api/assessments`
- `frontend/src/services/subject.service.ts` uses `/class-subject-strand/...` while backend expects `/api/academic/class-subject-strand/...`
- `frontend/src/hooks/use-student-subjects.ts` uses legacy or incorrect endpoints such as `/classes/${classId}/enrollments` and `/academic/class-subject/${classId}/assign-core-subjects`
- `frontend/src/services/class.service.ts` uses `/academic/classes/${id}/students` though backend route definitions do not expose that exact endpoint

### Potential functional inconsistencies
- `studentService.create` posts to `/users` instead of `/students`; this may be intentional for student user creation, but it is a semantic mismatch versus the dedicated student endpoint
- `aspect of assessment result entry` is tied to `assessmentApi` paths that do not match backend route definitions
- `class subject strand` service may fail because it omits the `/academic` prefix

### UI coverage gaps
- `Guardians` page is present in the sidebar but has no route binding in `App.tsx`
- `Billing` and subscription management is only available through a debug page rather than a structured admin interface
- Some backend endpoints are not used by any page or hook and may be stale or incomplete from the user experience

---

## 4. Prioritized next plan

### Immediate actions (critical)
1. **Align frontend API clients with backend routes**
   - Fix the assessment client paths
   - Fix class-subject-strand service paths
   - Fix legacy student-subject hook endpoints
   - Verify `classService.getStudents` path
2. **Add missing route registration**
   - Register `Route path="/guardians"` in `frontend/src/App.tsx`
3. **Replace raw billing console with structured UI or disable it until built**
   - Convert `BillingAdminPage.tsx` into a proper billing admin page or hide it from production navigation
4. **Verify customer-facing flows end to end**
   - School creation
   - Class/year setup
   - Student enrollment
   - Subject assignment
   - Assessment creation and grade entry
   - Invoice generation and payment recording

### Near-term deliverables (high value)
1. Build a dedicated **subscriptions management page**
2. Build **school statistics/performance** pages if product requirements require them
3. Add **teacher workload / timetable / performance** pages
4. Add a **Guardian management page** with create, update, primary assignment, student lookup, and notifications
5. Improve fee reports and defaulter workflow in the existing fee hub

### Important medium-term items
1. Add UI for **sequences** only if admin workflows need it
2. Add UI for **document templates** and **usage metrics** if reporting/document generation is part of the MVP
3. Add **OpenAPI/Swagger** or developer API contract documentation for backend routes and expected payloads
4. Add frontend route and service integration tests for all major flows

### Suggested backlog ordering
1. Fix broken/inconsistent API bindings (highest risk)
2. Wire the missing `Guardians` route
3. Stabilize fee/billing flows and remove debug-only pages
4. Add subscriptions page and related billing admin screens
5. Add teacher/report UI pages for backend analytics
6. Document remaining backend-only support areas and decide if they should be built or deprecated

---

## 5. Recommended action items for next task
- Create a small `frontend/src/pages/guardians/GuardiansListRoute.tsx` or simply add the route in `App.tsx`
- Refactor `frontend/src/api/assessment-api.ts` and associated hooks
- Refactor `frontend/src/services/subject.service.ts` / `frontend/src/hooks/use-class-subject-strand.ts`
- Audit `frontend/src/hooks/use-student-subjects.ts` and remove legacy path logic
- Review `frontend/src/pages/billing/BillingAdminPage.tsx` and evolve it into a real billing console

---

## 6. Notes
- The backend schema and route coverage are strong; the current priority is to align the frontend contract with the backend implementation.
- Once the route/client fixes are complete, the next focus should be on missing administrative UIs for guardians, subscriptions, and billing.
