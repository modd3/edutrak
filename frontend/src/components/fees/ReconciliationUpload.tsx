import { useState } from 'react';
import { useUploadStatement, useConfirmReconciliation } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';

const CONFIDENCE_COLORS = {
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
} as const;

export function ReconciliationUpload() {
  const uploadMutation = useUploadStatement();
  const confirmMutation = useConfirmReconciliation();

  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  // Track which AUTO_CONFIRM matches are selected (all by default)
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResults(null); setSelected(new Set()); }
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: (res) => {
        const data = res.data?.data ?? res.data;
        setResults(data);
        // Pre-select all HIGH-confidence matches
        const autoIdx = new Set<number>();
        (data?.results ?? []).forEach((r: any, i: number) => {
          if (r.suggestedAction === 'AUTO_CONFIRM') autoIdx.add(i);
        });
        setSelected(autoIdx);
      },
    });
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleConfirm = () => {
    const allResults: any[] = results?.results ?? [];
    // Build the {invoiceId, amount} array the backend expects
    const matches = [...selected]
      .map(i => allResults[i])
      .filter(r => r?.invoiceId)
      .map(r => ({ invoiceId: r.invoiceId, amount: r.transaction.amount }));

    if (matches.length === 0) return;
    confirmMutation.mutate({ matches }, { onSuccess: () => { setResults(null); setFile(null); setSelected(new Set()); } });
  };

  const allResults: any[] = results?.results ?? [];
  const autoConfirm = allResults.filter(r => r.suggestedAction === 'AUTO_CONFIRM');
  const needsReview = allResults.filter(r => r.suggestedAction === 'REVIEW');
  const flagged = allResults.filter(r => r.suggestedAction === 'FLAG');

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Bank Statement</CardTitle>
          <CardDescription>
            Upload a CSV export from your bank. EduTrak will match deposits to outstanding invoices automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="csv-upload"
              className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors hover:bg-muted/50"
            >
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                {file ? file.name : 'Choose a CSV file — Equity, KCB, Co-op Bank supported'}
              </span>
              {file && (
                <button
                  type="button"
                  className="ml-auto shrink-0"
                  onClick={e => { e.preventDefault(); setFile(null); setResults(null); }}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
              <input id="csv-upload" type="file" accept=".csv" className="sr-only" onChange={handleFileChange} />
            </label>
            <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
              {uploadMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing…</>
                : <><Upload className="mr-2 h-4 w-4" />Process</>}
            </Button>
          </div>

          {results?.anomalies?.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{results.anomalies.length} anomaly detected:</strong> {results.anomalies[0]}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary strip */}
      {results && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Auto-matched', value: results.matched, color: 'text-green-600' },
            { label: 'Needs review', value: needsReview.length, color: 'text-amber-600' },
            { label: 'Unmatched', value: flagged.length, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Matches list */}
      {allResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Match Results</CardTitle>
                <CardDescription>{selected.size} of {autoConfirm.length} auto-matched selected for confirmation</CardDescription>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={selected.size === 0 || confirmMutation.isPending}
              >
                {confirmMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming…</>
                  : <><CheckCircle2 className="mr-2 h-4 w-4" />Confirm Selected ({selected.size})</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[480px] overflow-y-auto">
              {allResults.map((r: any, i: number) => {
                const isSelectable = r.suggestedAction !== 'FLAG' && r.invoiceId;
                const isSelected = selected.has(i);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-6 py-3.5 text-sm transition-colors ${isSelectable ? 'cursor-pointer hover:bg-muted/40' : 'opacity-60'} ${isSelected ? 'bg-muted/30' : ''}`}
                    onClick={() => isSelectable && toggleSelect(i)}
                  >
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'} ${!isSelectable ? 'invisible' : ''}`}>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{r.transaction?.description ?? 'Transaction'}</span>
                        <Badge variant={CONFIDENCE_COLORS[r.confidence as keyof typeof CONFIDENCE_COLORS] ?? 'outline'} className="text-xs shrink-0">
                          {r.confidence}
                        </Badge>
                        {r.suggestedAction === 'FLAG' && (
                          <Badge variant="destructive" className="text-xs shrink-0">Unmatched</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">{r.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium">KES {r.transaction?.amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.transaction?.transactionDate ? new Date(r.transaction.transactionDate).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
