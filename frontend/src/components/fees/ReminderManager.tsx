import { useSendReminder, useGetReminderHistory, useGetReminderStats } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, History } from 'lucide-react';
import { useState } from 'react';

interface ReminderManagerProps {
  invoiceId: string;
}

export function ReminderManager({ invoiceId }: ReminderManagerProps) {
  const sendMutation = useSendReminder();
  const { data: history } = useGetReminderHistory(invoiceId);
  const { data: stats } = useGetReminderStats();
  const [method, setMethod] = useState<'SMS' | 'EMAIL' | 'PUSH' | 'SYSTEM'>('EMAIL');

  const handleSend = () => {
    sendMutation.mutate({ invoiceId, method, reminderType: 'PAYMENT_DUE' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Send Reminder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="PUSH">Push Notification</option>
              <option value="SYSTEM">System (In-App)</option>
            </select>
          </div>

          <Button onClick={handleSend} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Reminder
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {history?.data && history.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Reminder History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.data.map((reminder: any) => (
                <div key={reminder.id} className="border rounded-md p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{reminder.reminderType}</p>
                      <p className="text-gray-600">Method: {reminder.method}</p>
                      <p className="text-xs text-gray-500">
                        Sent: {reminder.sentAt ? new Date(reminder.sentAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      reminder.status === 'SENT' ? 'bg-green-100 text-green-800' :
                      reminder.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reminder.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Reminder Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{stats.data.totalSent || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.data.successRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
