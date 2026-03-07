import React from 'react';
import { useClassSubjectStrands } from '@/hooks/use-class-subject-strand';
import { subjectService } from '@/services/subject.service';

interface Props {
  classSubjectId: string;
  schoolId: string;
  subjectId: string; // to fetch available subject strands
}

const ClassSubjectStrandManager: React.FC<Props> = ({ classSubjectId, schoolId, subjectId }) => {
  const [selectedToAssign, setSelectedToAssign] = React.useState<string[]>([]);
  const { listQuery: strandsWithCounts, bulkAssignMutation, removeMutation } = useClassSubjectStrands(
    classSubjectId,
    schoolId,
    { includeAssessments: true }
  );

  // Fetch all strands for the subject
  const [availableStrands, setAvailableStrands] = React.useState<any[]>([]);
  const [loadingAvailable, setLoadingAvailable] = React.useState<boolean>(false);
  React.useEffect(() => {
    let mounted = true;
    setLoadingAvailable(true);
    subjectService
      .getSubjectStrands(subjectId)
      .then((s) => {
        if (mounted) setAvailableStrands(s || []);
      })
      .finally(() => mounted && setLoadingAvailable(false));
    return () => {
      mounted = false;
    };
  }, [subjectId]);

  const assignedIds = React.useMemo(
    () => new Set((strandsWithCounts.data || []).map((s: any) => s.id)),
    [strandsWithCounts.data]
  );
  const unassigned = React.useMemo(
    () => (availableStrands || []).filter((s) => !assignedIds.has(s.id)),
    [availableStrands, assignedIds]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Assigned strands</h3>
        {strandsWithCounts.isLoading ? (
          <div>Loading...</div>
        ) : (
          <ul className="divide-y border rounded bg-white">
            {(strandsWithCounts.data || []).map((s: any) => (
              <li key={s.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  {typeof s.assessmentCount === 'number' && (
                    <div className="text-sm text-gray-500">Assessments: {s.assessmentCount}</div>
                  )}
                </div>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => removeMutation.mutate({ strandId: s.id })}
                  disabled={removeMutation.isLoading}
                  title="Unassign strand"
                >
                  Unassign
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Available strands</h3>
        {loadingAvailable ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {unassigned.map((s) => (
                <label key={s.id} className="flex items-center gap-2 p-2 border rounded bg-white">
                  <input
                    type="checkbox"
                    checked={selectedToAssign.includes(s.id)}
                    onChange={(e) => {
                      setSelectedToAssign((prev) =>
                        e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                      );
                    }}
                  />
                  <span className="font-medium">{s.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                disabled={selectedToAssign.length === 0 || bulkAssignMutation.isLoading}
                onClick={() => bulkAssignMutation.mutate({ strandIds: selectedToAssign })}
              >
                Assign selected
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedToAssign([])}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassSubjectStrandManager;
