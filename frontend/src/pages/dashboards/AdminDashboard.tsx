import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus, Users2, Calendar, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useSchoolStatistics } from '@/hooks/use-schools';
import { useAcademicStatistics } from '@/hooks/use-academic';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const { data: academicStatsData } = useAcademicStatistics();
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

  const stats = [
    {
      title: 'Total Students',
      value: school_stats?.totalStudents ?? school_stats?._count?.students ?? '—',
      change: school_stats?.totalStudents ? `Active` : '',
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      title: 'Teachers',
      value: school_stats?.usersByRole?.TEACHER ?? school_stats?._count?.teachers ?? '—',
      change: school_stats?.usersByRole?.TEACHER ? 'On staff' : '',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Classes',
      value: school_stats?.totalClasses ?? school_stats?._count?.classes ?? '—',
      change: school_stats?.totalClasses ? 'This year' : '',
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

  const recentActivities = [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
         {user?.role === 'ADMIN' ? <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!</h1> : <h1 className="text-3xl font-bold mb-2">
          Welcome back, Super Admin!</h1>}
        
         {user?.role === 'ADMIN' ? <p className="text-blue-100">Here's what's happening in {user?.school?.name || 'your school'} today </p>
         : <p> Manage EduTrak systems here </p> } 
        
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
    
            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Students</span>
                  </div>
                  <span className="font-bold text-lg">{stats[0].value}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Teachers</span>
                  </div>
                  <span className="font-bold text-lg">{stats[1].value}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Classes</span>
                  </div>
                  <span className="font-bold text-lg">{stats[2].value}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Avg. Score</span>
                  </div>
                  <span className="font-bold text-lg">{stats[3].value}</span>
                </div>
              </div>
            </div>
          </div>
    
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {canManageStudents && (
                <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/students')}>
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
    </div>
  );
}