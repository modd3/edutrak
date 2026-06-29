import { BookOpen, ClipboardCheck, Users, Calendar, Users2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssignTeacherToSubjectDialog } from '@/components/teachers/AssignTeacherToSubjectDialog';
import { useNavigate } from 'react-router-dom';
import { RecentActivities } from '@/components/shared/RecentActivities';
import type { ActivityItem } from '@/components/shared/RecentActivities';

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);

  const myClasses = [
    { name: 'Form 3 North', subject: 'Mathematics', students: 42, period: 'Period 1 (8:00 AM)' },
    { name: 'Form 2 East', subject: 'Mathematics', students: 38, period: 'Period 4 (11:00 AM)' },
    { name: 'Form 4 South', subject: 'Mathematics', students: 35, period: 'Period 7 (2:00 PM)' },
  ];

  const upcomingAssessments = [
    { class: 'Form 3 North', subject: 'Mathematics', type: 'CAT 2', date: 'Tomorrow' },
    { class: 'Form 2 East', subject: 'Mathematics', type: 'Assignment', date: 'In 3 days' },
  ];

  const pendingGrading = [
    { class: 'Form 4 South', assessment: 'Mock Exam', submissions: '32/35', urgent: true },
    { class: 'Form 3 North', assessment: 'CAT 1', submissions: '40/42', urgent: false },
  ];

  const activities: ActivityItem[] = [
    ...pendingGrading.map((item, i) => ({
      id: `grading-${i}`,
      icon: ClipboardCheck,
      color: item.urgent ? 'bg-red-500' : 'bg-orange-500',
      title: `${item.class}: ${item.assessment}`,
      description: `${item.submissions} submitted — ${item.urgent ? 'Urgent' : 'Pending'}`,
      time: 'Now',
      link: '/assessments',
    })),
    ...upcomingAssessments.map((a, i) => ({
      id: `upcoming-${i}`,
      icon: Calendar,
      color: 'bg-blue-500',
      title: `${a.class} — ${a.type}`,
      description: `${a.subject} — ${a.date}`,
      time: a.date,
      link: '/assessments',
    })),
    ...myClasses.slice(0, 2).map((cls, i) => ({
      id: `class-${i}`,
      icon: BookOpen,
      color: 'bg-green-500',
      title: `${cls.name} — ${cls.subject}`,
      description: `${cls.students} students — ${cls.period}`,
      time: 'Today',
      link: '/classes',
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Good morning, {user?.firstName}!
        </h1>
        <p className="text-green-100">
          You have 3 classes scheduled today
        </p>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white/85 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Daily Teaching Command Center</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Prioritise attendance, lessons and marksheets</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['3 lessons today', '2 attendance check-ins', '2 unsubmitted marksheets'].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Classes</p>
              <p className="text-3xl font-bold text-gray-900">6</p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">245</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Grading</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <ClipboardCheck className="text-orange-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-gray-900">18</p>
              <p className="text-xs text-gray-500">Periods</p>
            </div>
            <Calendar className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {myClasses.map((cls, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-600">{cls.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{cls.period}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{cls.students} students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Grading */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Grading</h2>
          <div className="space-y-4">
            {pendingGrading.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{item.class}</h3>
                    {item.urgent && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{item.assessment}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submissions: {item.submissions}
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Grade Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={activities} />
      </div>

      {/* Upcoming Assessments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Upcoming Assessments</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingAssessments.map((assessment, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-medium text-gray-900">{assessment.class}</p>
              <p className="text-sm text-gray-600">{assessment.type}</p>
              <p className="text-xs text-blue-600 mt-2">{assessment.date}</p>
            </div>
          ))}
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <p className="text-sm font-medium text-gray-600">+ Create Assessment</p>
          </button>
        </div>
      </div>

      {/* Subject Assignment Section */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">My Subject Assignments</h2>
            <p className="text-sm text-gray-600">Manage your subject assignments across classes</p>
          </div>
          <div className="bg-purple-600 p-3 rounded-lg">
            <Users2 className="text-white" size={24} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Assigned Classes</p>
            <p className="text-3xl font-bold text-purple-600">6</p>
            <p className="text-xs text-gray-500 mt-1">Classes this year</p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-purple-600">245</p>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Terms Assigned</p>
            <p className="text-3xl font-bold text-purple-600">4</p>
            <p className="text-xs text-gray-500 mt-1">Academic terms</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => setShowTeacherDialog(true)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Users2 className="mr-2 h-4 w-4" />
            Request Subject Assignment
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/teachers/assignments')}
            className="flex-1"
          >
            View All Assignments
          </Button>
        </div>
      </div>

      {/* Modal */}
      <AssignTeacherToSubjectDialog 
        open={showTeacherDialog}
        onOpenChange={setShowTeacherDialog}
      />
    </div>
  );
}