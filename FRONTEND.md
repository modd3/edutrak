# EduTrak Frontend Generation Guide

This document provides a detailed guide for an AI model to generate the frontend for the EduTrak School Management System. The frontend should be a modern, responsive, and user-friendly single-page application (SPA) built with React and TypeScript.

## 1. Core Objective

The goal is to create a multi-tenant frontend that interacts with the existing EduTrak Node.js/Express backend. It must support different user roles (Super Admin, Admin, Teacher, Student, Parent) and provide a user-friendly interface for managing all aspects of the school system.

## 2. Technology Stack

-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Routing**: React Router v6
-   **State Management**:
    -   **Server Cache**: TanStack Query (React Query) for all data fetching, caching, and mutations.
    -   **Client State**: Zustand for managing global client-side state (e.g., auth status, user info).
-   **UI Library**: **shadcn/ui** - Use this for all UI components (Buttons, Forms, Tables, Modals, etc.).
-   **Styling**: Tailwind CSS.
-   **Forms**: React Hook Form with Zod for validation.
-   **HTTP Client**: Axios, configured with interceptors for auth tokens and error handling.
-   **Icons**: `lucide-react`.

## 3. Project Structure (Domain-Driven)

Organize the `frontend/src` directory by feature domains to ensure scalability and maintainability.

```
/frontend/src
├── api/                # Axios instance and API service definitions
│   ├── api.ts
│   ├── academic.service.ts
│   ├── assessment.service.ts
│   ├── auth.service.ts
│   ├── school.service.ts
│   ├── student.service.ts
│   ├── teacher.service.ts
│   └── user.service.ts
├── components/         # Reusable UI components
│   ├── layout/         # Dashboard layout, Header, Sidebar, etc.
│   ├── shared/         # Common components (DataTable, PageHeader, etc.)
│   └── ui/             # Components from shadcn/ui
├── config/             # Application configuration
│   └── sidebarConfig.ts # Sidebar navigation links for different roles
├── hooks/              # Custom hooks, especially for TanStack Query
│   ├── useAuth.ts
│   ├── useSchools.ts
│   ├── useStudents.ts
│   └── ... (one for each domain)
├── lib/                # Utility functions and constants
│   ├── utils.ts        # General utility functions
│   └── validators.ts   # Zod validation schemas
├── pages/              # Top-level page components
│   ├── auth/
│   │   └── Login.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── schools/
│   │   ├── SchoolListPage.tsx
│   │   └── SchoolDetailsPage.tsx
│   ├── students/
│   │   ├── StudentListPage.tsx
│   │   └── StudentProfilePage.tsx
│   └── ... (one for each main domain)
├── providers/          # React Context providers
│   └── AppProviders.tsx # Combine all providers here
├── router/             # React Router configuration
│   └── index.ts
├── store/              # Zustand store for global state
│   └── authStore.ts
├── types/              # TypeScript type definitions
│   └── index.ts        # All backend types mirrored from Prisma schema
└── main.tsx            # Application entry point
```

## 4. Implementation Steps

### Step 1: Project Setup

1.  **Initialize Vite**: Create a new React + TypeScript project using Vite.
2.  **Install Dependencies**: Install all the libraries listed in the technology stack.
3.  **Setup `shadcn/ui`**: Initialize shadcn/ui, which will create the `components/ui` directory and `lib/utils.ts`.
4.  **Configure Tailwind CSS**: Ensure `tailwind.config.js` is set up correctly.
5.  **Create Folder Structure**: Create the directory structure as defined above.

### Step 2: Authentication & Core Layout

1.  **Create `api.ts`**:
    -   Create an Axios instance.
    -   Add an interceptor to attach the JWT token from Zustand to the `Authorization` header of every request.
    -   Add another interceptor to handle 401 errors by logging the user out.

2.  **Create `authStore.ts` (Zustand)**:
    -   Create a store to manage `user`, `token`, `isAuthenticated`.
    -   Include actions for `login`, `logout`, and `setUser`.
    -   Persist the store to `localStorage` so the user remains logged in after a refresh.

3.  **Create `auth.service.ts` & `useAuth.ts` hook**:
    -   The service will have a `login` function that calls the `POST /api/auth/login` endpoint.
    -   The `useAuth` hook will use TanStack Query's `useMutation` to call the login service. On success, it should update the Zustand store.

4.  **Create Login Page (`/pages/auth/Login.tsx`)**:
    -   Build a login form using `shadcn/ui` components (`Card`, `Input`, `Button`, `Label`).
    -   Use `react-hook-form` and `zod` for form state management and validation.
    -   On submit, call the `login` mutation from the `useAuth` hook. Display loading and error states.

5.  **Create `DashboardLayout.tsx`**:
    -   This component will be the main layout for the authenticated app.
    -   It should contain a `Header`, a `Sidebar`, and a main content area to render child routes.

6.  **Create `Sidebar.tsx`**:
    -   The sidebar should render navigation links based on the user's role.
    -   Create `sidebarConfig.ts` to define the navigation structure for each role (`SUPER_ADMIN`, `ADMIN`, `TEACHER`).
    -   Use `lucide-react` for icons next to the navigation links.

7.  **Setup Routing (`router/index.ts`)**:
    -   Use `createBrowserRouter` from React Router.
    -   Create a `ProtectedRoute` component that checks `isAuthenticated` from the Zustand store. If not authenticated, redirect to `/login`.
    -   Define the following routes:
        -   `/login` (public)
        -   `/` (protected, wrapped in `DashboardLayout`)
        -   Nested routes for all other features (e.g., `/schools`, `/students/:id`).

### Step 3: School Management Module (For Super Admins)

1.  **Define Types**: In `types/index.ts`, add TypeScript interfaces for `School`, `User`, `AcademicYear`, etc., mirroring the Prisma schema.

2.  **API Service (`school.service.ts`)**: Create functions to call all school-related endpoints:
    -   `getSchools(params)`
    -   `getSchoolById(id)`
    -   `createSchool(data)`
    -   `updateSchool(id, data)`

3.  **TanStack Query Hook (`useSchools.ts`)**:
    -   `useSchools()`: `useQuery` to fetch all schools. It should support pagination and filtering.
    -   `useSchool(id)`: `useQuery` to fetch a single school by ID.
    -   `useCreateSchool()`: `useMutation` for creating schools. On success, it must invalidate the `schools` query to refetch the list.
    -   `useUpdateSchool()`: `useMutation` for updating schools. Invalidate both `schools` and `school(id)` queries on success.

4.  **Create `SchoolListPage.tsx`**:
    -   Use `shadcn/ui`'s `DataTable` component. You will need to create a `columns.tsx` file to define the table columns (Name, Type, County, etc.) and an "Actions" dropdown (`DropdownMenu`) for each row with "View Details" and "Edit" options.
    -   Add a "Create School" button that opens a `Dialog` or `Sheet` containing the `SchoolForm`.
    -   Implement server-side pagination and filtering for the data table.

5.  **Create `SchoolForm.tsx`**:
    -   A form built with `react-hook-form`, `zod`, and `shadcn/ui` components (`Input`, `Select` for enums like `SchoolType`, `Ownership`).
    -   Use this form for both creating and editing a school.

6.  **Create `SchoolDetailsPage.tsx`**:
    -   Display detailed information about a single school.
    -   Use a tabbed interface (`Tabs` component) to show:
        -   **Overview**: Basic school details.
        -   **Users**: A data table of users in that school.
        -   **Classes**: A data table of classes for the active academic year.
        -   **Statistics**: Display stats from the `GET /api/schools/:id/statistics` endpoint.

### Step 4: Implement Other Modules

Follow the same pattern as the School Management module for all other domains. For each domain (Students, Teachers, Academics, Assessments):

1.  **API Service**: Create a `*.service.ts` file with functions for every related API endpoint.
2.  **TanStack Query Hook**: Create a `use*.ts` hook with `useQuery` and `useMutation` hooks. Remember to set up query invalidation to ensure data freshness after mutations.
3.  **Pages & Components**:
    -   Build list pages with `DataTable`.
    -   Build details/profile pages.
    -   Build forms for creation and editing, often inside a `Dialog` or `Sheet`.

### Key Feature Implementation Suggestions

-   **Student Enrollment**: In the `ClassDetailsPage`, have a button "Enroll Student". This should open a dialog where the admin can search for an existing student and enroll them in the class, calling `POST /api/students/enroll`.
-   **Teacher Assignment**: In the `ClassDetailsPage`, under a "Subjects" tab, list the subjects. Each subject should have a button to "Assign Teacher", which opens a dialog to select from a list of available teachers.
-   **Assessments**:
    -   On the `ClassDetailsPage`, under an "Assessments" tab, allow teachers to create a new "Assessment Definition" (`POST /api/assessments/definitions`).
    -   Once defined, this should navigate to a page where the teacher can input results for all students in that class, using a `DataTable` where each row is a student and columns are for `marks` or `competencyLevel`. Use `useMutation` to save results in bulk (`POST /api/assessments/results/bulk`).
-   **Dashboard (`Dashboard.tsx`)**:
    -   This should be the main landing page after login.
    -   It must display different widgets based on the user's role.
    -   **Admin Dashboard**: Show key stats like total students, teachers, enrollment numbers by class, and shortcuts to common actions.
    -   **Teacher Dashboard**: Show the teacher's assigned classes, upcoming lessons (if timetable data is available), and recent assessment results.

## 5. Next Steps for Implementation

1.  **Build the Foundation**: Complete Step 1 and Step 2 (Project Setup, Auth, Layout). This is the most critical part.
2.  **Implement User & School Management**: Fully implement the user and school management modules as they are central to the system's administration.
3.  **Implement Academic Structure**: Build the UI for managing Academic Years, Terms, and Classes. This is a prerequisite for student enrollment and assessments.
4.  **Implement Student & Teacher Modules**: Create the pages and forms for managing students and teachers.
5.  **Implement Assessment Module**: This is a complex module. Start with creating assessment definitions, then move to entering results, and finally generating reports.
6.  **Refine and Polish**: Add loading states (skeletons), empty states, and detailed error messages throughout the application. Ensure all forms have proper validation and user feedback.
7.  **Build Role-Specific Dashboards**: Create the role-specific dashboard experiences.

By following this guide, the AI model will be able to systematically generate a robust and maintainable frontend application that correctly interfaces with the provided backend.
