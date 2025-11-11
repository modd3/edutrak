import { Users, TrendingUp, Calendar, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function ParentDashboard() {
  const { user } = useAuthStore();

  // Mock data - replace with actual API calls
  const children = [
    {
      name: 'Sarah Doe',
      admissionNo: 'ADM001234',
      class: 'Form 3 North',
      averageGrade: 'B+',
      attendance: '95%',
    },
    {
      name: 'John Doe Jr.',
      admissionNo: 'ADM001235',
      class: 'Grade 7 East',
      averageGrade: 'A-',
      attendance: '98%',
    },
  ];

  const upcomingEvents = [
    { child: 'Sarah Doe', event: 'Mathematics CAT 2', date: 'Tomorrow', type: 'assessment' },
    { child: 'John Doe Jr.', event: 'Science Fair', date: 'Next Week', type: 'event' },
    { child: 'Sarah Doe', event: 'Parent-Teacher Meeting', date: 'In 2 weeks', type: 'meeting' },
  ];

  const recentUpdates = [
    {
      child: 'Sarah Doe',
      subject: 'Mathematics',
      update: 'New grade posted',
      grade: 'A',
      time: '2 hours ago',
    },
    {
      child: 'John Doe Jr.',
      subject: 'English',
      update: 'Assignment submitted',
      grade: null,
      time: '1 day ago',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-indigo-100">
          Stay updated on your children's academic progress
        </p>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-600">{child.class}</p>
                <p className="text-xs text-gray-500">Adm: {child.admissionNo}</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Average Grade</p>
                <p className="text-2xl font-bold text-green-700">{child.averageGrade}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Attendance</p>
                <p className="text-2xl font-bold text-blue-700">{child.attendance}</p>
              </div>
            </div>

            <button className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium
 transition-colors">
              View Full Report Card
            </button>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                  event.type === 'assessment' ? 'bg-orange-100' :
                  event.type === 'event' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {event.type === 'assessment' ? (
                    <Calendar className={`${event.type === 'assessment' ? 'text-orange-600' : ''}`} size={20
                    } />
                                      ) : event.type === 'event' ? (
                                        <Users className="text-blue-600" size={20} />
                                      ) : (
                                        <Bell className="text-green-600" size={20} />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600">{event.child}</p>
                                      <h3 className="font-medium text-gray-900">{event.event}</h3>
                                      <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                    
                            {/* Recent Updates */}
                            <div className="bg-white rounded-lg shadow p-6">
                              <h2 className="text-lg font-semibold mb-4">Recent Updates</h2>
                              <div className="space-y-4">
                                {recentUpdates.map((update, index) => (
                                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                    <p className="text-sm font-medium text-gray-900">{update.child}</p>
                                    <p className="text-sm text-gray-600">{update.subject}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs text-gray-500">{update.update}</p>
                                      {update.grade && (
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                          {update.grade}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{update.time}</p>
                                    </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Academic Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child, index) => (
            <div key={index}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">{child.name}</h3>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500 text-sm">Chart placeholder - integrate Recharts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-sm font-medium">Schedule Meeting</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-sm font-medium">View Reports</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="text-sm font-medium">Notifications</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-sm font-medium">Contact Teachers</p>
          </button>
        </div>
      </div>
    </div>
  );
}
