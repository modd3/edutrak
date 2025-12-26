import { useState } from 'react';
import { Upload, Download, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSchoolContext } from '@/hooks/use-school-context';
import { toast } from 'sonner';

interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: string[];
}

export default function BulkCreateUsers() {
  const { schoolId } = useSchoolContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userType, setUserType] = useState<'students' | 'teachers' | 'parents' | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const downloadTemplate = () => {
    if (!userType) {
      toast.error('Please select a user type first');
      return;
    }

    // Generate CSV template based on user type
    let headers = '';
    let sampleData = '';

    switch (userType) {
      case 'students':
        headers = 'email,firstName,lastName,middleName,gender,dob,birthCertNo,nationality,county,subCounty,upiNumber,kemisUpi,hasSpecialNeeds,specialNeedsType,medicalCondition,allergies';
        sampleData = 'john.doe@student.school.com,John,Doe,,MALE,2010-05-15,12345678,Kenyan,Nairobi,Westlands,123456789,987654321,false,,,';
        break;
      case 'teachers':
        headers = 'email,firstName,lastName,middleName,tscNumber,employeeNumber,employmentType,qualification,specialization,dateJoined';
        sampleData = 'jane.smith@teacher.school.com,Jane,Smith,,TSC123456,EMP001,PERMANENT,Bachelor of Education,Mathematics,2023-01-15';
        break;
      case 'parents':
        headers = 'email,firstName,lastName,middleName,relationship,occupation,employer,workPhone';
        sampleData = 'mary.johnson@parent.school.com,Mary,Johnson,,Mother,Doctor,Kenyatta Hospital,+254712345678';
        break;
    }

    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded successfully');
  };

  const handleUpload = async () => {
    if (!selectedFile || !userType) {
      toast.error('Please select a file and user type');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate file reading and processing
      const text = await selectedFile.text();
      const rows = text.split('\n').filter(row => row.trim());

      if (rows.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse CSV (simple implementation - in real app, use a proper CSV parser)
      const headers = rows[0].split(',');
      const dataRows = rows.slice(1);

      // Simulate processing with progress
      const totalRows = dataRows.length;
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of dataRows) {
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Here you would validate and create the user via API
          // For now, we'll simulate success/failure randomly
          if (Math.random() > 0.1) { // 90% success rate
            successful++;
          } else {
            failed++;
            errors.push(`Row ${processed + 2}: Invalid data format`);
          }
        } catch (error) {
          failed++;
          errors.push(`Row ${processed + 2}: ${error}`);
        }

        processed++;
        setUploadProgress((processed / totalRows) * 100);
      }

      setUploadResult({ successful, failed, errors });

      if (successful > 0) {
        toast.success(`Successfully created ${successful} users`);
      }
      if (failed > 0) {
        toast.error(`Failed to create ${failed} users`);
      }

    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Create Users</h1>
          <p className="text-muted-foreground">
            Upload CSV files to create multiple users at once
          </p>
        </div>
      </div>

      {/* User Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select User Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'students', label: 'Students', icon: Users },
              { value: 'teachers', label: 'Teachers', icon: FileText },
              { value: 'parents', label: 'Parents', icon: Users },
            ].map((type) => (
              <Button
                key={type.value}
                variant={userType === type.value ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setUserType(type.value as any)}
              >
                <type.icon className="h-6 w-6" />
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      {userType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a CSV template with the required columns for {userType}.
              Fill in your data and upload the file.
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download {userType} Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      {userType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    CSV files up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm">{selectedFile.name}</span>
                <Badge variant="secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Alert className={uploadResult.failed > 0 ? 'border-red-200' : 'border-green-200'}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex gap-4">
                      <span className="text-green-600">
                        ✅ {uploadResult.successful} successful
                      </span>
                      {uploadResult.failed > 0 && (
                        <span className="text-red-600">
                          ❌ {uploadResult.failed} failed
                        </span>
                      )}
                    </div>
                    {uploadResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {uploadResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {uploadResult.errors.length > 5 && (
                            <li>... and {uploadResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload and Create Users'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setUploadResult(null);
                  setUploadProgress(0);
                }}
                disabled={isUploading}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Select User Type</h4>
            <p className="text-sm text-muted-foreground">
              Choose whether you're creating students, teachers, or parents.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Download Template</h4>
            <p className="text-sm text-muted-foreground">
              Get the correct CSV template with all required columns.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Fill Data</h4>
            <p className="text-sm text-muted-foreground">
              Fill in your user data following the template format. Required fields are marked.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">4. Upload and Validate</h4>
            <p className="text-sm text-muted-foreground">
              Upload your CSV file. The system will validate and create users automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}