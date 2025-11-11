import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { getNavigationForRole, NavItem } from '../../config/sidebarConfig';
import { cn } from '../../lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const navigation = getNavigationForRole(user.role);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {collapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ET</span>
                </div>
                <span className="font-bold text-lg">EduTrak</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-1 hover:bg-gray-100 rounded"
              >
              {collapsed ? <ChevronRight size={20} /> : <X size={20} />}
            </button>
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => (
              <NavItemComponent
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={isActive}
                isExpanded={expandedItems.includes(item.title)}
                onToggle={() => toggleExpanded(item.title)}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors',
                collapsed && 'justify-center'
              )}
            >
              <LogOut size={20} />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function NavItemComponent({
  item,
  collapsed,
  isActive,
  isExpanded,
  onToggle,
}: NavItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;
  const active = isActive(item.href);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
            active
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex items-center space-x-3">
            <item.icon size={20} />
            {!collapsed && (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center space-x-2">
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                {item.badge}
              </span>
            )}
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>

      {!collapsed && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              to={child.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(child.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <child.icon size={16} />
              <span>{child.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

return (
  <Link
      to={item.href}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-700 hover:bg-gray-100',
        collapsed && 'justify-center'
      )}
    >
      <div className="flex items-center space-x-3">
        <item.icon size={20} />
        {!collapsed && (
          <span className="text-sm font-medium">{item.title}</span>
        )}
      </div>
      {!collapsed && item.badge && (
        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
