import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Phone, Mail, RefreshCw, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';

// Map raw status strings to user-friendly labels
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspended', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PAST_DUE: { label: 'Past Due', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  CANCELED: { label: 'Canceled', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function SubscriptionExpired() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Read the status forwarded by the 402 response (stored temporarily in sessionStorage)
  const rawStatus = sessionStorage.getItem('subscription_status') || 'EXPIRED';
  const statusInfo = STATUS_LABELS[rawStatus] ?? { label: rawStatus, color: 'bg-red-100 text-red-700 border-red-200' };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleSignOut = () => {
    sessionStorage.removeItem('subscription_status');
    logout();
    navigate('/login', { replace: true });
  };

  const handleRetry = () => {
    sessionStorage.removeItem('subscription_status');
    window.location.href = '/dashboard';
  };

  const handleGoToSubscriptions = () => {
    sessionStorage.removeItem('subscription_status');
    window.location.href = '/subscriptions';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-red-600" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
              >
                Subscription {statusInfo.label}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {isAdmin ? 'Subscription Action Required' : 'Access Temporarily Unavailable'}
            </h1>

            {/* Role-specific message */}
            {isAdmin ? (
              <div className="space-y-4 text-left">
                <p className="text-gray-600 text-sm text-center">
                  Your school's subscription has <strong>{statusInfo.label.toLowerCase()}</strong>. You can still access
                  basic system navigation, but operational features are locked until the subscription is renewed.
                </p>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    Manage Subscription
                  </p>
                  <p className="text-xs text-orange-700">
                    Visit the subscriptions page to create a new subscription or update the existing one for your school.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    Contact Billing Support
                  </p>
                  <p className="text-xs text-blue-700">
                    To reactivate your subscription, please reach out to our billing team. Provide your school name
                    and the registered email address.
                  </p>
                  <a
                    href="mailto:billing@edutrak.app"
                    className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    billing@edutrak.app
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <p className="text-gray-600 text-sm text-center">
                  Your school's subscription is currently <strong>{statusInfo.label.toLowerCase()}</strong>. Access to
                  the system has been temporarily suspended.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    Please contact your <strong>school administrator</strong> to resolve the subscription status and
                    regain access.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              {isAdmin && (
                <>
                  <Button
                    onClick={handleGoToSubscriptions}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscriptions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Dashboard Again
                  </Button>
                </>
              )}

              <Button
                onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          EduTrak School Management System &mdash; If this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
