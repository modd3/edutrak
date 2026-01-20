// src/components/grades/CSVUpload.tsx

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCSVUpload } from '@/hooks/use-grades';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface CSVUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
}

export function CSVUpload({ open, onOpenChange, assessmentId }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useCSVUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 2) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim();
        });
        data.push({
          studentAdmissionNo: row['admission no'] || row['admissionno'] || row['adm no'],
          marks: parseFloat(row['marks'] || row['score']),
          comment: row['comment'] || row['remarks'] || undefined,
        });
      }
    }
    return data;
  };

  const handleUpload = async () => {
    if (!file) return;

    const text = await file.text();
    const data = parseCSV(text);

    const result = await uploadMutation.mutateAsync({
      assessmentId,
      data,
    });

    setUploadResult(result.data);
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Grades via CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student admission numbers and marks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose CSV File
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  CSV format: Admission No, Marks, Comment (optional)
                </p>
              </div>
            ) : (
              <div>
                <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                <p className="mt-2 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Different File
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <Progress value={50} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                Processing grades...
              </p>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-4">
              <Alert
                variant={uploadResult.failed === 0 ? 'default' : 'destructive'}
              >
                {uploadResult.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Upload Complete</AlertTitle>
                <AlertDescription>
                  Successfully uploaded {uploadResult.successful} grades.
                  {uploadResult.failed > 0 && ` ${uploadResult.failed} failed.`}
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h4 className="font-semibold text-sm mb-2">Errors:</h4>
                  <ul className="space-y-1">
                    {uploadResult.errors.map((error: any, index: number) => (
                      <li key={index} className="text-sm text-red-600">
                        Row {error.row}: {error.admissionNo} - {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}

          {/* CSV Format Help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">CSV Format Example:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`Admission No,Marks,Comment
STU-2024-00001,85,Excellent work
STU-2024-00002,78,Good effort
STU-2024-00003,92,Outstanding`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
