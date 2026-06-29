import { School, CreditCard, DollarSign, Users, TrendingUp, Building2, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useSchools } from '@/hooks/use-schools';
import { usePlans } from '@/hooks/use-plans';
import { Button } from '@/components/ui/button';
import { RecentActivities } from '@/components/shared/RecentActivities';
import type { ActivityItem } from '@/components/shared/RecentActivities';

export function SuperAdminDashboard() {
  const { user, setOverrideSchool } = useAuthStore();
  const navigate = useNavigate();

  const { data: schoolsData } = useSchools();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schools: any[] = (schoolsData as any)?.data || [];


  const inspectSchool = (school: any) => {
    setOverrideSchool({ id: school.id, name: school.name });
    navigate('/students');
  };

  const { data: plansData } = usePlans();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plans: any[] = (plansData as any)?.data || [];

  const totalSchools = schools.length;
  const activeSchools = schools.filter((s: any) => s.isActive !== false).length;
  const totalStudents = schools.reduce((sum: number, s: any) => sum + (s._count?.students || 0), 0);
  const totalTeachers = schools.reduce((sum: number, s: any) => sum + (s._count?.users || 0), 0);
  const totalPlans = plans.length;

  // Derive recent school registrations from schools data (sorted by createdAt)
  const recentSchools = [...schools]
    .filter((s: any) => s.createdAt)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activities: ActivityItem[] = [
    // Recent school registrations
    ...recentSchools.map((school: any) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(school.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: `school-${school.id}`,
        icon: School,
        color: 'bg-blue-500',
        title: `${school.name} registered`,
        description: `${school.type?.replace('_', ' ')} in ${school.county}`,
        time: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
        link: '/schools',
      };
    }),
    // Plans info
    ...(plans.length > 0
      ? [
          {
            id: 'plans-summary',
            icon: CreditCard,
            color: 'bg-purple-500',
            title: `${totalPlans} subscription plan${totalPlans !== 1 ? 's' : ''} available`,
            description: 'System billing configurations',
            time: 'Active',
            link: '/subscriptions/plans',
          },
        ]
      : []),
    // System summary
    {
      id: 'system-summary',
      icon: Building2,
      color: 'bg-green-500',
      title: `${totalSchools} school${totalSchools !== 1 ? 's' : ''} in the system`,
      description: `${totalStudents} students, ${totalTeachers} staff across all schools`,
      time: 'System-wide',
      link: '/schools',
    },
  ];

  const stats = [
    {
      title: 'Total Schools',
      value: totalSchools,
      change: `${activeSchools} active`,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Students',
      value: totalStudents,
      change: 'Across all schools',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Active Staff',
      value: totalTeachers,
      change: 'System-wide',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Subscription Plans',
      value: totalPlans,
      change: 'Available plans',
      icon: CreditCard,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-indigo-100">Manage EduTrak systems, schools, and subscriptions here.</p>
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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">System Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/schools')}>
            <School className="text-blue-600" size={24} />
            <span className="text-sm font-medium">Manage Schools</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/subscriptions')}>
            <DollarSign className="text-green-600" size={24} />
            <span className="text-sm font-medium">Subscriptions</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/subscriptions/plans')}>
            <CreditCard className="text-purple-600" size={24} />
            <span className="text-sm font-medium">Manage Plans</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/billing-admin')}>
            <DollarSign className="text-amber-600" size={24} />
            <span className="text-sm font-medium">Billing Admin</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/users')}>
            <Users className="text-indigo-600" size={24} />
            <span className="text-sm font-medium">System Users</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col py-4 gap-2" onClick={() => navigate('/reports')}>
            <TrendingUp className="text-orange-600" size={24} />
            <span className="text-sm font-medium">System Reports</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid: Schools Table + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Schools */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Registered Schools</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/schools')}>
              View All
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">County</th>
                  <th className="pb-2 font-medium">Students</th>
                  <th className="pb-2 font-medium text-right">Override</th>
                </tr>
              </thead>
              <tbody>
                {schools.slice(0, 5).map((school: any) => (
                  <tr key={school.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-slate-900">
                    <td className="py-2 font-medium text-gray-900">{school.name}</td>
                    <td className="py-2 text-gray-600">{school.type?.replace('_', ' ')}</td>
                    <td className="py-2 text-gray-600">{school.county}</td>
                    <td className="py-2 text-gray-600">{school._count?.students || 0}</td>
                    <td className="py-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => inspectSchool(school)}>Inspect & Override</Button>
                    </td>
                  </tr>
                ))}
                {schools.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      No schools registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={activities} />
      </div>

      {/* Subscription Plans Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Subscription Plans</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions/plans')}>
            Manage Plans
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.filter((p: any) => p.isActive !== false).slice(0, 3).map((plan: any) => (
            <div key={plan.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                KES {(plan.priceMinor / 100).toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/{plan.billingInterval}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-4">No plans configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}