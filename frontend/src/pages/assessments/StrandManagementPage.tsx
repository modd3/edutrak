import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useClasses, useActiveAcademicYear } from '@/hooks/use-academic';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useSchoolContext } from '@/hooks/use-school-context';
import ClassSubjectStrandManager from '@/components/assessments/ClassSubjectStrandManager';

// helper copied from ClassDetailsModal
const findActiveTerm = (terms: any[] = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const term of terms) {
    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (today >= startDate && today <= endDate) {
      return term;
    }
  }
  return null;
};

export default function StrandManagementPage() {
  const { schoolId } = useSchoolContext();
  const { data: activeYearData } = useActiveAcademicYear();

  const activeTerm = useMemo(() => {
    return findActiveTerm(activeYearData?.terms || []);
  }, [activeYearData?.terms]);

  // early return if context is missing
  if (!activeYearData) {
    return (
      <div className="p-4 text-red-600">
        No active academic year found. Please configure an academic year first.
      </div>
    );
  }

  if (!activeTerm) {
    return (
      <div className="p-4 text-red-600">
        No active term found. Please activate a term before managing strands.
      </div>
    );
  }

  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedClassSubject, setSelectedClassSubject] = useState<any>(null);

  const { data: classesResp } = useClasses(activeYearData?.id || '');
  const classes = classesResp?.data || [];

  const filteredClasses = useMemo(() => {
    return classes.filter((c: any) =>
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.level.toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [classes, classSearch]);

  const { data: csResp } = useClassSubjects(
    selectedClass?.id || '',
    activeYearData?.id || '',
    activeTerm?.id || ''
  );

  const classSubjects = csResp?.data?.data || [];

  const filteredClassSubjects = useMemo(() => {
    return classSubjects.filter((cs: any) => {
      const subjName = cs.subject?.name || '';
      const subjCode = cs.subject?.code || '';
      return (
        subjName.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        subjCode.toLowerCase().includes(subjectSearch.toLowerCase())
      );
    });
  }, [classSubjects, subjectSearch]);

  const handleClassSelect = (cls: any) => {
    setSelectedClass(cls);
    setSelectedClassSubject(null);
  };

  const handleSubjectSelect = (cs: any) => {
    setSelectedClassSubject(cs);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Strand Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            placeholder="Search classes..."
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
          />
          <ul className="mt-2 max-h-56 overflow-auto border rounded bg-white">
            {filteredClasses.map((cls: any) => (
              <li
                key={cls.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedClass?.id === cls.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleClassSelect(cls)}
              >
                {cls.name} ({cls.level})
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Input
            placeholder="Search subjects..."
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            disabled={!selectedClass}
          />
          <ul className="mt-2 max-h-56 overflow-auto border rounded bg-white">
            {filteredClassSubjects.map((cs: any) => (
              <li
                key={cs.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${
                  selectedClassSubject?.id === cs.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSubjectSelect(cs)}
              >
                {cs.subject?.name} ({cs.subject?.code})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedClassSubject && (
        <ClassSubjectStrandManager
          classSubjectId={selectedClassSubject.id}
          schoolId={schoolId || ''}
          subjectId={selectedClassSubject.subjectId}
        />
      )}
    </div>
  );
}
