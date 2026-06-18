import { useUploadStatement, useConfirmReconciliation } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function ReconciliationUpload() {
  const uploadMutation = useUploadStatement();
  const confirmMutation = useConfirmReconciliation();
  const [file, setFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: (response) => {
        setUploadResult(response.data);
        setMatches(response.data?.data?.matches || []);
      },
    });
  };

  const handleConfirm = () => {
    confirmMutation.mutate({ matches });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Bank Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: Equity Bank, KCB, Co-operative Bank
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Statement
              </>
            )}
          </Button>

          {uploadResult?.data?.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-semibold mb-2">Upload Summary</h4>
              <p className="text-sm">Total transactions: {uploadResult.data.summary.total}</p>
              <p className="text-sm">Matched: {uploadResult.data.summary.matched}</p>
              <p className="text-sm">Unmatched: {uploadResult.data.summary.unmatched}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matches.map((match, idx) => (
                <div key={idx} className="border rounded-md p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{match.invoiceNo}</p>
                    <p className="text-sm text-gray-600">
                      {match.studentName} • KES {match.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      Confidence: {match.confidence}
                    </p>
                  </div>
                  <CheckCircle className={`h-5 w-5 ${match.confidence === 'HIGH' ? 'text-green-500' : 'text-yellow-500'}`} />
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm All Matches
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
