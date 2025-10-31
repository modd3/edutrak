# EduTrak Frontend - AI Code Generation Guide (Vite + React)

This document contains all requirements, patterns, and example code for generating the complete EduTrak School Management System frontend using AI code generation tools with Vite, React, and shadcn/ui.

---

## 🎯 Project Overview

**Name**: EduTrak School Management System Frontend  
**Build Tool**: Vite  
**Framework**: React 18  
**Language**: TypeScript  
**Styling**: Tailwind CSS  
**UI Library**: shadcn/ui  
**Routing**: React Router v6  
**State Management**: Zustand (auth) + React Query (server state)  
**API Base URL**: `http://localhost:3001/api`

---

## 📋 Complete Package Dependencies

```json
{
  "name": "edutrak-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3",
    "@tanstack/react-query": "^5.28.0",
    "@tanstack/react-table": "^8.13.0",
    "axios": "^1.6.8",
    "zustand": "^4.5.2",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.6.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.363.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.2",
    "sonner": "^1.4.41",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.23",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.3",
    "vite": "^5.2.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19"
  }
}
```

---

## 📁 Project Structure

```
src/
├── main.tsx                      # App entry point
├── App.tsx                       # Main app component with routing
├── index.css                     # Global styles
│
├── pages/                        # Route pages
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── students/
│   │   ├── StudentsList.tsx
│   │   ├── StudentDetails.tsx
│   │   ├── CreateStudent.tsx
│   │   └── EditStudent.tsx
│   ├── teachers/
│   │   ├── TeachersList.tsx
│   │   ├── TeacherDetails.tsx
│   │   ├── CreateTeacher.tsx
│   │   └── EditTeacher.tsx
│   ├── classes/
│   │   ├── ClassesList.tsx
│   │   ├── ClassDetails.tsx
│   │   └── CreateClass.tsx
│   ├── assessments/
│   │   ├── AssessmentsList.tsx
│   │   ├── CreateAssessment.tsx
│   │   └── AssessmentDetails.tsx
│   ├── subjects/
│   │   ├── SubjectsList.tsx
│   │   └── CreateSubject.tsx
│   ├── academic-years/
│   │   ├── AcademicYearsList.tsx
│   │   └── CreateAcademicYear.tsx
│   ├── guardians/
│   │   ├── GuardiansList.tsx
│   │   └── GuardianDetails.tsx
│   ├── reports/
│   │   └── Reports.tsx
│   ├── settings/
│   │   └── Settings.tsx
│   └── schools/
│       ├── SchoolsList.tsx
│       ├── SchoolDetails.tsx
│       └── CreateSchool.tsx
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── toast.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── students/
│   │   ├── StudentForm.tsx
│   │   ├── StudentCard.tsx
│   │   └── EnrollmentForm.tsx
│   ├── teachers/
│   │   ├── TeacherForm.tsx
│   │   └── TeacherCard.tsx
│   ├── classes/
│   │   ├── ClassForm.tsx
│   │   └── ClassCard.tsx
│   ├── assessments/
│   │   ├── AssessmentForm.tsx
│   │   ├── CBCAssessmentForm.tsx
│   │   └── GradeCalculator.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── SearchFilter.tsx
│       ├── Pagination.tsx
│       └── StatsCard.tsx
│
├── lib/
│   ├── api-client.ts
│   ├── utils.ts
│   └── constants.ts
│
├── hooks/
│   ├── use-students.ts
│   ├── use-teachers.ts
│   ├── use-classes.ts
│   ├── use-assessments.ts
│   ├── use-subjects.ts
│   └── use-auth.ts
│
├── services/
│   ├── student.service.ts
│   ├── teacher.service.ts
│   ├── class.service.ts
│   ├── assessment.service.ts
│   ├── subject.service.ts
│   └── school.service.ts
│
├── store/
│   └── auth-store.ts
│
├── providers/
│   └── ReactQueryProvider.tsx
│
└── types/
    └── index.ts
```

---

## 🎨 Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### .env

```env
VITE_API_URL=http://localhost:3001/api
```

### index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EduTrak - School Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 🎨 Global Styles

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## 📦 Core Setup Files

### src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ReactQueryProvider } from './providers/ReactQueryProvider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </React.StrictMode>
);
```

### src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/students/StudentsList';
import StudentDetails from './pages/students/StudentDetails';
import CreateStudent from './pages/students/CreateStudent';
import EditStudent from './pages/students/EditStudent';
import TeachersList from './pages/teachers/TeachersList';
import TeacherDetails from './pages/teachers/TeacherDetails';
import CreateTeacher from './pages/teachers/CreateTeacher';
import ClassesList from './pages/classes/ClassesList';
import ClassDetails from './pages/classes/ClassDetails';
import CreateClass from './pages/classes/CreateClass';
import AssessmentsList from './pages/assessments/AssessmentsList';
import CreateAssessment from './pages/assessments/CreateAssessment';
import SubjectsList from './pages/subjects/SubjectsList';
import AcademicYearsList from './pages/academic-years/AcademicYearsList';
import GuardiansList from './pages/guardians/GuardiansList';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import SchoolsList from './pages/schools/SchoolsList';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Students Routes */}
          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/new" element={<CreateStudent />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/students/:id/edit" element={<EditStudent />} />
          
          {/* Teachers Routes */}
          <Route path="/teachers" element={<TeachersList />} />
          <Route path="/teachers/new" element={<CreateTeacher />} />
          <Route path="/teachers/:id" element={<TeacherDetails />} />
          
          {/* Classes Routes */}
          <Route path="/classes" element={<ClassesList />} />
          <Route path="/classes/new" element={<CreateClass />} />
          <Route path="/classes/:id" element={<ClassDetails />} />
          
          {/* Assessments Routes */}
          <Route path="/assessments" element={<AssessmentsList />} />
          <Route path="/assessments/new" element={<CreateAssessment />} />
          
          {/* Other Routes */}
          <Route path="/subjects" element={<SubjectsList />} />
          <Route path="/academic-years" element={<AcademicYearsList />} />
          <Route path="/guardians" element={<GuardiansList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/schools" element={<SchoolsList />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
```

---

## 📦 Core Library Files

### src/lib/api-client.ts

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}
```

### src/lib/constants.ts

```typescript
export const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans-Nzoia',
  'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira',
];

export const SCHOOL_TYPES = {
  PRIMARY: 'Primary',
  SECONDARY: 'Secondary',
  TVET: 'TVET',
  SPECIAL_NEEDS: 'Special Needs',
  PRE_PRIMARY: 'Pre-Primary',
};

export const CURRICULA = {
  CBC: 'CBC (Competency Based)',
  EIGHT_FOUR_FOUR: '8-4-4 System',
  TVET: 'TVET',
  IGCSE: 'IGCSE',
  IB: 'International Baccalaureate',
};

export const GENDERS = {
  MALE: 'Male',
  FEMALE: 'Female',
};

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent/Guardian',
  SUPPORT_STAFF: 'Support Staff',
};

export const ASSESSMENT_TYPES = {
  CAT: 'Continuous Assessment Test',
  MIDTERM: 'Mid-Term Exam',
  END_OF_TERM: 'End of Term Exam',
  MOCK: 'Mock Exam',
  NATIONAL_EXAM: 'National Exam',
  COMPETENCY_BASED: 'Competency Based',
};

export const COMPETENCY_LEVELS = {
  EXCEEDING_EXPECTATIONS: 'Exceeding Expectations',
  MEETING_EXPECTATIONS: 'Meeting Expectations',
  APPROACHING_EXPECTATIONS: 'Approaching Expectations',
  BELOW_EXPECTATIONS: 'Below Expectations',
};

export const LEARNING_AREAS = {
  LANGUAGES: 'Languages',
  MATHEMATICS: 'Mathematics',
  SCIENCE_TECHNOLOGY: 'Science & Technology',
  SOCIAL_STUDIES: 'Social Studies',
  RELIGIOUS_EDUCATION: 'Religious Education',
  CREATIVE_ARTS: 'Creative Arts & Sports',
  PHYSICAL_HEALTH_EDUCATION: 'Physical & Health Education',
  PRE_TECHNICAL_STUDIES: 'Pre-Technical Studies',
};

export const PATHWAYS = {
  STEM: 'STEM',
  ARTS_SPORTS: 'Arts & Sports Sciences',
  SOCIAL_SCIENCES: 'Social Sciences',
};
```

---

## 🔐 Types Definition

### src/types/index.ts

```typescript
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPPORT_STAFF';
export type SchoolType = 'PRIMARY' | 'SECONDARY' | 'TVET' | 'SPECIAL_NEEDS' | 'PRE_PRIMARY';
export type Curriculum = 'CBC' | 'EIGHT_FOUR_FOUR' | 'TVET' | 'IGCSE' | 'IB';
export type Gender = 'MALE' | 'FEMALE';
export type EnrollmentStatus = 'ACTIVE' | 'PROMOTED' | 'TRANSFERRED' | 'GRADUATED' | 'DROPPED_OUT' | 'SUSPENDED';
export type AssessmentType = 'CAT' | 'MIDTERM' | 'END_OF_TERM' | 'MOCK' | 'NATIONAL_EXAM' | 'COMPETENCY_BASED';
export type CompetencyLevel = 'EXCEEDING_EXPECTATIONS' | 'MEETING_EXPECTATIONS' | 'APPROACHING_EXPECTATIONS' | 'BELOW_EXPECTATIONS';
export type Ownership = 'PUBLIC' | 'PRIVATE' | 'FAITH_BASED' | 'NGO';
export type BoardingStatus = 'DAY' | 'BOARDING' | 'BOTH';
export type SchoolGender = 'BOYS' | 'GIRLS' | 'MIXED';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'BOM' | 'PTA';
export type SubjectCategory = 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'TECHNICAL' | 'APPLIED';
export type LearningArea = 'LANGUAGES' | 'MATHEMATICS' | 'SCIENCE_TECHNOLOGY' | 'SOCIAL_STUDIES' | 'RELIGIOUS_EDUCATION' | 'CREATIVE_ARTS' | 'PHYSICAL_HEALTH_EDUCATION' | 'PRE_TECHNICAL_STUDIES';
export type Pathway = 'STEM' | 'ARTS_SPORTS' | 'SOCIAL_SCIENCES';
export type TermName = 'TERM_1' | 'TERM_2' | 'TERM_3';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  tscNumber?: string;
  role: Role;
  schoolId?: number;
  school?: School;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  name: string;
  registrationNo?: string;
  type: SchoolType;
  county: string;
  subCounty?: string;
  ward?: string;
  knecCode?: string;
  nemisCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownership: Ownership;
  boardingStatus: BoardingStatus;
  gender: SchoolGender;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  admissionNo: string;
  upiNumber?: string;
  nemisUpi?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dob?: string;
  birthCertNo?: string;
  nationality?: string;
  county?: string;
  subCounty?: string;
  hasSpecialNeeds?: boolean;
  specialNeedsType?: string;
  medicalCondition?: string;
  allergies?: string;
  schoolId?: number;
  school?: School;
  userId?: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  tscNumber: string;
  employmentType: EmploymentType;
  qualification?: string;
  specialization?: string;
  dateJoined?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Guardian {
  id: number;
  userId: number;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: number;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: number;
  name: TermName;
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: number;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: number;
  name: string;
  level: string;
  curriculum: Curriculum;
  academicYearId: number;
  schoolId: number;
  classTeacherId?: number;
  pathway?: Pathway;
  school?: School;
  academicYear?: AcademicYear;
  classTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Stream {
  id: number;
  name: string;
  capacity?: number;
  classId: number;
  schoolId: number;
  streamTeacherId?: number;
  class?: Class;
  school?: School;
  streamTeacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  category: SubjectCategory;
  isCore: boolean;
  learningArea?: LearningArea;
  subjectGroup?: string;
  curriculum: Curriculum[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: number;
  name: string;
  type: AssessmentType;
  studentId: number;
  classSubjectId: number;
  termId: number;
  marksObtained?: number;
  maxMarks: number;
  competencyLevel?: CompetencyLevel;
  grade?: string;
  remarks?: string;
  assessedBy?: number;
  assessedDate?: string;
  student?: Student;
  term?: Term;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClass {
  id: number;
  studentId: number;
  classId: number;
  streamId?: number;
  academicYearId: number;
  status: EnrollmentStatus;
  selectedSubjects?: number[];
  promotedToId?: number;
  promotionDate?: string;
  transferredFrom?: string;
  transferDate?: string;
  student?: Student;
  class?: Class;
  stream?: Stream;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 🔐 Authentication Store

### src/store/auth-store.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import apiClient from '@/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await apiClient.post('/users/login', {
            email,
            password,
          });

          const { data } = response.data;
          logger.info(data);
          const token = 'mock_token'; // Replace with actual token from response

          localStorage.setItem('auth_token', token);

          set({
            user: data,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

---

## 🔌 React Query Provider

### src/providers/ReactQueryProvider.tsx

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 🎨 UI Components (shadcn/ui style)

### src/components/ui/button.tsx

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### src/components/ui/card.tsx

```typescript
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

### src/components/ui/input.tsx

```typescript
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### src/components/ui/label.tsx

```typescript
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

### src/components/ui/badge.tsx

```typescript
import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

---

## 🏗️ Layout Components

### src/components/layout/Sidebar.tsx

```typescript
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Settings,
  Building2,
  Calendar,
  UserCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: GraduationCap },
  { name: 'Teachers', href: '/teachers', icon: Users },
  { name: 'Classes', href: '/classes', icon: BookOpen },
  { name: 'Assessments', href: '/assessments', icon: ClipboardCheck },
  { name: 'Subjects', href: '/subjects', icon: FileText },
  { name: 'Guardians', href: '/guardians', icon: UserCircle },
  { name: 'Academic Years', href: '/academic-years', icon: Calendar },
  { name: 'Schools', href: '/schools', icon: Building2, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">EduTrak</h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### src/components/layout/Header.tsx

```typescript
import { Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students, teachers, classes..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

### src/components/layout/DashboardLayout.tsx

```typescript
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### src/components/layout/ProtectedRoute.tsx

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from './DashboardLayout';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
```

---

## 📄 Example Pages

### src/pages/Login.tsx

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">ET</span>
          </div>
          <CardTitle className="text-2xl">Welcome to EduTrak</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p>Email: admin@school.com</p>
            <p>Password: password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### src/pages/Dashboard.tsx

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<SchoolStats>({
    queryKey: ['school-stats', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeEnrollments: 0,
      };
      const response = await apiClient.get(`/schools/${user.schoolId}/statistics`);
      return response.data.data;
    },
    enabled: !!user?.schoolId,
  });

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Classes',
      value: stats?.totalClasses || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Enrollments',
      value: stats?.activeEnrollments || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}! Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: 'New student enrolled', time: '2 hours ago', color: 'bg-green-500' },
                { text: 'Assessment completed', time: '5 hours ago', color: 'bg-blue-500' },
                { text: 'New teacher assigned', time: '1 day ago', color: 'bg-purple-500' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Add New Student', 'Create Assessment', 'View Reports', 'Manage Classes'].map((action) => (
                <button
                  key={action}
                  className="w-full rounded-lg border p-3 text-left text-sm hover:bg-accent"
                >
                  {action}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 📚 Service Layer Example

### src/services/student.service.ts

```typescript
import apiClient from '@/lib/api-client';
import { Student, ApiResponse, PaginatedResponse } from '@/types';

export const studentService = {
  getAll: async (params?: {
    schoolId?: number;
    gender?: string;
    hasSpecialNeeds?: boolean;
  }): Promise<Student[]> => {
    const response = await apiClient.get<ApiResponse<Student[]>>('/students', { params });
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Student> => {
    const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<Student>): Promise<Student> => {
    const response = await apiClient.post<ApiResponse<Student>>('/students', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<Student>): Promise<Student> => {
    const response = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  enroll: async (data: {
    studentId: number;
    classId: number;
    streamId?: number;
    academicYearId: number;
    selectedSubjects?: number[];
  }): Promise<any> => {
    const response = await apiClient.post('/students/enroll', data);
    return response.data.data;
  },
};
```

---

## 🎣 Custom Hook Example

### src/hooks/use-students.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '@/services/student.service';
import { Student } from '@/types';
import { toast } from 'sonner';

export function useStudents(params?: { schoolId?: number }) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getAll(params),
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Student>) => studentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) =>
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
    },
  });
}
```

---

## 🎯 Requirements Summary

### **Pages to Generate:**

**Teachers Module:**
- `src/pages/teachers/TeachersList.tsx` - List with search/filter
- `src/pages/teachers/TeacherDetails.tsx` - View teacher profile, workload, timetable
- `src/pages/teachers/CreateTeacher.tsx` - Form with TSC number, qualifications
- `src/pages/teachers/EditTeacher.tsx` - Edit teacher details

**Classes Module:**
- `src/pages/classes/ClassesList.tsx` - List by curriculum type
- `src/pages/classes/ClassDetails.tsx` - View streams, students, subjects
- `src/pages/classes/CreateClass.tsx` - Form with curriculum selection (CBC/8-4-4)
- `src/pages/classes/EditClass.tsx` - Edit class details

**Assessments Module:**
- `src/pages/assessments/AssessmentsList.tsx` - Filter by type, term, class
- `src/pages/assessments/CreateAssessment.tsx` - Form with curriculum-specific options
- `src/pages/assessments/AssessmentDetails.tsx` - View marks, statistics
- `src/pages/assessments/BulkEntry.tsx` - Bulk mark entry for class

**Subjects Module:**
- `src/pages/subjects/SubjectsList.tsx` - Filter by curriculum, category
- `src/pages/subjects/CreateSubject.tsx` - Form with learning area/subject group

**Academic Years Module:**
- `src/pages/academic-years/AcademicYearsList.tsx` - List with terms
- `src/pages/academic-years/CreateAcademicYear.tsx` - Form with terms setup
- `src/pages/academic-years/TermManagement.tsx` - Manage term dates

**Guardians Module:**
- `src/pages/guardians/GuardiansList.tsx` - List with students
- `src/pages/guardians/GuardianDetails.tsx` - View linked students, contact info

**Schools Module (Admin):**
- `src/pages/schools/SchoolsList.tsx` - List all schools
- `src/pages/schools/SchoolDetails.tsx` - View statistics, users
- `src/pages/schools/CreateSchool.tsx` - Complete school setup form

**Reports Module:**
- `src/pages/reports/Reports.tsx` - Dashboard with report types
- `src/pages/reports/StudentReport.tsx` - Individual student report card
- `src/pages/reports/ClassReport.tsx` - Class performance report
- `src/pages/reports/TermReport.tsx` - Term-end reports

**Settings Module:**
- `src/pages/settings/Settings.tsx` - User profile, password change
- `src/pages/settings/SchoolSettings.tsx` - School configuration

**Student Module (Missing Pages):**
- `src/pages/students/StudentDetails.tsx` - View profile, enrollments, assessments, guardians
- `src/pages/students/EditStudent.tsx` - Edit student form

### **Services to Generate:**

```typescript
// src/services/teacher.service.ts - getAll, getById, create, update, assignSubject, getWorkload
// src/services/class.service.ts - getAll, getById, create, update, getStreams, getStudents
// src/services/assessment.service.ts - getAll, getById, create, update, bulkCreate, getStatistics
// src/services/subject.service.ts - getAll, getById, create, update, getByLearningArea
// src/services/school.service.ts - getAll, getById, create, update, getStatistics
// src/services/guardian.service.ts - getAll, getById, create, update, getStudents
// src/services/academic-year.service.ts - getAll, getById, create, setActive, createTerm
```

### **Hooks to Generate:**

```typescript
// src/hooks/use-teachers.ts - useTeachers, useTeacher, useCreateTeacher, useUpdateTeacher
// src/hooks/use-classes.ts - useClasses, useClass, useCreateClass, useStreams
// src/hooks/use-assessments.ts - useAssessments, useAssessment, useCreateAssessment, useBulkCreate
// src/hooks/use-subjects.ts - useSubjects, useSubject, useCreateSubject
// src/hooks/use-guardians.ts - useGuardians, useGuardian, useCreateGuardian
// src/hooks/use-academic-years.ts - useAcademicYears, useAcademicYear, useCreateYear, useTerms
// src/hooks/use-schools.ts - useSchools, useSchool, useCreateSchool
```

### **Feature Components to Generate:**

```typescript
// src/components/students/StudentForm.tsx - Reusable form component
// src/components/students/StudentCard.tsx - Student info card
// src/components/students/EnrollmentForm.tsx - Class enrollment form
// src/components/teachers/TeacherForm.tsx - Teacher creation/edit form
// src/components/teachers/TeacherCard.tsx - Teacher info card
// src/components/classes/ClassForm.tsx - Class creation form with curriculum options
// src/components/classes/ClassCard.tsx - Class summary card
// src/components/assessments/AssessmentForm.tsx - General assessment form
// src/components/assessments/CBCAssessmentForm.tsx - CBC competency levels form
// src/components/assessments/GradeCalculator.tsx - 8-4-4 grade calculator
// src/components/shared/DataTable.tsx - Reusable table with sorting/pagination
// src/components/shared/SearchFilter.tsx - Reusable search/filter component
// src/components/shared/Pagination.tsx - Pagination controls
// src/components/shared/StatsCard.tsx - Reusable stats display card
```

### **Additional UI Components:**

```typescript
// src/components/ui/table.tsx - Table component
// src/components/ui/dialog.tsx - Modal dialog
// src/components/ui/dropdown-menu.tsx - Dropdown menu
// src/components/ui/tabs.tsx - Tabs component
// src/components/ui/skeleton.tsx - Loading skeleton
```

### **Key Features to Implement:**

1. **Multi-Curriculum Support:** Toggle between CBC (competency-based) and 8-4-4 (grade-based) assessment forms
2. **Role-Based Access:** Hide admin routes from non-admin users
3. **Data Tables:** Sortable, filterable tables with pagination
4. **Form Validation:** Zod schemas for all forms
5. **Error Handling:** Toast notifications for all API operations
6. **Loading States:** Skeletons and spinners during data fetch
7. **Responsive Design:** Mobile-friendly layouts
8. **Search & Filter:** Debounced search, multi-select filters
9. **Bulk Operations:** Bulk assessment entry, bulk student import
10. **Report Generation:** PDF export for report cards