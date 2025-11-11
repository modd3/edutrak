import { BookOpen, ClipboardCheck, Users, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function TeacherDashboard() {
  const { user } = useAuthStore();

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <button className="text-xs text-blue-600 hover:underline mt-1">
                    View Class
                  </button>
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
    </div>
  );
}