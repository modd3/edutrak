import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useSchools } from '@/hooks/use-schools';
import { Building2, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface School {
  id: string;
  name: string;
  type?: string;
  county?: string;
}

export function SchoolContextSwitcher() {
  const navigate = useNavigate();
  const { user, overrideSchool, setOverrideSchool, clearOverrideSchool } = useAuthStore();
  const { data: schoolsData } = useSchools();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only render for SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schools: School[] = (schoolsData as any)?.data || [];

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSchool = (school: School) => {
    setOverrideSchool({ id: school.id, name: school.name });
    setIsOpen(false);
    setSearchQuery('');
    navigate('/dashboard');
  };

  const handleExitOverride = () => {
    clearOverrideSchool();
    navigate('/dashboard');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {overrideSchool ? (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-amber-50 text-amber-700 font-medium rounded-lg text-xs flex items-center gap-1.5 border border-amber-200">
            <Building2 size={14} />
            <span>{overrideSchool.name}</span>
          </div>
          <button
            onClick={handleExitOverride}
            title="Exit Override Mode"
            className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-medium"
        >
          <Building2 size={14} />
          <span>Switch School</span>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredSchools.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                {searchQuery ? 'No schools match your search' : 'No schools available'}
              </div>
            ) : (
              filteredSchools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSelectSchool(school)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left',
                    overrideSchool?.id === school.id ? 'bg-indigo-50' : ''
                  )}
                >
                  <Building2 size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{school.name}</p>
                    {school.type && (
                      <p className="text-xs text-gray-500 truncate">
                        {school.type.replace('_', ' ')}{school.county ? ` · ${school.county}` : ''}
                      </p>
                    )}
                  </div>
                  {overrideSchool?.id === school.id && (
                    <Check size={16} className="text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}