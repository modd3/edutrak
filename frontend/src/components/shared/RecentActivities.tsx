import { Clock, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
  time: string;
  link?: string;
}

interface RecentActivitiesProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  className?: string;
}

export function RecentActivities({
  activities,
  title = 'Recent Activities',
  maxItems = 6,
  className,
}: RecentActivitiesProps) {
  const navigate = useNavigate();
  const displayed = activities.slice(0, maxItems);

  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Clock size={36} className="mb-2" />
          <p className="text-sm">No recent activities yet.</p>
          <p className="text-xs mt-1">Activities will appear here as you use the system.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                activity.link ? 'cursor-pointer hover:bg-gray-50' : ''
              )}
              onClick={() => {
                if (activity.link) navigate(activity.link);
              }}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  activity.color
                )}
              >
                <activity.icon className="text-white" size={18} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {activity.description}
                </p>
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activities.length > maxItems && (
        <p className="text-xs text-blue-600 text-center mt-3">
          +{activities.length - maxItems} more
        </p>
      )}
    </div>
  );
}