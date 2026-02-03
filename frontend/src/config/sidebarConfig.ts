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
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  },
  {
    title: 'Schools',
    href: '/schools',
    icon: School,
    roles: ['SUPER_ADMIN'],
    children: [
      {
        title: 'All Schools',
        href: '/schools',
        icon: School,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Enrollments',
        href: '/students/enrollments',
        icon: BookOpen,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Promotions',
        href: '/students/promotions',
        icon: Trophy,
        roles: ['SUPER_ADMIN'],
      },
    ]
  },
  {
    title: 'Students',
    href: '/students',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
    children: [
      {
        title: 'All Students',
        href: '/students',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Enrollments',
        href: '/students/enrollments',
        icon: BookOpen,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: 'Promotions',
        href: '/students/promotions',
        icon: Trophy,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
  {
    title: 'Teachers',
    href: '/teachers',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    children: [
      {
        title: 'All Teachers',
        href: '/teachers',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: 'Assignments',
        href: '/teachers/assignments',
        icon: ClipboardCheck,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
  {
    title: 'Classes',
    href: '/classes',
    icon: Home,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
    children: [
      {
        title: 'All Classes',
        href: '/classes',
        icon: BookOpen,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Subjects',
        href: '/subjects',
        icon: BookMarked,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },

      {
        title: 'Subjects Selection',
        href: '/students/subjects',
        icon: BookMarked,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Student Subjects Select',
        href: '/students/student-subjects',
        icon: BookMarked,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Class Subjects',
        href: '/classes/subjects',
        icon: BookOpen,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Timetable',
        href: '/classes/timetable',
        icon: Calendar,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
    ],
  },
  {
    title: 'Assessments',
    href: '/assessments',
    icon: ClipboardCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    children: [
      {
        title: 'All Assessments',
        href: '/assessments',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Assessment Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Grade Entry',
        href: '//assessments/:assessmentId/grades',
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
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT'],
    children: [
      {
        title: 'Performance Reports',
        href: '/reports/performance',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
      {
        title: 'Term Reports',
        href: '/reports/term',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT'],
      },
      {
        title: 'Class Analysis',
        href: '/reports/class-analysis',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
    ],
  },
  {
    title: 'Academic Year',
    href: '/academic-year',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    children: [
      {
        title: 'Set-Up Calendar',
        href: '/academic-year',
        icon: CalendarFoldIcon,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      }
    ]
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    children: [
      {
        title: 'Users List',
        href: '/users',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: 'Guardians',
        href: '/guardians',
        icon: UserCheck,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: 'Bulk Create Users',
        href: '/users/bulk-create',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN',],
      },
      {
        title: 'Change Password',
        href: '/users/change-password',
        icon: Lock,
        roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
      },
    ],
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
    badge: '3',
  },
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