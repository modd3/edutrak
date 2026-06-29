import { useState } from 'react';
import { useAuditLogs } from '@/hooks/use-audit';
import { AuditLogFilters } from '@/api/audit-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Search, Filter, RefreshCw, Download } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 20,
    offset: 0,
  });
  const [entityTypeInput, setEntityTypeInput] = useState('');
  const [actionInput, setActionInput] = useState<string>('ALL');

  const { data, isLoading, isError, refetch } = useAuditLogs({
    ...filters,
    entityType: entityTypeInput || undefined,
    action: actionInput === 'ALL' ? undefined : actionInput,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const page = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = Math.ceil(total / (filters.limit || 20));

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: (newPage - 1) * (prev.limit || 20),
    }));
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity Name', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'System',
      l.actorRole || 'N/A',
      l.action,
      l.entityType,
      l.entityName || l.entityId || 'N/A',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ipAddress || 'N/A',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            System Audit Logs
          </h1>
          <p className="text-muted-foreground">Track user activity, system security events, and entity audit trails</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={!logs.length} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Filter by Action</label>
              <Select value={actionInput} onValueChange={setActionInput}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Entity Type</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="e.g. Student, FeeInvoice, User"
                  value={entityTypeInput}
                  onChange={(e) => setEntityTypeInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setEntityTypeInput('');
                  setActionInput('ALL');
                  setFilters({ limit: 20, offset: 0 });
                }}
                className="gap-2 text-muted-foreground"
              >
                <Filter className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading audit entries...</div>
          ) : isError ? (
            <div className="text-center py-12 text-red-600">Failed to load audit logs. Please try again.</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No audit logs match your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.actor ? (
                          <div>
                            <p>{log.actor.firstName} {log.actor.lastName}</p>
                            <span className="text-xs text-muted-foreground">{log.actorRole}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-semibold">{log.entityType}</span>
                        {log.entityName && <span className="text-muted-foreground block text-xs">{log.entityName}</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ipAddress || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} items)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuditLogsPage;
