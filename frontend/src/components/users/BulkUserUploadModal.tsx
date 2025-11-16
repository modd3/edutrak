// components/users/BulkUserUploadModal.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useBulkCreateUsersWithProfiles } from '@/hooks/use-users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkUserUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  successful: number;
  failed: number;
  errors: Array<{ row?: number; data: any; error: string }>;
}

type UploadType = 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';

const ROLE_TEMPLATES = {
  STUDENT: {
    label: 'Students',
    role: 'STUDENT',
    requiredFields: ['email', 'firstName', 'lastName', 'admissionNo', 'gender'],
    optionalFields: ['middleName', 'phone', 'idNumber', 'dob', 'upiNumber', 'birthCertNo', 'county', 'subCounty'],
    template: [
      'email,password,firstName,lastName,middleName,phone,idNumber,schoolId,admissionNo,gender,dob,upiNumber,birthCertNo,county,subCounty',
      'john.student@school.com,Pass123!@#,John,Doe,Michael,+254712345678,12345678,school-uuid,STU2024001,MALE,2010-05-15,KE-2024-001,BC123456,Nairobi,Westlands',
      'jane.student@school.com,Pass123!@#,Jane,Smith,,+254712345679,87654321,school-uuid,STU2024002,FEMALE,2011-03-20,KE-2024-002,BC789012,Mombasa,Mvita',
    ],
  },
  TEACHER: {
    label: 'Teachers',
    role: 'TEACHER',
    requiredFields: ['email', 'firstName', 'lastName', 'tscNumber', 'employmentType'],
    optionalFields: ['middleName', 'phone', 'idNumber', 'qualification', 'specialization', 'dateJoined'],
    template: [
      'email,password,firstName,lastName,middleName,phone,idNumber,schoolId,tscNumber,employmentType,qualification,specialization,dateJoined',
      'john.teacher@school.com,Pass123!@#,John,Kamau,Mwangi,+254712345680,23456789,school-uuid,TSC123456,PERMANENT,Bachelor of Education,Mathematics,2020-01-15',
      'jane.teacher@school.com,Pass123!@#,Jane,Wanjiku,,+254712345681,34567890,school-uuid,TSC789012,CONTRACT,Master of Arts,English Literature,2021-09-01',
    ],
  },
  PARENT: {
    label: 'Parents/Guardians',
    role: 'PARENT',
    requiredFields: ['email', 'firstName', 'lastName', 'relationship'],
    optionalFields: ['middleName', 'phone', 'idNumber', 'occupation', 'employer', 'workPhone'],
    template: [
      'email,password,firstName,lastName,middleName,phone,idNumber,relationship,occupation,employer,workPhone',
      'john.parent@example.com,Pass123!@#,John,Kimani,Njoroge,+254712345682,45678901,Father,Doctor,Kenyatta Hospital,+254202345678',
      'mary.parent@example.com,Pass123!@#,Mary,Wambui,,+254712345683,56789012,Mother,Teacher,Nairobi Primary,+254202345679',
    ],
  },
  ADMIN: {
    label: 'Admins/Staff',
    role: 'ADMIN',
    requiredFields: ['email', 'firstName', 'lastName'],
    optionalFields: ['middleName', 'phone', 'idNumber', 'schoolId'],
    template: [
      'email,password,firstName,lastName,middleName,phone,idNumber,schoolId,role',
      'admin@school.com,Pass123!@#,Admin,User,,+254712345684,67890123,school-uuid,ADMIN',
      'support@school.com,Pass123!@#,Support,Staff,Helper,+254712345685,78901234,school-uuid,SUPPORT_STAFF',
    ],
  },
};

export function BulkUserUploadModal({ open, onOpenChange }: BulkUserUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>('STUDENT');
  const { mutate: bulkCreateUsers } = useBulkCreateUsersWithProfiles();

  const currentTemplate = ROLE_TEMPLATES[uploadType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const downloadTemplate = () => {
    const template = currentTemplate.template.join('\n');
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_${uploadType.toLowerCase()}_template.csv`;
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
      const userData: any = { user: {}, profile: {} };

      // Base user fields
      const userFields = ['email', 'password', 'firstName', 'lastName', 'middleName', 'phone', 'idNumber', 'schoolId', 'role'];
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value && value !== '') {
          if (userFields.includes(header)) {
            userData.user[header] = value;
          } else {
            // Profile fields
            userData.profile[header] = value;
          }
        }
      });

      // Set default role if not specified
      if (!userData.user.role) {
        userData.user.role = currentTemplate.role;
      }

      // Only include if has required fields
      if (userData.user.email && userData.user.firstName && userData.user.lastName) {
        users.push(userData);
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
          // Map errors and add row numbers
          const errorsWithRows = data.failed.map((item: any, index: number) => ({
            row: index + 2, // +2 because row 1 is header, starts from row 2
            data: item.data,
            error: item.error,
          }));

          setUploadResult({
            successful: data.successful.length,
            failed: data.failed.length,
            errors: errorsWithRows,
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
        onError: (error: any) => {
          setUploadResult({
            successful: 0,
            failed: users.length,
            errors: [{ row: undefined, data: {}, error: error.message }],
          });
          setUploading(false);
        },
      });
    } catch (error: any) {
      setUploadResult({
        successful: 0,
        failed: 0,
        errors: [{ row: undefined, data: {}, error: error.message }],
      });
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Users with Profiles
          </DialogTitle>
          <DialogDescription>
            Upload multiple users at once with their role-specific profile information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Upload Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select User Type</CardTitle>
                <CardDescription>Choose the type of users you want to upload</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={uploadType} onValueChange={(value) => setUploadType(value as UploadType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_TEMPLATES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="fields">Required Fields</TabsTrigger>
                <TabsTrigger value="example">Example</TabsTrigger>
              </TabsList>

              <TabsContent value="instructions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">How to Upload {currentTemplate.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Download the CSV template for {currentTemplate.label.toLowerCase()}</li>
                      <li>Fill in the user information (one user per row)</li>
                      <li>Ensure all required fields are completed</li>
                      <li>Save the file as CSV format</li>
                      <li>Upload it using the file selector below</li>
                      <li>Review the results and fix any errors if needed</li>
                    </ol>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" onClick={downloadTemplate} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download {currentTemplate.label} Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Field Requirements</CardTitle>
                    <CardDescription>Fields needed for {currentTemplate.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Required Fields
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.requiredFields.map((field) => (
                            <Badge key={field} variant="default" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          Optional Fields
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.optionalFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role-specific notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Important Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {uploadType === 'STUDENT' && (
                      <>
                        <p>• <strong>Gender</strong> must be either MALE or FEMALE</p>
                        <p>• <strong>Admission numbers</strong> will be auto-generated if not provided</p>
                        <p>• <strong>Date format</strong> for dob should be YYYY-MM-DD (e.g., 2010-05-15)</p>
                        <p>• <strong>UPI numbers</strong> will be auto-generated if not provided</p>
                      </>
                    )}
                    {uploadType === 'TEACHER' && (
                      <>
                        <p>• <strong>TSC Number</strong> must be unique for each teacher</p>
                        <p>• <strong>Employment Type</strong> must be: PERMANENT, CONTRACT, TEMPORARY, BOM, or PTA</p>
                        <p>• <strong>Date format</strong> for dateJoined should be YYYY-MM-DD</p>
                      </>
                    )}
                    {uploadType === 'PARENT' && (
                      <>
                        <p>• <strong>Relationship</strong> examples: Father, Mother, Guardian, Uncle, Aunt</p>
                        <p>• After upload, you'll need to link guardians to their students separately</p>
                      </>
                    )}
                    {uploadType === 'ADMIN' && (
                      <>
                        <p>• <strong>Role</strong> can be: ADMIN, SUPER_ADMIN, or SUPPORT_STAFF</p>
                        <p>• Admin users don't require profile information</p>
                      </>
                    )}
                    <p className="pt-2 border-t">• <strong>Password</strong> will default to "TempPass123!" if not provided</p>
                    <p>• All users should change their password on first login</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="example" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV Example for {currentTemplate.label}
                    </CardTitle>
                    <CardDescription>Sample data format</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {currentTemplate.template.join('\n')}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload CSV File</CardTitle>
                <CardDescription>Select your prepared CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Choose File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading and creating users...</span>
                    </div>
                    <Progress value={undefined} className="w-full" />
                  </div>
                )}

                {/* Upload Button */}
                {!uploading && file && (
                  <Button onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {currentTemplate.label}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {uploadResult && (
              <div className="space-y-4">
                {uploadResult.successful > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Successfully created {uploadResult.successful} {currentTemplate.label.toLowerCase()} with their profiles
                    </AlertDescription>
                  </Alert>
                )}

                {uploadResult.failed > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Errors Found</AlertTitle>
                    <AlertDescription>
                      Failed to create {uploadResult.failed} user(s). See details below.
                    </AlertDescription>
                  </Alert>
                )}

                {uploadResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Error Details ({uploadResult.errors.length})
                      </CardTitle>
                      <CardDescription>Review and fix these issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-64">
                        <div className="space-y-2">
                          {uploadResult.errors.map((error, idx) => (
                            <div key={idx} className="p-3 border border-destructive/50 rounded-lg text-sm">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium text-destructive">
                                    {error.row ? `Row ${error.row}: ` : ''}{error.error}
                                  </p>
                                  {error.data && Object.keys(error.data).length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                      {JSON.stringify(error.data, null, 2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Summary Stats */}
                {(uploadResult.successful > 0 || uploadResult.failed > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Upload Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {uploadResult.successful}
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-400">
                            Successful
                          </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {uploadResult.failed}
                          </div>
                          <div className="text-xs text-red-700 dark:text-red-400">
                            Failed
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

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
            {uploadResult?.successful > 0 && uploadResult?.failed === 0 ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}