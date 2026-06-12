// src/components/assessments/WeightConfiguration.tsx

import { useState, useEffect } from 'react';
import { Save, Trash2, AlertCircle } from 'lucide-react';
import {
  useAssessmentWeights,
  useBulkUpsertWeights,
  useDeleteAssessmentWeight,
} from '@/hooks/use-assessments';
import { AssessmentType } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WeightConfigurationProps {
  termId: string;
  classSubjectId: string;
}

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: AssessmentType.CAT, label: 'CAT' },
  { value: AssessmentType.MIDTERM, label: 'Mid-Term' },
  { value: AssessmentType.END_OF_TERM, label: 'End of Term' },
  { value: AssessmentType.MOCK, label: 'Mock' },
];

export function WeightConfiguration({ termId, classSubjectId }: WeightConfigurationProps) {
  const { data: weightsData, isLoading } = useAssessmentWeights(termId, classSubjectId);
  const bulkUpsert = useBulkUpsertWeights();
  const deleteWeight = useDeleteAssessmentWeight();

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize weights from fetched data
  useEffect(() => {
    if (weightsData?.data) {
      const weightMap: Record<string, number> = {};
      for (const w of weightsData.data) {
        weightMap[w.assessmentType] = w.weight;
      }
      setWeights(weightMap);
      setHasChanges(false);
    }
  }, [weightsData]);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);

  const handleWeightChange = (type: string, value: string) => {
    const num = parseFloat(value) || 0;
    setWeights((prev) => ({ ...prev, [type]: num }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const weightArray = ASSESSMENT_TYPES
      .filter((t) => weights[t.value] !== undefined && weights[t.value] > 0)
      .map((t) => ({
        assessmentType: t.value,
        termId,
        classSubjectId,
        weight: weights[t.value],
      }));

    if (weightArray.length === 0) return;

    await bulkUpsert.mutateAsync(weightArray);
    setHasChanges(false);
  };

  const handleDelete = async (id: string) => {
    await deleteWeight.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Weights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading weights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Assessment Weights</CardTitle>
            <CardDescription>
              Configure how each assessment type contributes to the term grade
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || bulkUpsert.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {bulkUpsert.isPending ? 'Saving...' : 'Save Weights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total weight indicator */}
        <div className="mb-4 flex items-center gap-2">
          {totalWeight === 100 ? (
            <Badge className="bg-green-100 text-green-800">Total: 100%</Badge>
          ) : totalWeight > 100 ? (
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Total: {totalWeight}% (exceeds 100%)
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              Total: {totalWeight}% (should be 100%)
            </Badge>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment Type</TableHead>
              <TableHead>Weight (%)</TableHead>
              <TableHead className="w-20">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ASSESSMENT_TYPES.map((type) => {
              const existingWeight = weightsData?.data?.find(
                (w: any) => w.assessmentType === type.value
              );
              return (
                <TableRow key={type.value}>
                  <TableCell className="font-medium">{type.label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={weights[type.value] || ''}
                      onChange={(e) => handleWeightChange(type.value, e.target.value)}
                      placeholder="0"
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    {existingWeight && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(existingWeight.id)}
                        disabled={deleteWeight.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {totalWeight !== 100 && totalWeight > 0 && (
          <p className="mt-2 text-xs text-amber-600">
            Weights should total 100% for accurate term grade calculation.
          </p>
        )}
      </CardContent>
    </Card>
  );
}