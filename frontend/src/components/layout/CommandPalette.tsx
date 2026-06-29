import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  GraduationCap,
  Home as HomeIcon,
  BookMarked,
  CreditCard,
  BarChart3,
  Shield,
  UserCog,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_ITEMS = [
  { label: 'Students List', path: '/students', icon: GraduationCap, category: 'Navigation' },
  { label: 'Classes List', path: '/classes', icon: HomeIcon, category: 'Navigation' },
  { label: 'Subjects Management', path: '/subjects', icon: BookMarked, category: 'Navigation' },
  { label: 'Teachers List', path: '/teachers', icon: UserCog, category: 'Navigation' },
  { label: 'Fee Management Pro', path: '/fees', icon: CreditCard, category: 'Navigation' },
  { label: 'Fee Analytics', path: '/fees/analytics', icon: BarChart3, category: 'Navigation' },
  { label: 'System Audit Logs', path: '/audit-logs', icon: Shield, category: 'Navigation' },
  { label: 'My Subscription', path: '/billing/my-subscription', icon: Settings, category: 'Navigation' },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const filtered = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b pb-3">
          <DialogTitle className="sr-only">Quick Command Palette</DialogTitle>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Type a command or search destination... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Navigation
              </div>
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-gray-800">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
