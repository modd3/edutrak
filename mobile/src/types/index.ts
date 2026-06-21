export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  schoolId: string
}

export interface School {
  id: string
  name: string
  slug: string
  type: SchoolType
  phone?: string
  email?: string
}

export enum SchoolType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TVET = 'TVET',
  SPECIAL_NEEDS = 'SPECIAL_NEEDS',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  TRANSFERRED = 'TRANSFERRED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export enum AssessmentType {
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

export interface SyncChange {
  table: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: Record<string, any>
  timestamp: number
}

export interface SyncResponse {
  confirmed: Array<{ table: string; recordId: string }>
  conflicts: Array<{
    table: string
    recordId: string
    serverData: Record<string, any>
    localData: Record<string, any>
  }>
  changes: Array<{
    table: string
    recordId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    data: Record<string, any>
  }>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
  school: School
}