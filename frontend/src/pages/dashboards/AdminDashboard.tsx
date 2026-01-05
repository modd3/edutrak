import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus, Users2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StudentEnrollmentModal } from '@/components/students/StudentEnrollmentModal';
import { AssignTeacherToSubjectDialog } from '@/components/teachers/AssignTeacherToSubjectDialog';
import { useState } from 'react';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);

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

      {/* Student Enrollment & Teacher Assignment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Enrollment Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Student Enrollment</h2>
              <p className="text-sm text-gray-600">Enroll students in classes for the academic year</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-lg">
              <UserPlus className="text-white" size={24} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">Manage Student Placements</p>
              <p className="text-xs text-gray-600 mt-2">Assign students to classes and streams</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowEnrollModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/students')}
                className="flex-1"
              >
                View All Students
              </Button>
            </div>
          </div>
        </div>

        {/* Teacher Subject Assignment Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Teacher Assignments</h2>
              <p className="text-sm text-gray-600">Assign teachers to subjects and classes</p>
            </div>
            <div className="bg-green-600 p-3 rounded-lg">
              <Users2 className="text-white" size={24} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">Manage Teacher Workload</p>
              <p className="text-xs text-gray-600 mt-2">Assign subjects to classes for terms</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowTeacherDialog(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Users2 className="mr-2 h-4 w-4" />
                Assign Teacher
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/teachers')}
                className="flex-1"
              >
                View Teachers
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentEnrollmentModal 
        open={showEnrollModal}
        onOpenChange={setShowEnrollModal}
      />
      
      <AssignTeacherToSubjectDialog 
        open={showTeacherDialog}
        onOpenChange={setShowTeacherDialog}
      />
    </div>
  );
}