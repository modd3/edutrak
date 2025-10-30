# EduTrak Server Overview

This document provides a high-level overview of the EduTrak server-side application, its architecture, and its core modules. It is intended to help developers understand the project structure and key functionalities.

## 1. Project Goal

EduTrak is a comprehensive, multi-tenant School Management System (SMS) designed to manage all aspects of a school's academic and administrative operations. It supports various user roles (Super Admin, Admin, Teacher, Student, Parent) and provides features for managing students, teachers, academic years, classes, subjects, assessments, and more.

## 2. Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: (Likely) Express.js (inferred from the service-oriented architecture)
- **Database**: PostgreSQL (inferred from Prisma usage)
- **ORM**: Prisma Client
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: In-service validation logic
- **Logging**: Winston (inferred from `logger` utility)
- **Email**: Nodemailer or a similar service (inferred from `emailService`)
- **Unique IDs**: `uuid`

## 3. Architecture

The application follows a **Service-Oriented Architecture**. The core business logic is encapsulated within individual service classes, each responsible for a specific domain or data model. This promotes separation of concerns and makes the codebase modular and maintainable.

The main components are:

- **Database Client (`/database/client.ts`)**: A singleton instance of the Prisma client, ensuring a single connection pool is used throughout the application.
- **Services (`/services/*.service.ts`)**: These are the heart of the application, containing all business logic for interacting with the database models.
- **Utilities (`/utils/*.ts`)**: Helper functions for common tasks like password hashing, JWT generation, logging, and sending emails.
- **Controllers (Not Provided)**: It is assumed that there is a layer of controllers (e.g., Express routes) that handle incoming HTTP requests, validate input, and call the appropriate service methods.

## 4. Core Modules & Services

The application is divided into the following core modules, each managed by its own service:

### `user.service.ts`
- **Responsibilities**: User authentication, authorization, and profile management.
- **Key Features**:
  - User creation with role-based permissions (`validateUserCreation`).
  - Secure login with password hashing (`bcrypt`) and comparison.
  - JWT generation for session management.
  - Fetching a user's complete profile, including role-specific data (student, teacher, guardian).
  - Password and status updates.

### `school.service.ts`
- **Responsibilities**: Manages school entities, acting as the primary tenant in the system.
- **Key Features**:
  - School creation, restricted to `SUPER_ADMIN` users.
  - Retrieval of schools with filters and pagination.
  - Fetching detailed school profiles, including associated users, classes, and students.
  - Provides high-level statistics for a school (e.g., student/teacher counts).

### `academic.service.ts`
- **Responsibilities**: Defines the academic structure and timeline.
- **Key Features**:
  - Management of `AcademicYear`s, including setting the currently active year.
  - Management of `Term`s within an academic year.
  - Management of `Class`es and `Stream`s (sub-classes) for a given school and academic year.
  - Provides academic statistics and class performance metrics.

### `student.service.ts`
- **Responsibilities**: Manages the entire student lifecycle.
- **Key Features**:
  - Student creation, either with or without a corresponding user account.
  - Enrollment of students into classes.
  - Promotion of students to a new class.
  - Transfer of students between schools.
  - Association of guardians with students.
  - Retrieval of student performance data.

### `teacher.service.ts`
- **Responsibilities**: Manages teacher information and their academic duties.
- **Key Features**:
  - Teacher creation, linked to a user account.
  - Assignment of subjects to teachers for specific classes (`ClassSubject`).
  - Retrieval of teacher workload, timetable, and performance metrics.

### `guardian.service.ts`
- **Responsibilities**: Manages parent/guardian information and their relationship with students.
- **Key Features**:
  - Guardian creation, linked to a user account.
  - Setting a primary guardian for a student.
  - Retrieval of a guardian's associated students.
  - A mock notification system for student performance updates.

### `subject.service.ts`
- **Responsibilities**: Manages the curriculum and subjects offered.
- **Key Features**:
  - Creation of subjects with properties like curriculum type (`CBC`, `EIGHT_FOUR_FOUR`), category, and group.
  - Management of which subjects are offered by a school (`SubjectOffering`).
  - Retrieval of subjects based on curriculum or learning area.

### `assessment.service.ts`
- **Responsibilities**: Manages student assessments, grading, and report generation.
- **Key Features**:
  - Creation of individual or bulk assessments.
  - Automatic grade calculation based on marks and curriculum type.
  - Generation of detailed term reports for individual students and entire classes.
  - Calculation of term averages and subject-wise statistics.
  - Analysis of student performance trends over time.

## 5. Data Model Highlights

The Prisma schema (inferred from the services) uses several key models and relationships:

- **`User`**: A central model for any person logging into the system. It is linked one-to-one with role-specific models like `Student`, `Teacher`, or `Guardian`.
- **`School`**: The top-level entity for tenancy. Almost every other model is directly or indirectly linked to a `School`.
- **`Student`**: Contains student-specific personal and medical information. It is separate from the `User` model to allow for students who do not have login access.
- **`StudentClass`**: A crucial junction table representing a student's **enrollment** in a `Class` for a specific `AcademicYear`. It tracks their status (`ACTIVE`, `PROMOTED`, `TRANSFERRED`).
- **`ClassSubject`**: Another key junction table that represents a **teaching assignment**. It links a `Teacher`, `Subject`, `Class`, `Term`, and `AcademicYear`, forming the basis for timetables and assessments.
- **`Assessment`**: Stores the result of a single assessment for a `Student`. It is linked to a `ClassSubject` to provide context (who taught it, in what class/subject).
- **`StudentGuardian`**: A junction table linking `Student`s to `Guardian`s, and tracks who the `isPrimary` guardian is.

This relational structure allows for complex queries and detailed reporting, such as fetching all assessments for a student in a given term, or calculating a teacher's workload for an academic year.