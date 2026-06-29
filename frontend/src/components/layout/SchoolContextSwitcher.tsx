import { useMemo, useState } from 'react';
import { Building2, Check, Search, X } from 'lucide-react';
import { useSchools } from '@/hooks/use-schools';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function SchoolContextSwitcher() {
  const { user, overrideSchool, setOverrideSchool, clearOverrideSchool } = useAuthStore();
  const [query, setQuery] = useState('');
  const { data: schoolsData, isLoading } = useSchools(undefined, { enabled: user?.role === 'SUPER_ADMIN' });

  const schools = useMemo(() => {
    const data = (schoolsData as any)?.data || [];
    const normalized = query.toLowerCase().trim();
    if (!normalized) return data.slice(0, 8);
    return data
      .filter((school: any) => `${school.name} ${school.county || ''} ${school.registrationNo || ''}`.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [query, schoolsData]);

  if (user?.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="group relative hidden min-w-72 lg:block">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/75">
        <Building2 className="h-4 w-4 text-indigo-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">School override</p>
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {overrideSchool ? overrideSchool.name : 'Platform mode'}
          </p>
        </div>
        {overrideSchool && (
          <button type="button" onClick={clearOverrideSchool} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="invisible absolute right-0 top-full z-50 mt-2 w-96 translate-y-2 rounded-3xl border border-slate-200 bg-white/95 p-3 opacity-0 shadow-2xl backdrop-blur-xl transition duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-950/95">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search school to inspect..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm outline-none ring-indigo-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {isLoading && <p className="px-3 py-2 text-sm text-slate-500">Loading schools...</p>}
          {schools.map((school: any) => (
            <button
              key={school.id}
              type="button"
              onClick={() => setOverrideSchool({ id: school.id, name: school.name })}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <span>
                <span className="block font-semibold text-slate-900 dark:text-slate-100">{school.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{school.county || 'No county'} · {school.type?.replace('_', ' ') || 'School'}</span>
              </span>
              {overrideSchool?.id === school.id && <Check className="h-4 w-4 text-emerald-500" />}
            </button>
          ))}
        </div>
        {overrideSchool && <Button variant="outline" size="sm" onClick={clearOverrideSchool} className="mt-3 w-full">Exit override mode</Button>}
      </div>
    </div>
  );
}
