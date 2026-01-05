# Integration Guide for New Frontend Components

## Step-by-Step Integration Instructions

### 1. Update Router Configuration

Add the following routes to your router configuration (typically in `src/router/index.tsx` or similar):

```typescript
import { SubjectsList } from '@/pages/subjects/SubjectsList';
import { GuardiansList } from '@/pages/guardians/GuardiansList';
import { AssessmentDefinitionsList } from '@/pages/assessments/AssessmentDefinitionsList';

// In your route definitions:
{
  path: '/subjects',
  element: <SubjectsList />,
  requiresAuth: true,
  roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER']
},
{
  path: '/guardians',
  element: <GuardiansList />,
  requiresAuth: true,
  roles: ['SUPER_ADMIN', 'ADMIN']
},
{
  path: '/assessments/definitions',
  element: <AssessmentDefinitionsList />,
  requiresAuth: true,
  roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER']
}
```

### 2. Update Sidebar Navigation

Update `src/config/sidebarConfig.ts` to include new menu items:

```typescript
{
  label: 'Academic',
  icon: BookOpen,
  items: [
    {
      label: 'Subjects',
      href: '/subjects',
      icon: BookMarked,
      description: 'Manage curriculum subjects',
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER']
    },
    {
      label: 'Assessment Definitions',
      href: '/assessments/definitions',
      icon: BarChart3,
      description: 'Create and manage assessments',
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER']
    }
  ]
},
{
  label: 'People',
  icon: Users,
  items: [
    // ... existing items
    {
      label: 'Guardians',
      href: '/guardians',
      icon: UserCheck,
      description: 'Manage student guardians/parents',
      roles: ['SUPER_ADMIN', 'ADMIN']
    }
  ]
}
```

### 3. Install Required Icons (if missing)

All icons are from `lucide-react`. Ensure these are imported in your sidebar config:

```typescript
import {
  BookMarked,
  BarChart3,
  UserCheck,
} from 'lucide-react';
```

### 4. Type Definitions

Ensure these types are exported from `src/types/index.ts`:

```typescript
export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'CORE' | 'ELECTIVE' | 'COMPETENCY';
  learningArea?: string;
  subjectGroup?: string;
  curriculum: ('8_4_4' | 'CBC')[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guardian {
  id: string;
  userId: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentDefinition {
  id: string;
  name: string;
  type: 'COMPETENCY' | 'GRADE_BASED' | 'HOLISTIC';
  maxMarks?: number;
  termId: string;
  classSubjectId: string;
  strandId?: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Update API Client Configuration

Ensure your API client (likely `src/lib/api-client.ts` or `src/api/index.ts`) is properly configured with:

```typescript
// Axios instance with proper base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 6. Environment Variables

Ensure you have the correct environment variables in `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=EduTrak
VITE_APP_DESCRIPTION=School Management System
```

### 7. Testing the Integration

#### Test Subjects Management
```bash
# Navigate to /subjects and verify:
1. List displays correctly
2. Create button opens form modal
3. Edit functionality works
4. Delete shows confirmation
5. Search filters results
```

#### Test Guardians Management
```bash
# Navigate to /guardians and verify:
1. List displays with contact info
2. Create opens form with all fields
3. Email and phone links work
4. Edit updates guardian
5. Delete removes guardian
```

#### Test Assessment Definitions
```bash
# Navigate to /assessments/definitions and verify:
1. List shows all assessments
2. Create links to class subjects
3. Record results modal opens
4. Auto-calculation of grades works
5. Delete removes assessment
```

### 8. API Endpoint Verification

Before running the application, verify these endpoints exist in your backend:

**Subjects:**
```
POST   /api/subjects/core
GET    /api/subjects/core
GET    /api/subjects/core/{id}
PUT    /api/subjects/core/{id}
DELETE /api/subjects/core/{id}
```

**Guardians:**
```
POST   /api/guardians
GET    /api/guardians
GET    /api/guardians/{id}
PUT    /api/guardians/{id}
DELETE /api/guardians/{id}
POST   /api/guardians/{id}/link-student
POST   /api/guardians/{id}/unlink-student
GET    /api/students/{id}/guardians
```

**Assessments:**
```
POST   /api/assessments/definitions
GET    /api/assessments/definitions
GET    /api/assessments/definitions/{id}
PUT    /api/assessments/definitions/{id}
DELETE /api/assessments/definitions/{id}
POST   /api/assessments/results
GET    /api/assessments/results
```

**Sequences:**
```
GET    /api/sequences/{type}/preview
POST   /api/sequences/generate
GET    /api/sequences/history
POST   /api/sequences/reset
```

### 9. Common Issues & Solutions

#### Issue: "Cannot find module '@/components/...'"
**Solution:** Ensure your TypeScript path alias is configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### Issue: "API endpoint returns 404"
**Solution:** Verify the backend routes are implemented and the API base URL is correct in your `.env`

#### Issue: "Types are not recognized"
**Solution:** Ensure all types are properly exported from `src/types/index.ts` and the imports use correct paths

#### Issue: "Modal doesn't close after submission"
**Solution:** Verify the mutation's `onSuccess` callback properly calls `onOpenChange(false)`

### 10. Performance Optimization Tips

1. **Enable Query Caching**
   - React Query caches are already configured
   - Adjust staleTime and cacheTime in hook options as needed

2. **Lazy Load Components**
   - Use React.lazy() for modal components
   - Wrap with Suspense boundaries

3. **Pagination**
   - Implement on list pages to limit data fetching
   - Default pageSize set to 10, adjustable

4. **Search Debouncing**
   - Add debounce to search inputs to reduce API calls
   - Currently implemented with immediate state updates

### 11. Security Considerations

1. **Authentication**
   - All pages require authentication (verify in route protection)
   - Tokens stored securely (HTTP-only cookies preferred)

2. **Authorization**
   - Role-based access control implemented
   - SUPER_ADMIN and ADMIN roles needed for most operations

3. **Data Validation**
   - Frontend validation with Zod schemas
   - Backend validation must also be implemented

4. **CORS**
   - Ensure backend allows requests from frontend origin
   - Use credentials: true for cookie-based auth

### 12. Running the Application

```bash
# Install dependencies (if not already done)
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application should now have full subject management, guardian management, and assessment definition creation capabilities.

## Troubleshooting Checklist

- [ ] Backend server is running and accessible
- [ ] API endpoints are implemented and tested
- [ ] Environment variables are correctly set
- [ ] TypeScript paths are configured correctly
- [ ] All required types are exported
- [ ] Routes are registered in router config
- [ ] Sidebar navigation items are added
- [ ] Icons are imported from lucide-react
- [ ] Database migrations are applied
- [ ] Test a complete CRUD flow for each module

## Support

For detailed component documentation, refer to `FRONTEND_COMPONENTS_IMPLEMENTATION.md` for comprehensive information about each component, service, and hook.
