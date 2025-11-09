import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus, FilePlus, Presentation, School } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useStudents } from '@/hooks/use-students';
import { useTeachers } from '@/hooks/use-teachers';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: isLoadingStats } = useQuery<SchoolStats>({
    queryKey: ['school-stats', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeEnrollments: 0,
      };
      const response = await apiClient.get(`/schools/${user.schoolId}/statistics`);
      return response.data.data;
    },
    enabled: !!user?.schoolId,
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({ schoolId: user?.schoolId, pageSize: 5 });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ schoolId: user?.schoolId, pageSize: 5 });

  const recentActivities = useMemo(() => {
    const students = studentsData?.data.map(s => ({ ...s, type: 'student', createdAt: new Date(s.createdAt) })) || [];
    const teachers = teachersData?.data.map(t => ({ ...t, type: 'teacher', createdAt: new Date(t.createdAt) })) || [];
    
    return [...students, ...teachers]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
  }, [studentsData, teachersData]);

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Classes',
      value: stats?.totalClasses || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Enrollments',
      value: stats?.activeEnrollments || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    { label: 'Add New Student', href: '/students/new', icon: UserPlus },
    { label: 'Create Assessment', href: '/assessments/new', icon: FilePlus },
    { label: 'Manage Classes', href: '/classes', icon: School },
    { label: 'Academic Years', href: '/academic-years', icon: Presentation },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}! Here's what's happening in your school.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? <Skeleton className="h-8 w-20" /> : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {(isLoadingStudents || isLoadingTeachers) && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            )}
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${activity.type === 'student' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {activity.type === 'student' ? <GraduationCap className="h-5 w-5 text-blue-600" /> : <Users className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.type === 'student' ? `New student added: ${activity.firstName} ${activity.lastName}` : `New teacher added: ${activity.user.firstName} ${activity.user.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {!isLoadingStudents && !isLoadingTeachers && recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center w-full rounded-lg border p-3 text-sm hover:bg-accent"
                >
                  <action.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                  {action.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
