import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Settings,
  School,
  UserCog,
  FileText,
  Bell,
  Home,
  Trophy,
  type LucideIcon,
  Lock,
  CalendarFoldIcon,
  BookMarked,
  UserCheck,
  TestTubes,
  DollarSign,
  CreditCard,
  AlertCircle,
  Receipt,
  DollarSignIcon,
  Building2,
} from 'lucide-react';
import { UserRole } from '../store/auth-store';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
  children?: NavItem[];
}

export const sidebarConfig: NavItem[] = [
  // ============================================================
  // DASHBOARD — All roles
  // ============================================================
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  },

  // ============================================================
  // SUPER_ADMIN ONLY — Schools
  // ============================================================
  {
    title: 'Schools',
    href: '/schools',
    icon: Building2,
    roles: ['SUPER_ADMIN'],
    children: [
      {
        title: 'All Schools',
        href: '/schools',
        icon: School,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // SUPER_ADMIN ONLY — Billing & Subscriptions
  // ============================================================
  {
    title: 'Subscriptions',
    href: '/subscriptions',
    icon: DollarSign,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Plans',
    href: '/subscriptions/plans',
    icon: DollarSignIcon,
    roles: ['SUPER_ADMIN'],
  },
  {
    title: 'Billing Admin',
    href: '/billing-admin',
    icon: Receipt,
    roles: ['SUPER_ADMIN'],
  },

  // ============================================================
  // SCHOOL ADMIN — Students
  // ============================================================
  {
    title: 'Students',
    href: '/students',
    icon: GraduationCap,
    roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
    children: [
      {
        title: 'All Students',
        href: '/students',
        icon: Users,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Enrollments',
        href: '/students/enrollments',
        icon: BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Promotions',
        href: '/students/promotions',
        icon: Trophy,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // SCHOOL ADMIN — Teachers
  // ============================================================
  {
    title: 'Teachers',
    href: '/teachers',
    icon: UserCog,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      {
        title: 'All Teachers',
        href: '/teachers',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Assignments',
        href: '/teachers/assignments',
        icon: ClipboardCheck,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // SCHOOL ADMIN — Classes
  // ============================================================
  {
    title: 'Classes',
    href: '/classes',
    icon: Home,
    roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
    children: [
      {
        title: 'All Classes',
        href: '/classes',
        icon: BookOpen,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Subjects',
        href: '/subjects',
        icon: BookMarked,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Subjects Selection',
        href: '/students/subjects',
        icon: BookMarked,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Class Subjects',
        href: '/classes/subjects',
        icon: BookOpen,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Timetable',
        href: '/classes/timetable',
        icon: Calendar,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // Assessments — All instructional roles
  // ============================================================
  {
    title: 'Assessments',
    href: '/assessments',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'],
    children: [
      {
        title: 'All Assessments',
        href: '/assessments',
        icon: FileText,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Strand Management',
        href: '/assessments/strands/manage',
        icon: TestTubes,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Grade Entry',
        href: '/assessments/:assessmentId/grades',
        icon: ClipboardCheck,
        roles: ['TEACHER'],
      },
      {
        title: 'My Grades',
        href: '/assessments/my-grades',
        icon: Trophy,
        roles: ['STUDENT'],
      },
      {
        title: 'Child Grades',
        href: '/assessments/child-grades',
        icon: Trophy,
        roles: ['PARENT'],
      },
    ],
  },

  // ============================================================
  // Fees — School admin & teacher (limited)
  // ============================================================
  {
    title: 'Fees',
    href: '/fees',
    icon: CreditCard,
    roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
    children: [
      {
        title: 'Fee Dashboard',
        href: '/fees',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Fee Structures',
        href: '/fees?tab=structures',
        icon: FileText,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Fee Invoices',
        href: '/fees?tab=invoices',
        icon: ClipboardCheck,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Fee Payments',
        href: '/fees?tab=payments',
        icon: DollarSign,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Fee Arrears & Reports',
        href: '/fees?tab=reports',
        icon: AlertCircle,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // Reports — All roles
  // ============================================================
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN'],
    children: [
      {
        title: 'Performance Reports',
        href: '/reports/performance',
        icon: BarChart3,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
      {
        title: 'Term Reports',
        href: '/reports/term',
        icon: FileText,
        roles: ['ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN'],
      },
      {
        title: 'Class Analysis',
        href: '/reports/class-analysis',
        icon: BarChart3,
        roles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // Academic Year — School admin
  // ============================================================
  {
    title: 'Academic Year',
    href: '/academic-year',
    icon: Calendar,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      {
        title: 'Set-Up Calendar',
        href: '/academic-year',
        icon: CalendarFoldIcon,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Year-End Wizard',
        href: '/academic-year/year-end-wizard',
        icon: Trophy,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },

  // ============================================================
  // Users & Guardians — School admin
  // ============================================================
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      {
        title: 'Users List',
        href: '/users',
        icon: Users,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Guardians',
        href: '/guardians',
        icon: UserCheck,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Bulk Create Users',
        href: '/users/bulk-create',
        icon: FileText,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Change Password',
        href: '/users/change-password',
        icon: Lock,
        roles: ['ADMIN', 'SUPER_ADMIN', 'TEACHER'],
      },
    ],
  },

  // ============================================================
  // Notifications — All
  // ============================================================
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    badge: '3',
  },

  // ============================================================
  // Settings — All
  // ============================================================
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'],
  },
];

// Filter navigation items based on user role
export const getNavigationForRole = (role: UserRole): NavItem[] => {
  return sidebarConfig
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(role)),
    }));
};