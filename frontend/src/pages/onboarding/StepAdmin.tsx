import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { OnboardingFormData } from './types';

export function StepAdmin() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const e = errors.admin ?? {};

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create the first administrator account. You'll use these credentials to log in.
      </p>

      {/* First + Last name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="a-first">
            First name <span className="text-red-500">*</span>
          </Label>
          <Input id="a-first" {...register('admin.firstName')} placeholder="Jane" />
          {e.firstName && (
            <p className="text-xs text-red-500">{e.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-last">
            Last name <span className="text-red-500">*</span>
          </Label>
          <Input id="a-last" {...register('admin.lastName')} placeholder="Wanjiku" />
          {e.lastName && (
            <p className="text-xs text-red-500">{e.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Middle name */}
      <div className="space-y-1">
        <Label htmlFor="a-middle">
          Middle name{' '}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="a-middle"
          {...register('admin.middleName')}
          placeholder="Muthoni"
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <Label htmlFor="a-email">
          Email address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="a-email"
          type="email"
          autoComplete="username"
          {...register('admin.email')}
          placeholder="admin@school.ac.ke"
        />
        {e.email && <p className="text-xs text-red-500">{e.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1">
        <Label htmlFor="a-password">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="a-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="pr-10"
            {...register('admin.password')}
            placeholder="Min. 8 chars with upper, lower, number, symbol"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {e.password && (
          <p className="text-xs text-red-500">{e.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          At least 8 characters with uppercase, lowercase, number and special
          character (!@#$%…).
        </p>
      </div>

      {/* Phone + ID number */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="a-phone">
            Phone{' '}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="a-phone"
            {...register('admin.phone')}
            placeholder="+254 700 000 000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="a-id">
            National ID / Passport{' '}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="a-id"
            {...register('admin.idNumber')}
            placeholder="12345678"
          />
        </div>
      </div>
    </div>
  );
}
