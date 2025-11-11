import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function AdminDashboard() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Total Students',
      value: '1,234',
      change: '+12%',
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      title: 'Teachers',
      value: '89',
      change: '+5%',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Classes',
      value: '45',
      change: '+3',
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Avg. Performance',
      value: '78%',
      change: '+4%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = [
    { action: 'New student enrolled', name: 'John Doe', time: '2 hours ago' },
    { action: 'Assessment completed', name: 'Form 3 Math', time: '4 hours ago' },
    { action: 'Teacher assigned', name: 'Jane Smith to Grade 7', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          Here's what's happening in {user?.school?.name || 'your school'} today
        </p>
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
    
          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart placeholder - integrate Recharts here</p>
              </div>
            </div>
    
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
    
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <GraduationCap className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-sm font-medium">Add Student</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-sm font-medium">Add Teacher</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BookOpen className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-sm font-medium">Create Class</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="text-sm font-medium">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
}