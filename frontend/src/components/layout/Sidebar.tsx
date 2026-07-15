// Sidebar.tsx
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { getNavigationForRole, NavItem } from '../../config/sidebarConfig';
import { cn } from '../../lib/utils';
import api from '../../api/client';

// shadcn/ui components
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  className,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user, logout, overrideSchool } = useAuthStore();

  if (!user) return null;

  const navigation = getNavigationForRole(user.role, !!overrideSchool);

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
        onClick={onToggleCollapsed}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-md"
      >
        {collapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen border-r border-white/70 bg-white/85 shadow-xl backdrop-blur-xl transition-all duration-300 z-40 dark:border-slate-800 dark:bg-slate-950/90',
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ET</span>
                </div>
                <span className="font-bold text-lg text-slate-950 dark:text-slate-50">
                  EduTrak
                </span>
              </div>
            )}
            <button
              onClick={onToggleCollapsed}
              className="hidden lg:block p-1 hover:bg-gray-100 rounded"
            >
              {collapsed ? <ChevronRight size={20} /> : <X size={20} />}
            </button>
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
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
          onClick={onToggleCollapsed}
        />
      )}
    </>
  );
}

// =================
// NavItemComponent
// =================
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

  // Detect backend redirect URLs (e.g. /auth/lms-sso) that must make an
  // authenticated API call, then open the returned URL in a new tab.
  // A plain <a> tag cannot carry the Authorization header, so the API
  // route's authenticate middleware would reject the request immediately.
  const isBackendRedirect = item.href.startsWith('/auth/');

  // Fetch the SSO redirect URL from the API (authenticated via axios interceptor)
  // and open it in a new tab.
  const handleBackendRedirect = useCallback(async () => {
    try {
      const response = await api.get(item.href, {
        headers: { Accept: 'application/json' },
      });
      if (response.data?.success && response.data?.data?.redirectUrl) {
        window.open(response.data.data.redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Failed to get redirect URL');
      }
    } catch (err: any) {
      // If the request failed (e.g. 401), show a user-friendly message
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to open E-Learning. Please try again.');
      }
    }
  }, [item.href]);

  // ---------- LEAF ITEM (no children) ----------
  if (!hasChildren) {
    const linkContent = isBackendRedirect ? (
      <button
        onClick={handleBackendRedirect}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          collapsed && 'justify-center'
        )}
      >
        {/* Left group: icon + title */}
        <div className="flex items-center space-x-3">
          <item.icon size={20} />
          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
        </div>
        {/* Right group: badge (if any) */}
        {!collapsed && item.badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
            {item.badge}
          </span>
        )}
      </button>
    ) : (
      <Link
        to={item.href}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          active
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          collapsed && 'justify-center'
        )}
      >
        {/* Left group: icon + title */}
        <div className="flex items-center space-x-3">
          <item.icon size={20} />
          {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
        </div>
        {/* Right group: badge (if any) */}
        {!collapsed && item.badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  }

  // ---------- PARENT ITEM (has children) ----------
  if (collapsed) {
    // Show a Popover with children
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-center px-3 py-2 rounded-lg transition-colors',
              active
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            <item.icon size={20} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          className="w-48 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg"
        >
          <div className="space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent
                key={child.href}
                item={child}
                collapsed={false}
                isActive={isActive}
                isExpanded={isExpanded}
                onToggle={onToggle}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // ---------- EXPANDED MODE (not collapsed) – original inline expand/collapse ----------
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
          active
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        )}
      >
        <div className="flex items-center space-x-3">
          <item.icon size={20} />
          <span className="text-sm font-medium">{item.title}</span>
        </div>
        <div className="flex items-center space-x-2">
          {item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
              {item.badge}
            </span>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItemComponent
              key={child.href}
              item={child}
              collapsed={collapsed}
              isActive={isActive}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}