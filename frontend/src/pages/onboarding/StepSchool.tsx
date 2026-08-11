import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KENYAN_COUNTIES_WITH_SUBCOUNTIES } from '@/lib/kenyanData';
import type { OnboardingFormData } from './types';

const COUNTIES = Object.keys(KENYAN_COUNTIES_WITH_SUBCOUNTIES).sort();

export function StepSchool() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const e = errors.school ?? {};
  const selectedCounty = watch('school.county');
  const subCounties = selectedCounty
    ? (KENYAN_COUNTIES_WITH_SUBCOUNTIES[selectedCounty] ?? [])
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tell us about your school. These details will appear on reports and invoices.
      </p>

      {/* School name */}
      <div className="space-y-1">
        <Label htmlFor="s-name">
          School name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="s-name"
          {...register('school.name')}
          placeholder="e.g. St. Mary's High School"
        />
        {e.name && <p className="text-xs text-red-500">{e.name.message}</p>}
      </div>

      {/* Type + Ownership */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            School type <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) =>
              setValue('school.type', v as OnboardingFormData['school']['type'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIMARY">Primary</SelectItem>
              <SelectItem value="SECONDARY">Secondary</SelectItem>
              <SelectItem value="TVET">TVET</SelectItem>
              <SelectItem value="SPECIAL_NEEDS">Special Needs</SelectItem>
              <SelectItem value="PRE_PRIMARY">Pre-Primary</SelectItem>
            </SelectContent>
          </Select>
          {e.type && <p className="text-xs text-red-500">{e.type.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>
            Ownership <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) =>
              setValue(
                'school.ownership',
                v as OnboardingFormData['school']['ownership'],
                { shouldValidate: true }
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="FAITH_BASED">Faith-based</SelectItem>
              <SelectItem value="NGO">NGO</SelectItem>
            </SelectContent>
          </Select>
          {e.ownership && (
            <p className="text-xs text-red-500">{e.ownership.message}</p>
          )}
        </div>
      </div>

      {/* Boarding + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Boarding status <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) =>
              setValue(
                'school.boardingStatus',
                v as OnboardingFormData['school']['boardingStatus'],
                { shouldValidate: true }
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAY">Day school</SelectItem>
              <SelectItem value="BOARDING">Boarding</SelectItem>
              <SelectItem value="BOTH">Day &amp; Boarding</SelectItem>
            </SelectContent>
          </Select>
          {e.boardingStatus && (
            <p className="text-xs text-red-500">{e.boardingStatus.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>
            School gender <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) =>
              setValue(
                'school.gender',
                v as OnboardingFormData['school']['gender'],
                { shouldValidate: true }
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOYS">Boys</SelectItem>
              <SelectItem value="GIRLS">Girls</SelectItem>
              <SelectItem value="MIXED">Mixed</SelectItem>
            </SelectContent>
          </Select>
          {e.gender && (
            <p className="text-xs text-red-500">{e.gender.message}</p>
          )}
        </div>
      </div>

      {/* County + Sub-county */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            County <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(v) => {
              setValue('school.county', v, { shouldValidate: true });
              setValue('school.subCounty', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent className="max-h-56 overflow-y-auto">
              {COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {e.county && (
            <p className="text-xs text-red-500">{e.county.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Sub-county</Label>
          <Select
            disabled={subCounties.length === 0}
            onValueChange={(v) => setValue('school.subCounty', v)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  subCounties.length ? 'Select sub-county' : 'Select county first'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-56 overflow-y-auto">
              {subCounties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="s-phone">Phone</Label>
          <Input
            id="s-phone"
            {...register('school.phone')}
            placeholder="+254 700 000 000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-email">School email</Label>
          <Input
            id="s-email"
            type="email"
            {...register('school.email')}
            placeholder="office@school.ac.ke"
          />
          {e.email && (
            <p className="text-xs text-red-500">{e.email.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1">
        <Label htmlFor="s-address">Postal / physical address</Label>
        <Input
          id="s-address"
          {...register('school.address')}
          placeholder="P.O. Box 123, Nairobi"
        />
      </div>
    </div>
  );
}
