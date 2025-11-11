import { BookOpen, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function StudentDashboard() {
  const { user } = useAuthStore();

  const upcomingClasses = [
    { subject: 'Mathematics', time: '8:00 AM - 9:00 AM', teacher: 'Mr. John Doe', room: 'Lab 2' },
    { subject: 'English', time: '9:00 AM - 10:00 AM', teacher: 'Mrs. Jane Smith', room: 'Room 14' },
    { subject: 'Science', time: '11:00 AM - 12:00 PM', teacher: 'Dr. Bob Wilson', room: 'Lab 1' },
  ];

  const recentGrades = [
    { subject: 'Mathematics', assessment: 'CAT 1', grade: 'A', score: '85/100', date: '2 days ago' },
    { subject: 'English', assessment: 'Essay', grade: 'B+', score: '78/100', date: '5 days ago' },
    { subject: 'Science', assessment: 'Lab Report', grade: 'A-', score: '82/100', date: '1 week ago' },
  ];

  const upcomingAssessments = [
    { subject: 'Mathematics', type: 'CAT 2', date: 'Tomorrow', time: '10:00 AM' },
    { subject: 'Kiswahili', type: 'Assignment', date: 'In 3 days', time: 'End of day' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-purple-100">
          {user?.student?.admissionNo && `Admission No: ${user.student.admissionNo}`}
        </p>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Term</p>
              <p className="text-2xl font-bold text-gray-900">Term 2</p>
              <p className="text-xs text-gray-500">2024</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <BookOpen className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Grade</p>
              <p className="text-3xl font-bold text-gray-900">B+</p>
            </div>
            <Trophy className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Class Rank</p>
              <p className="text-3xl font-bold text-gray-900">#12</p>
              <p className="text-xs text-green-600">↑ 3 positions</p>
            </div>
            <TrendingUp className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {upcomingClasses.map((cls, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{cls.subject}</h3>
                  <p className="text-sm text-gray-600">{cls.teacher}</p>
                  <p className="text-xs text-gray-500">{cls.room}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">{cls.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Assessments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tests</h2>
          <div className="space-y-4">
          {upcomingAssessments.map((assessment, index) => (
              <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-gray-900">{assessment.subject}</h3>
                <p className="text-sm text-gray-600">{assessment.type}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-orange-600">{assessment.date}</p>
                  <p className="text-xs text-gray-500">{assessment.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Grades</h2>
          <button className="text-sm text-blue-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Assessment</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Grade</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentGrades.map((grade, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{grade.subject}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{grade.assessment}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{grade.score}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      {grade.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{grade.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Chart placeholder - integrate Recharts here</p>
        </div>
      </div>
    </div>
  );
}