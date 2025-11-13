import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useBulkCreateUsers } from '@/hooks/use-users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BulkUserUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  successful: number;
  failed: number;
  errors: Array<{ row: number; data: any; error: string }>;
}

export function BulkUserUploadModal({ open, onOpenChange }: BulkUserUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { mutate: bulkCreateUsers } = useBulkCreateUsers();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        setUploadResult(null);
      }
    };
  
    const downloadTemplate = () => {
      const template = [
        'email,password,firstName,lastName,middleName,phone,idNumber,role,schoolId',
        'john.doe@example.com,TempPass123!,John,Doe,Michael,+254712345678,12345678,TEACHER,school-uuid-here',
        'jane.smith@example.com,TempPass123!,Jane,Smith,,+254712345679,87654321,STUDENT,school-uuid-here',
      ].join('\n');
  
      const blob = new Blob([template], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_users_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };
  
    const parseCSV = (csvText: string): any[] => {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];
  
      const headers = lines[0].split(',').map(h => h.trim());
      const users = [];
  
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const user: any = {};
        headers.forEach((header, index) => {
            const value = values[index];
            if (value && value !== '') {
              user[header] = value;
            }
          });
    
          if (user.email && user.firstName && user.lastName) {
            users.push(user);
          }
        }
    
        return users;
      };
    
      const handleUpload = async () => {
        if (!file) return;
    
        setUploading(true);
        setUploadResult(null);
    
        try {
          const text = await file.text();
          const users = parseCSV(text);
    
          if (users.length === 0) {
            throw new Error('No valid users found in file');
          }
    
          bulkCreateUsers(users, {
            onSuccess: (data) => {
              setUploadResult({
                successful: data.successful.length,
                failed: data.failed.length,
                errors: data.failed,
            });
            setUploading(false);
            if (data.failed.length === 0) {
              setTimeout(() => {
                onOpenChange(false);
                setFile(null);
                setUploadResult(null);
              }, 2000);
            }
          },
          onError: (error) => {
            setUploadResult({
              successful: 0,
              failed: users.length,
              errors: [{ row: 0, data: {}, error: error.message }],
            });
            setUploading(false);
          },
        });
      } catch (error: any) {
        setUploadResult({
          successful: 0,
          failed: 0,
          errors: [{ row: 0, data: {}, error: error.message }],
        });
        setUploading(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload Users
          </DialogTitle>
          <DialogDescription>
            Upload multiple users at once using a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the CSV template below</li>
                <li>Fill in the user information (one user per row)</li>
                <li>Save the file and upload it here</li>
                <li>Review the results and fix any errors</li>
              </ol>
              <div className="mt-4">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Required Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Fields</CardTitle>
              <CardDescription>These fields must be included for each user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>email</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>firstName</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>lastName</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>role</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Optional fields: middleName, phone, idNumber, password, schoolId
              </p>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading users...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Results */}
          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.successful > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Successfully created {uploadResult.successful} user(s)
                  </AlertDescription>
                </Alert>
              )}

              {uploadResult.failed > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription>
                  Failed to create {uploadResult.failed} user(s)
                  </AlertDescription>
                </Alert>
              )}

              {uploadResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Error Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadResult.errors.map((error, idx) => (
                        <div key={idx} className="p-2 border rounded-lg text-sm">
                          <p className="font-medium text-destructive">
                            Row {error.row || 'Unknown'}: {error.error}
                          </p>
                          {error.data && Object.keys(error.data).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Data: {JSON.stringify(error.data)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setUploadResult(null);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload Users'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}