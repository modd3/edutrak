import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus, Calendar, School } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useSchoolStatistics } from '@/hooks/use-schools';
import { useAcademicStatistics } from '@/hooks/use-academic';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { StudentFormModal } from '@/components/students/StudentFormModal'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RecentActivities } from '@/components/shared/RecentActivities';
import type { ActivityItem } from '@/components/shared/RecentActivities';
import { useRecentAuditLogs, formatAuditToActivity } from '@/hooks/use-audit';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Check authorization for management features
  const { hasAccess: canManageStudents } = useAuthGuard({
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
  });

  const { hasAccess: canManageTeachers } = useAuthGuard({
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
  });

  const { hasAccess: canManageClasses } = useAuthGuard({
    requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
  });

  const { data: statisticsData } = useSchoolStatistics(user?.schoolId);
  // The per-school statistics endpoint returns a different shape than SchoolStats type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const school_stats: any = (statisticsData as any)?.data?.data || (statisticsData as any)?.data || statisticsData;

  // Get academic stats for performance data
  const { data: academicStatsData } = useAcademicStatistics(user?.schoolId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const academicStats: any = (academicStatsData as any)?.data?.data || (academicStatsData as any)?.data || academicStatsData;

  // Build chart data from academic stats if available
  const classPerformanceData = academicStats?.classPerformance || [];
  const chartData = classPerformanceData.length > 0
    ? classPerformanceData.map((item: any) => ({
        name: item.className || item.class?.name || 'Class',
        avg: Math.round(item.average || 0),
      }))
    : [];

  const avgPerformance = chartData.length > 0
    ? Math.round(chartData.reduce((sum: number, d: any) => sum + d.avg, 0) / chartData.length)
    : null;

  const totalStudents = school_stats?.totalStudents ?? school_stats?._count?.students ?? 0;
  const totalTeachers = school_stats?.usersByRole?.TEACHER ?? school_stats?._count?.teachers ?? 0;
  const totalClasses = school_stats?.totalClasses ?? school_stats?._count?.classes ?? 0;

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents || '—',
      change: totalStudents ? `Active` : '',
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      title: 'Teachers',
      value: totalTeachers || '—',
      change: totalTeachers ? 'On staff' : '',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Classes',
      value: totalClasses || '—',
      change: totalClasses ? 'This year' : '',
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Avg. Performance',
      value: avgPerformance !== null ? `${avgPerformance}%` : '—',
      change: avgPerformance !== null ? 'Mean score' : '',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  // Fetch real audit logs from the API
  const { data: auditLogs, isLoading: auditLoading } = useRecentAuditLogs(8);
  
  // Build fallback activities from school stats when no audit data exists
  const fallbackActivities: ActivityItem[] = [
    ...(totalStudents > 0
      ? [{
          id: 'student-count',
          icon: GraduationCap,
          color: 'bg-blue-500',
          title: `${totalStudents} student${totalStudents !== 1 ? 's' : ''} enrolled`,
          description: `In ${totalClasses} class${totalClasses !== 1 ? 'es' : ''}`,
          time: 'Current',
          link: '/students',
        }]
      : []),
    ...(totalTeachers > 0
      ? [{
          id: 'teacher-count',
          icon: UserPlus,
          color: 'bg-green-500',
          title: `${totalTeachers} teacher${totalTeachers !== 1 ? 's' : ''} on staff`,
          description: 'Teaching across classes',
          time: 'Current',
          link: '/teachers',
        }]
      : []),
    {
      id: 'school-name',
      icon: School,
      color: 'bg-purple-500',
      title: user?.school?.name || 'School Dashboard',
      description: 'Manage academics, students, and staff',
      time: 'Active',
      link: '/classes',
    },
  ];

  // Merge: audit logs first, then fallback items to fill gaps
  const auditActivities = auditLogs ? formatAuditToActivity(auditLogs) : [];
  const activities: ActivityItem[] = auditActivities.length > 0
    ? auditActivities
    : fallbackActivities;

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">Here's what's happening in {user?.school?.name || 'your school'} today</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          ['Attendance rate', '94.8%', '+2.1% this week', 'from-emerald-500 to-teal-500'],
          ['Fee collection', 'KES 2.4M', '78% of term target', 'from-indigo-500 to-blue-500'],
          ['Subscription health', 'Active', 'Enterprise plan in good standing', 'from-violet-500 to-fuchsia-500'],
        ].map(([label, value, detail, gradient]) => (
          <div key={label} className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-emerald-600">{detail}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient}`} />
            </div>
            <svg viewBox="0 0 120 32" className="mt-4 h-10 w-full text-indigo-500" fill="none">
              <path d="M2 26 C18 10, 28 18, 42 12 S66 4, 82 11 S102 24, 118 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
          ))}
      </div>
  
      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Class Performance (Mean %)</h2>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#2563eb" radius={[4, 4, 0, 0]} name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">No performance data yet. Add assessment results to see charts.</p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={activities} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {canManageStudents && (
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => setShowCreateModal(true)}>
              <GraduationCap className="text-blue-600" size={24} />
              <span className="text-sm font-medium">Add Student</span>
            </Button>
          )}
          {canManageTeachers && (
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/teachers')}>
              <Users className="text-green-600" size={24} />
              <span className="text-sm font-medium">Add Teacher</span>
            </Button>
          )}
          {canManageClasses && (
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/classes')}>
              <BookOpen className="text-purple-600" size={24} />
              <span className="text-sm font-medium">Create Class</span>
            </Button>
             )}
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/reports')}>
            <TrendingUp className="text-orange-600" size={24} />
            <span className="text-sm font-medium">View Reports</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/academic-year/year-end-wizard')}>
            <Calendar className="text-amber-600" size={24} />
            <span className="text-sm font-medium">Year-End Wizard</span>
          </Button>
        </div>
      </div>
      <StudentFormModal 
              open={showCreateModal} 
              onOpenChange={setShowCreateModal} 
              mode="create" 
            />
    </div>
  );
}