# Visual Component Status & Dependency Map

## 🎯 Component Status at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENT STATUS                        │
└─────────────────────────────────────────────────────────────────────┘

ENROLLMENT COMPONENTS
└─ EnrollStudentDialog ............................ ✅ READY
   └─ Uses: POST /student-classes
   └─ Status: Correct implementation
   
└─ StudentEnrollmentModal ......................... 🔴 CRITICAL FIX
   └─ Uses: POST /students/enroll (WRONG!)
   └─ Should: POST /student-classes
   └─ Action: Change 1 line of code

SUBJECT ASSIGNMENT COMPONENTS
└─ AssignSubjectDialog ........................... 🟡 VERIFY
   └─ Endpoint: POST /class-subjects/assign
   └─ Status: Need to confirm endpoint exists
   
└─ SubjectAssignmentModal ........................ 🟡 VERIFY
   └─ Endpoint: POST /class-subjects/assign
   └─ Status: Need to verify params include termId

GRADE ENTRY COMPONENTS
└─ GradeEntryTable ............................... 🔴 CRITICAL FIX
   └─ Issue: Not using subject roster
   └─ Action: Fetch from /academic/student-class-subject/subject-roster
   
└─ GradeEntryPage ................................ 🔴 CRITICAL FIX
   └─ Issue: useClassSubjectStudents unclear
   └─ Action: Verify or create useSubjectRoster hook
   
└─ AssessmentResultsEntryModal .................. 🔴 CRITICAL FIX
   └─ Issue: Shows all class students
   └─ Should: Show only subject-selected students
   └─ Action: Use subject roster endpoint

ASSESSMENT COMPONENTS
└─ AssessmentDefinitionFormModal ............... ✅ READY
   └─ Uses: POST /assessments/definitions
   └─ Status: Correct implementation

CLASS COMPONENTS
└─ ClassDetailsModal ............................ 🟡 VERIFY
   └─ Status: Verify useClassSubjects response structure

STUDENT COMPONENTS
└─ UserDetailsModal ............................. 🟡 VERIFY
   └─ Status: Verify enrollment relations included

┌─────────────────────────────────────────────────────────────────────┐
│ LEGEND: ✅ READY  🔴 CRITICAL FIX  🟡 VERIFY  ❌ CREATE  📦 READY TO USE
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Breakdown by Type

```
ENROLLMENT COMPONENTS (4)
├─ ✅ EnrollStudentDialog ..................... 1
├─ 🔴 StudentEnrollmentModal ................. 1
├─ 🟡 ClassDetailsModal ...................... 1
└─ 🟡 UserDetailsModal ....................... 1

SUBJECT COMPONENTS (2)
├─ 🟡 AssignSubjectDialog .................... 1
└─ 🟡 SubjectAssignmentModal ................. 1

ASSESSMENT COMPONENTS (1)
└─ ✅ AssessmentDefinitionFormModal ......... 1

GRADE ENTRY COMPONENTS (3)
├─ 🔴 GradeEntryTable ....................... 1
├─ 🔴 GradeEntryPage ........................ 1
└─ 🔴 AssessmentResultsEntryModal ........... 1

───────────────────────────────────
STATUS SUMMARY:
  ✅ Ready: 2 (20%)
  🔴 Critical: 4 (40%)
  🟡 Verify: 4 (40%)
  ❌ Create: 2 (missing components)
```

---

## 🔄 Component Dependency Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                      STUDENT JOURNEY FLOW                            │
└──────────────────────────────────────────────────────────────────────┘

STEP 1: ENROLLMENT
┌──────────────────────────────────────────┐
│  Student Enrollment UI                   │
├──────────────────────────────────────────┤
│  EnrollStudentDialog           ✅ READY  │
│  ↓                                        │
│  POST /student-classes         ✅ READY  │
│  ↓                                        │
│  StudentClass Created          ✅ OK     │
└──────────────────────────────────────────┘
     ↓
     └─→ OR
     
┌──────────────────────────────────────────┐
│  StudentEnrollmentModal         🔴 FIX   │
│  ↓                                        │
│  POST /students/enroll (WRONG!)          │
│  Should: POST /student-classes           │
└──────────────────────────────────────────┘


STEP 2: SUBJECT SELECTION (NEW)
┌──────────────────────────────────────────┐
│  Subject Selection UI                    │
├──────────────────────────────────────────┤
│  StudentSubjectSelectionModal  ❌ CREATE │
│  ↓                                        │
│  POST /academic/student-class-subject/   │
│      enroll                    📦 READY  │
│  ↓                                        │
│  StudentClassSubject Created   📦 READY  │
└──────────────────────────────────────────┘


STEP 3: GRADE ENTRY (TEACHER)
┌──────────────────────────────────────────┐
│  Grade Entry Pages                       │
├──────────────────────────────────────────┤
│  GradeEntryPage                🔴 FIX    │
│  ↓                                        │
│  GET /academic/student-class-subject/    │
│      subject-roster            🟡 VERIFY │
│  ↓                                        │
│  useSubjectRoster              ❌ CREATE │
│  ↓                                        │
│  GradeEntryTable               🔴 FIX    │
│  ↓                                        │
│  POST /grades/bulk             ✅ READY  │
└──────────────────────────────────────────┘
     
     
STEP 4: INDIVIDUAL GRADE ENTRY (ALT)
┌──────────────────────────────────────────┐
│  Assessment Results Entry                │
├──────────────────────────────────────────┤
│  AssessmentResultsEntryModal   🔴 FIX    │
│  ↓                                        │
│  Should use subject roster, not class    │
│  enrollments                             │
│  ↓                                        │
│  POST /assessment-results      ✅ READY  │
└──────────────────────────────────────────┘
```

---

## 🎣 Hook Dependency Graph

```
┌─────────────────────────────────────────┐
│          HOOK DEPENDENCIES              │
└─────────────────────────────────────────┘

GradeEntryPage
  ├─ useAssessment ........................ ✅
  ├─ useClassSubjectStudents ............. 🟡 VERIFY
  │   └─ Should use new endpoint
  └─ GradeEntryTable
       ├─ useAssessmentResults ........... ✅
       └─ useBulkGradeEntry ............. ✅

AssessmentResultsEntryModal
  ├─ useEnrollmentsByClass ............... 🔴 WRONG
  │   └─ Should use useSubjectRoster
  └─ useCreateAssessmentResult ........... ✅

SubjectAssignmentModal
  ├─ useSubjects ......................... ✅
  ├─ useTeachers ......................... ✅
  └─ useAssignSubject .................... 🟡 VERIFY

ClassDetailsModal
  ├─ useClassStreams ..................... ✅
  ├─ useClassSubjects .................... 🟡 VERIFY
  └─ useDeleteStream ..................... ✅

StudentEnrollmentModal
  ├─ useClasses .......................... ✅
  ├─ useClassStreams ..................... ✅
  ├─ useMutation (create) ................ 🔴 WRONG ENDPOINT
  └─ useUpdateEnrollment ................. ✅

EnrollStudentDialog
  ├─ useStudents ......................... ✅
  ├─ useClassStreams ..................... ✅
  ├─ useClassSubjects .................... ✅
  └─ useEnrollStudent .................... ✅

┌─────────────────────────────────────────┐
│     READY TO USE (NOT YET USED)         │
├─────────────────────────────────────────┤
│ useEnrollStudentInSubject .............. 📦
│ useBulkEnrollStudentsInSubject ......... 📦
│ useDropStudentFromSubject .............. 📦
│ studentClassSubjectApi ................. 📦
└─────────────────────────────────────────┘
```

---

## 📋 API Endpoint Matrix

```
┌────────────────────────────────────────────────────────────┐
│              API ENDPOINT USAGE MATRIX                      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ ENROLLMENT ENDPOINTS                                        │
│ ├─ POST /student-classes ..................... ✅ Used      │
│ ├─ GET /classes/{id}/enrollments ............ ✅ Used      │
│ ├─ PATCH /student-classes/{id} ............. ✅ Used      │
│ └─ DELETE /student-classes/{id} ............ ✅ Used      │
│                                                              │
│ SUBJECT ENDPOINTS                                           │
│ ├─ POST /class-subjects/assign ............. 🟡 Verify    │
│ ├─ GET /class-subjects ..................... 🟡 Verify    │
│ └─ GET /subjects ........................... ✅ Used      │
│                                                              │
│ ASSESSMENT ENDPOINTS                                        │
│ ├─ POST /assessments/definitions ........... ✅ Used      │
│ ├─ GET /assessments/{id} ................... ✅ Used      │
│ ├─ POST /assessment-results ................ ✅ Used      │
│ └─ GET /results ............................ ✅ Used      │
│                                                              │
│ GRADE ENDPOINTS                                             │
│ └─ POST /grades/bulk ....................... ✅ Used      │
│                                                              │
│ NEW SUBJECT ENDPOINTS (Not Used Yet)                        │
│ ├─ POST /academic/student-class-subject/    │              │
│ │  enroll .............................. 📦 Ready       │
│ ├─ POST /academic/student-class-subject/    │              │
│ │  bulk-enroll ......................... 📦 Ready       │
│ ├─ GET /academic/student-class-subject/     │              │
│ │  subject-roster ..................... 🔴 CRITICAL     │
│ └─ POST /academic/student-class-subject/    │              │
│    drop ................................ 📦 Ready       │
│                                                              │
│ WRONG/DEPRECATED ENDPOINTS                                 │
│ └─ POST /students/enroll ................... 🔴 REMOVE     │
│                                                              │
└────────────────────────────────────────────────────────────┘

Legend:
✅ = Currently working correctly
🔴 = Critical issue
🟡 = Needs verification
📦 = Ready to use but not integrated
```

---

## 🚀 Implementation Roadmap

```
┌────────────────────────────────────────────────────────┐
│           IMPLEMENTATION TIMELINE                      │
└────────────────────────────────────────────────────────┘

WEEK 1: FIX CRITICAL ISSUES (4-6 hrs)
├─ Day 1-2
│  ├─ 🔴 FIX #1: StudentEnrollmentModal endpoint .... 1h
│  ├─ 🔴 FIX #2: AssessmentResultsEntryModal ....... 1.5h
│  └─ 🔴 FIX #3: GradeEntryPage/useSubjectRoster ... 1.5h
│
└─ Day 3-4
   ├─ 📦 Create useSubjectRoster hook .............. 1h
   └─ ✅ Testing critical fixes ................... 1.5h


WEEK 2: IMPLEMENT NEW FEATURES (6-8 hrs)
├─ Day 1
│  └─ ❌ Create StudentSubjectSelectionModal ....... 2.5h
│
├─ Day 2
│  ├─ 📦 Integrate subject selection .............. 1.5h
│  └─ 🔄 Update enrollment workflow ............... 1.5h
│
└─ Day 3-4
   ├─ 🟡 Verify useClassSubjects data structure ... 1h
   └─ ✅ Integration testing ...................... 1.5h


WEEK 3: TESTING & VERIFICATION (8-10 hrs)
├─ Day 1
│  ├─ 🧪 Unit tests ............................ 2h
│  └─ 🧪 Integration tests ..................... 2h
│
├─ Day 2
│  └─ 🧪 End-to-end testing .................... 2.5h
│
├─ Day 3
│  └─ 🐛 Bug fixes & edge cases ................ 2h
│
└─ Day 4
   └─ 📝 Documentation & code review ........... 1.5h


TOTAL EFFORT: 18-24 hours (2-3 weeks)
```

---

## 📈 Priority Matrix

```
┌────────────────────────────────────────────────────────┐
│        PRIORITY vs EFFORT vs IMPACT MATRIX             │
└────────────────────────────────────────────────────────┘

              HIGH IMPACT
                   ▲
                   │
     CRITICAL      │      SUBJECT
     FIX #1        │      SELECTION
     (1h) •        │      (3h)  ●
              •    │   ●
              │    │ ●
     FIX #2  │    │ ●  VERIFICATION
     (1.5h)  │   │●   (varies)
              │  │
    FIX #3   │ ●
    (1.5h)   │●
              │  
    LOW      │
              └─────────────────────────────►
                  LOW EFFORT    HIGH EFFORT


Order of Implementation:
1. 🔴 Fix #1 - StudentEnrollmentModal (1h, HIGH impact)
2. 🔴 Fix #2 - AssessmentResultsEntryModal (1.5h, HIGH impact)
3. 🔴 Fix #3 - GradeEntryPage (1.5h, HIGH impact)
4. 🟡 Verify - Hook dependencies (varies)
5. 📦 Create - useSubjectRoster (1h, MEDIUM impact)
6. ❌ Create - StudentSubjectSelectionModal (2.5h, MEDIUM impact)
7. ✅ Test - End-to-end (2.5h, HIGH impact)
```

---

## ⚡ Quick Fix Difficulty Levels

```
┌────────────────────────────────────────┐
│     DIFFICULTY ASSESSMENT              │
└────────────────────────────────────────┘

🔴 CRITICAL FIXES

FIX #1: StudentEnrollmentModal
  Difficulty: ⭐ (1/5) - EASIEST
  Action: Change 1 endpoint URL
  Time: 15 minutes
  Files: 1 component file
  Tests: Run enrollment flow

FIX #2: AssessmentResultsEntryModal
  Difficulty: ⭐⭐ (2/5) - EASY
  Action: Replace hook usage
  Time: 45 minutes
  Files: 1 component file + verify new hook
  Tests: Run grade entry with different students

FIX #3: GradeEntryPage
  Difficulty: ⭐⭐⭐ (3/5) - MEDIUM
  Action: Create/verify useSubjectRoster hook
  Time: 1.5 hours
  Files: 1 component + 1 new hook
  Tests: Verify correct students shown


❌ CREATE NEW COMPONENTS

Create useSubjectRoster
  Difficulty: ⭐ (1/5) - EASIEST
  Action: New React Query hook
  Time: 30 minutes
  Files: 1 new file
  Template: Available in CODE_FIXES.md

Create StudentSubjectSelectionModal
  Difficulty: ⭐⭐⭐⭐ (4/5) - HARD
  Action: New component with modal + form
  Time: 2.5 hours
  Files: 1 new component file
  Template: Available in CODE_FIXES.md


🟡 VERIFICATION

Verify useClassSubjects
  Difficulty: ⭐⭐ (2/5) - EASY
  Action: Run query, inspect response
  Time: 30 minutes
  Tests: Console.log response structure

Verify AssignSubjectDialog
  Difficulty: ⭐⭐ (2/5) - EASY
  Action: Check endpoint exists
  Time: 30 minutes
  Tests: Manual test subject assignment

Overall Difficulty: ⭐⭐⭐ (3/5) - MEDIUM
(Mostly straightforward changes, one harder component)
```

---

## 🔍 Testing Scenarios

```
┌──────────────────────────────────────────────────────┐
│         MANUAL TESTING SCENARIOS                     │
└──────────────────────────────────────────────────────┘

TEST SCENARIO 1: Basic Enrollment Flow
├─ Action: Enroll student in class
├─ Component: EnrollStudentDialog / StudentEnrollmentModal
├─ Expected: Student appears in class roster
├─ Status: ✅ SHOULD WORK (after fixes)
└─ Checklist:
   □ Student can be enrolled
   □ Stream selection works (optional)
   □ Enrollment saved correctly


TEST SCENARIO 2: Subject Selection (NEW)
├─ Action: Student selects subjects
├─ Component: StudentSubjectSelectionModal (TO CREATE)
├─ Expected: Subjects saved, show in student record
├─ Status: ❌ NEEDS IMPLEMENTATION
└─ Checklist:
   □ Subject list loads correctly
   □ Checkboxes work
   □ Submit saves selections
   □ Compulsory subjects marked


TEST SCENARIO 3: Grade Entry with Subject Roster
├─ Action: Teacher enters grades
├─ Component: GradeEntryPage + GradeEntryTable
├─ Expected: Only subject-selected students shown
├─ Status: 🔴 NEEDS FIX
└─ Checklist:
   □ Correct students shown
   □ No all-class students visible
   □ Grades save correctly
   □ Bulk entry works


TEST SCENARIO 4: Individual Grade Entry
├─ Action: Teacher enters single grade
├─ Component: AssessmentResultsEntryModal
├─ Expected: Only subject students available
├─ Status: 🔴 NEEDS FIX
└─ Checklist:
   □ Student dropdown filtered by subject
   □ Marks validation works
   □ Grade saves correctly


TEST SCENARIO 5: Subject Assignments (VERIFY)
├─ Action: Admin assigns subjects to class
├─ Component: AssignSubjectDialog / SubjectAssignmentModal
├─ Expected: Subject appears in class
├─ Status: 🟡 NEEDS VERIFICATION
└─ Checklist:
   □ Subject list loads
   □ Category/term selection works
   □ Teacher assignment works (optional)
   □ Subject shows in class details


TEST SCENARIO 6: Edge Cases
├─ Student with no subjects → Grades blocked
├─ Subject with no students → Empty roster
├─ Student drops subject → Removed from roster
├─ New subject added late → Appears in list
└─ Multiple subjects per class → All shown
```

---

## 💾 Backup & Safety

```
┌──────────────────────────────────────────────────────┐
│         BEFORE YOU START CODING                      │
└──────────────────────────────────────────────────────┘

BACKUP CHECKLIST:
  □ Git commit current state
  □ Create feature branch
  □ Document baseline metrics
  □ Backup database (if applicable)

VERSION CONTROL:
  □ Create PR for each component fix
  □ One commit per logical change
  □ Clear commit messages
  □ Link to relevant docs

TESTING CHECKLIST:
  □ Test locally before push
  □ Run linter/type checker
  □ Test in different browsers
  □ Document test results

CODE REVIEW:
  □ Self review before PR
  □ Get peer review
  □ Address feedback
  □ Final verification test
```

---

**End of Visual Summary**

*Refer to detailed documentation files for complete information.*

