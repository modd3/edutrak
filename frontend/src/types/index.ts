export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN'
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface Student {
    id: string
    admissionNo: string
    firstName: string
    lastName: string
    gender: 'MALE' | 'FEMALE'
    dateOfBirth?: string
    upiNumber?: string
    nemisUpi?: string
    hasSpecialNeeds: boolean
    specialNeedsDescription?: string
    schoolId: string
    userId?: string
    createdAt: string
    updatedAt: string
    user?: User
    enrollments?: Enrollment[]
    guardians?: GuardianRelationship[]
  }
  
  export interface Teacher {
    id: string
    tscNumber: string
    employmentType: 'PERMANENT' | 'CONTRACT' | 'INTERN'
    qualifications?: string
    specialization?: string
    userId: string
    schoolId: string
    createdAt: string
    updatedAt: string
    user?: User
    subjects?: ClassSubject[]
  }
  
  export interface School {
    id: string
    name: string
    code: string
    registrationNumber: string
    knecCode?: string
    nemisCode?: string
    type: 'PRIMARY' | 'SECONDARY' | 'TERTIARY'
    ownership: 'PUBLIC' | 'PRIVATE'
    boardingStatus: 'DAY' | 'BOARDING' | 'MIXED'
    gender: 'BOYS' | 'GIRLS' | 'MIXED'
    county: string
    subCounty: string
    address?: string
    phone?: string
    email?: string
    principalName?: string
    createdAt: string
    updatedAt: string
  }
  
  export interface AcademicYear {
    id: string
    year: string
    startDate: string
    endDate: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  
  export interface Class {
    id: string
    name: string
    level: string
    curriculum: 'CBC' | '844'
    academicYearId: string
    schoolId: string
    createdAt: string
    updatedAt: string
    streams?: Stream[]
    academicYear?: AcademicYear
  }
  
  export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  
  export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }