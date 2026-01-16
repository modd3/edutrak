# EduTrak — Kenyan School Management System

EduTrak is a multi-tenant School Management System (SMS) built to manage academic and administrative operations for Kenyan schools (Primary, Secondary, TVET, Special Needs). It provides role-based access for Super Admin, Admin, Teacher, Student and Parent and features student/teacher management, academic years, classes, subjects, assessments, reporting and more.

Key features
- Multi-tenant school support
- Role-based authentication and authorization (JWT)
- Student lifecycle: enrollment, promotion, transfer
- Teacher and guardian management
- Academic structure: Years, Terms, Classes, Streams
- Assessments, grading and reports
- Bulk user import (CSV)
- Sequential ID generation for admission numbers and other entities

Tech stack
- Backend: Node.js, TypeScript, Express, Prisma (PostgreSQL)
- Frontend: React 18, TypeScript, Vite, TanStack Query, Zustand, shadcn/ui, Tailwind CSS
- Other: JWT auth, Zod validation, Winston logging, Nodemailer, uuid

Repository layout
- frontend/ — React SPA (Vite + TypeScript)
- server/ — Express API, Prisma schema and services
- docs/ — design docs, guides and implementation notes
- docker-compose.yml — local development stack

Quick start (development)
1. Prerequisites: Node.js 18+, npm, PostgreSQL (or use docker-compose)
2. Clone the repo:
   git clone https://github.com/modd3/edutrak.git
   cd edutrak

Backend (server)
3. Copy env example and configure:
   cp server/.env.example server/.env
   # edit server/.env with DATABASE_URL and JWT secrets
4. Install and run:
   cd server
   npm install
   npx prisma migrate dev --name init
   npm run dev

Frontend
5. Configure frontend env:
   cp frontend/.env.example frontend/.env
6. Install and run:
   cd frontend
   npm install
   npm run dev

Docs and next steps
- See docs/project-outline.md and docs/FRONTEND_BUILD_GUIDE.md for architecture and development guidance.
- Recommended immediate actions: add CI (lint/test/build), complete API contract (OpenAPI/Swagger), add seed data and tests, secure env secrets and add deployment pipeline.

Contributing
- Please read docs/FRONTEND_BUILD_GUIDE.md and INTEGRATION_GUIDE.md before contributing.
- Open issues for any major changes and follow the repo's code style and TypeScript conventions.

License
- Licensed under the project's LICENSE file.