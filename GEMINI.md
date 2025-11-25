# EduTrak Project Overview

This document provides a high-level overview of the EduTrak School Management System, its full-stack architecture, and its core modules. It is intended to help developers understand the project structure and key functionalities.

## 1. Project Goal

EduTrak is a comprehensive, multi-tenant School Management System (SMS) designed to manage all aspects of a Kenyan school's academic and administrative operations. It supports various user roles (Super Admin, Admin, Teacher, Student, Parent) and provides features for managing students, teachers, academic years, classes, subjects, assessments, and more.

## 2. Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma Client
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: `express-validator` and Zod
- **Logging**: Winston
- **Email**: Nodemailer
- **Unique IDs**: `uuid`

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**:
  - **Server Cache**: TanStack Query (React Query)
  - **Client State**: Zustand
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod for validation
- **HTTP Client**: Axios

## 3. Architecture

The project is a **monorepo** containing two main packages: `frontend` and `server`.

### Backend Architecture
The backend follows a **Service-Oriented Architecture**. The core business logic is encapsulated within individual service classes, each responsible for a specific domain. This promotes separation of concerns and makes the codebase modular and maintainable.

The main components are:
- **Database Client (`/server/src/database/client.ts`)**: A singleton instance of the Prisma client.
- **Routes (`/server/src/routes/*.ts`)**: Defines the API endpoints.
- **Controllers (`/server/src/controllers/*.ts`)**: Handles incoming HTTP requests, validates input, and calls the appropriate service methods.
- **Services (`/server/src/services/*.service.ts`)**: The core of the application, containing all business logic for interacting with the database models.
- **Middleware (`/server/src/middleware/*.ts`)**: Handles authentication, authorization, error handling, and school context enforcement for multi-tenancy.

### Frontend Architecture
The frontend is a modern React SPA (Single Page Application).
- **Domain-Driven Structure**: The `src` directory is organized by feature domains (e.g., `schools`, `users`, `students`), each containing related components, hooks, and pages.
- **Data Fetching**: TanStack Query (`@tanstack/react-query`) is used for all server data fetching, caching, and state management, managed through custom hooks (`/frontend/src/hooks/use-*.ts`).
- **Global State**: Zustand is used for managing global client-side state, such as authentication status (`/frontend/src/store/auth-store.ts`).
- **Component Library**: The UI is built with a combination of custom components and primitives from `shadcn/ui`.

## 4. Core Modules & Services

The application is divided into the following core modules, each managed by its own service on the backend:

### `auth.service.ts`
- **Responsibilities**: User authentication and session management.
- **Key Features**: Secure login, JWT generation, token refresh, and password management.

### `user.service.ts` & `user-creation.service.ts`
- **Responsibilities**: User CRUD operations and complex user creation logic.
- **Key Features**:
  - Creates users with their role-specific profiles (student, teacher, etc.) in a single atomic transaction.
  - Handles bulk user creation from CSV files.
  - Manages user activation/deactivation.

### `school.service.ts`
- **Responsibilities**: Manages school entities, the primary tenant in the system.
- **Key Features**: School creation, retrieval, and providing high-level statistics.

### `academic.service.ts`
- **Responsibilities**: Defines the academic structure and timeline.
- **Key Features**: Management of `AcademicYear`s, `Term`s, `Class`es, and `Stream`s.

### `student.service.ts`
- **Responsibilities**: Manages the entire student lifecycle.
- **Key Features**: Student creation, enrollment, promotion, and transfers.

### `teacher.service.ts`
- **Responsibilities**: Manages teacher information and academic duties.
- **Key Features**: Teacher creation and subject assignments.

### `guardian.service.ts`
- **Responsibilities**: Manages parent/guardian information.
- **Key Features**: Guardian creation and linking to students.

### `subject.service.ts`
- **Responsibilities**: Manages the curriculum and subjects.
- **Key Features**: Manages core subjects and school-specific `SubjectOffering`s.

### `assessment.service.ts`
- **Responsibilities**: Manages student assessments and grading.
- **Key Features**: Creation of assessments, grade calculation, and report generation.

### `sequence-generator.service.ts`
- **Responsibilities**: Generates unique, sequential, formatted IDs.
- **Key Features**: Creates identifiers like `STU-2024-0001` for admission numbers or employee numbers in a thread-safe manner.

## 5. Data Model Highlights

The Prisma schema (`server/prisma/schema.prisma`) is the source of truth for the data model. Key relationships include:

- **`User` & Profiles**: A central `User` model is linked one-to-one with role-specific models like `Student`, `Teacher`, or `Guardian`. This separates login credentials from detailed profile information.
- **`School` Tenancy**: The `School` model is the top-level entity. Nearly every other model is directly or indirectly linked to a `School` to ensure data isolation.
- **`StudentClass` Enrollment**: This is a crucial junction table representing a student's **enrollment** in a `Class` for a specific `AcademicYear`. It tracks their status (e.g., `ACTIVE`, `PROMOTED`).
- **`ClassSubject` Assignment**: This junction table represents a **teaching assignment**, linking a `Teacher`, `Subject`, and `Class` for a specific term and year. It's the foundation for timetables and assessments.
- **`AssessmentDefinition` & `AssessmentResult`**: Defines what an assessment is (`AssessmentDefinition`) and stores the individual outcome for each student (`AssessmentResult`). This separates the test from the scores.
- **`Sequence`**: A utility model used to generate unique, auto-incrementing numbers (e.g., admission numbers) scoped by school and/or year.

This relational structure allows for complex queries and detailed reporting, such as fetching all assessments for a student in a given term or calculating a teacher's workload for an academic year.