import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import axios from 'axios';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Make API call to login endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/login`,
        {
          email: data.email,
          password: data.password,
        }
      );

      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;

        // Store authentication data
        setAuth(user, token, refreshToken);

        // Show success message
        toast.success('Login successful!', {
          description: `Welcome back, ${user.firstName}!`,
        });

        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle different error scenarios
      if (error.response?.status === 401) {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password.',
        });
      } else if (error.response?.status === 403) {
        toast.error('Account deactivated', {
          description: 'Your account has been deactivated. Please contact support.',
        });
      } else if (error.response?.data?.message) {
        toast.error('Login failed', {
          description: error.response.data.message,
        });
      } else {
        toast.error('Login failed', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="text-blue-600" size={24} />
          </div>
          <span className="text-2xl font-bold">EduTrak</span>
        </div>

        <div className="text-white space-y-6">
          <h1 className="text-5xl font-bold leading-tight">
            Modern School
            <br />
            Management System
          </h1>
          <p className="text-xl text-blue-100">
            Supporting both CBC and 8-4-4 curricula with comprehensive
            student management, assessments, and reporting.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold">5,000+</p>
              <p className="text-blue-100 text-sm">Active Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold">200+</p>
              <p className="text-blue-100 text-sm">Teachers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-blue-100 text-sm">Schools</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-3xl font-bold">98%</p>
              <p className="text-blue-100 text-sm">Satisfaction</p>
            </div>
          </div>
        </div>

        <div className="text-blue-100 text-sm">
          © 2024 EduTrak. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
              </div>
            <span className="text-2xl font-bold text-gray-900">EduTrak</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors 
                  ${
                  errors.email
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 bg-white'
                  }`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
  
              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 
                      ${
                      errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Quick Login (Demo) */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Quick login for demo:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                // Auto-fill admin credentials
                handleSubmit(onSubmit)({
                  email: 'admin@school.com',
                    password: 'Admin123!',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  // Auto-fill teacher credentials
                  handleSubmit(onSubmit)({
                    email: 'teacher@school.com',
                    password: 'Teacher123!',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Teacher
              </button>
            </div>
          </div>

          {/* Support Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
                </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}