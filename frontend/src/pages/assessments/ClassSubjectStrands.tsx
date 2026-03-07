import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ClassSubjectStrandManager from '@/components/assessments/ClassSubjectStrandManager';

// Example page wrapper: expects :classSubjectId in route and schoolId, subjectId via query params
export default function ClassSubjectStrandsPage() {
  const { classSubjectId } = useParams<{ classSubjectId?: string }>();
  const [sp] = useSearchParams();
  const schoolId = sp.get('schoolId') || '';
  const subjectId = sp.get('subjectId') || '';

  // if we don't have the necessary ids, show instructions rather than error
  if (!classSubjectId || !schoolId || !subjectId) {
    return (
      <div className="p-4 text-gray-700">
        <h2 className="text-lg font-semibold mb-2">Class Subject Strands</h2>
        <p>
          To manage strands you must provide a <code>classSubjectId</code>,
          <code>schoolId</code> and <code>subjectId</code> as query parameters or
          navigate here from a class‑subject detail page.
        </p>
        <p className="mt-2">
          Example URL:{' '}
          <code>
            /assessments/class-subject-strands?classSubjectId=...&schoolId=...&subjectId=...
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Class Subject Strands</h2>
      <ClassSubjectStrandManager
        classSubjectId={classSubjectId}
        schoolId={schoolId}
        subjectId={subjectId}
      />
    </div>
  );
}
