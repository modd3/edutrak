# EduTrak User Management System CRUD Operations

Complete CRUD operations for EduTrak user management system covering frontend React components, React Query hooks, API layer, and backend services with atomic database transactions.

## Key Flows

### 1. Single User Creation Flow
```mermaid
graph TD
    A[UserFormModal.onSubmit] --> B[useUsers Mutation]
    B --> C[API POST /users]
    C --> D[user-creation.controller]
    D --> E[user-creation.service - createUserWithProfile]
    E --> F[Database Transaction]
    F --> G[Create base user]
    F --> H[Create role profile]
```

### 2. User Listing and Filtering
```mermaid
graph TD
    A[UsersList Component] --> B[useUsers Hook]
    B --> C[API GET /users]
    C --> D[user.controller - getUsers]
    D --> E[user.service - getUsers]
    E --> F[Database Query]
```

### 3. User Update with Profile
```mermaid
graph TD
    A[UserFormModal] --> B[useUpdateUserWithProfile]
    B --> C[API PUT /users/:id]
    C --> D[user-creation.controller]
    D --> E[user-creation.service - updateUserWithProfile]
    E --> F[Database Transaction]
    F --> G[Update user]
    F --> H[Update role profile]
```

### 4. User Deactivation/Deletion
```mermaid
graph TD
    A[UsersList Action] --> B[useDeactivateUser]
    B --> C[API PATCH /users/:id/deactivate]
    C --> D[user.controller]
    D --> E[user.service - deactivateUser]
    E --> F[Database Update]
```

### 5. Bulk User Creation
```mermaid
graph TD
    A[BulkUserUploadModal] --> B[useBulkCreateUsers]
    B --> C[API POST /users/bulk]
    C --> D[user-creation.controller]
    D --> E[user-creation.service - bulkCreateUsersWithProfiles]
    E --> F[Loop: createUserWithProfile]
```

## Key Implementation Details

### Role-Specific Profile Creation
- Handled in `user-creation.service.ts`
- Uses Prisma transactions for atomic operations
- Supports multiple role types (STUDENT, TEACHER, GUARDIAN)
- Each role has its own profile table with specific fields

### Data Flow
1. Frontend collects user data and role-specific profile data
2. Data is sent to the backend in a single request
3. Backend validates and processes the data in a transaction
4. User and profile records are created/updated atomically

### Error Handling
- Transaction rollback on failure
- Detailed error messages for validation failures
- Bulk operations report individual failures without affecting successful operations

### Security
- Role-based access control
- Data validation at all layers
- Atomic operations to prevent data inconsistencies
