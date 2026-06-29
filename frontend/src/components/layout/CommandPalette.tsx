import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { BookOpen, CreditCard, GraduationCap, Search, Settings, Users, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const actions = [
  { label: 'Students', scope: 'school', description: 'Find learners by name or admission number', path: '/students', keywords: 'student admission learner', icon: GraduationCap },
  { label: 'Classes', scope: 'school', description: 'Open class streams and enrollment tools', path: '/classes', keywords: 'class stream enrollment', icon: BookOpen },
  { label: 'Teachers', scope: 'school', description: 'Manage staff and subject assignments', path: '/teachers', keywords: 'teacher staff subject', icon: Users },
  { label: 'CBC Assessments', scope: 'school', description: 'Enter rubric scores and marksheets', path: '/assessments', keywords: 'cbc rubric marksheet exam', icon: Settings },
  { label: 'Fee Center', scope: 'school', description: 'Invoices, M-Pesa payments and arrears', path: '/fees', keywords: 'fees invoice mpesa payment arrears', icon: CreditCard },
  { label: 'Reports', scope: 'school', description: 'Download performance and report cards', path: '/reports', keywords: 'report card pdf analytics', icon: Search },
  { label: 'Students', description: 'Find learners by name or admission number', path: '/students', keywords: 'student admission learner', icon: GraduationCap },
  { label: 'Classes', description: 'Open class streams and enrollment tools', path: '/classes', keywords: 'class stream enrollment', icon: BookOpen },
  { label: 'Teachers', description: 'Manage staff and subject assignments', path: '/teachers', keywords: 'teacher staff subject', icon: Users },
  { label: 'CBC Assessments', description: 'Enter rubric scores and marksheets', path: '/assessments', keywords: 'cbc rubric marksheet exam', icon: Settings },
  { label: 'Fee Center', description: 'Invoices, M-Pesa payments and arrears', path: '/fees', keywords: 'fees invoice mpesa payment arrears', icon: CreditCard },
  { label: 'Reports', description: 'Download performance and report cards', path: '/reports', keywords: 'report card pdf analytics', icon: Search },
  { label: 'My Subscription', description: 'Review your school plan, billing and entitlements', path: '/billing/my-subscription', keywords: 'subscription plan billing entitlement', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Billing Admin', description: 'Manage SaaS subscriptions across schools', path: '/billing-admin', keywords: 'billing admin subscription plans', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user, overrideSchool } = useAuthStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredActions = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const roleAwareActions = actions.filter((action) => {
      const isRoleAllowed = !('roles' in action) || action.roles.includes(user?.role || '');
      const isSchoolScoped = 'scope' in action && action.scope === 'school';
      const isBlockedSuperAdminSchoolAction = user?.role === 'SUPER_ADMIN' && isSchoolScoped && !overrideSchool;
      return isRoleAllowed && !isBlockedSuperAdminSchoolAction;
    });
    if (!normalized) return roleAwareActions;
    return roleAwareActions.filter((action) => `${action.label} ${action.description} ${action.keywords}`.toLowerCase().includes(normalized));
  }, [query, user?.role, overrideSchool]);

  const runAction = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-left text-sm text-slate-500 shadow-sm backdrop-blur-md transition hover:border-indigo-200 hover:bg-white lg:flex"
      >
        <Search className="h-4 w-4 text-slate-400" />
        <span className="flex-1">Jump to student, class or setting...</span>
        <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Ctrl K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden rounded-3xl border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <DialogHeader className="border-b border-slate-100 px-6 pt-6 text-left">
            <DialogTitle>Command center</DialogTitle>
            <DialogDescription>Search modules, student workflows, CBC assessments, fees and reports.</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try ‘ADM001234’, ‘rubric’, or ‘M-Pesa invoice’" className="h-12 rounded-2xl border-slate-200 pl-11" />
            </div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {filteredActions.map((action) => (
                <button key={action.path} type="button" onClick={() => runAction(action.path)} className="group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-indigo-50">
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"><action.icon className="h-5 w-5" /></span>
                  <span><span className="block font-medium text-slate-900">{action.label}</span><span className="text-sm text-slate-500">{action.description}</span></span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
