import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGoHome = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          You don't have permission to access this resource.
        </p>

        {/* User Info */}
        {user && (
          <p className="text-sm text-gray-500 mb-8">
            Your role: <span className="font-semibold text-gray-700">{user.role.replace(/_/g, ' ')}</span>
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-8">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
