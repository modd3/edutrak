import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateBillingAccount} from '@/hooks/use-billing-account';
import { useSchoolContext, } from '@/hooks/use-school-context';
import { useSchools } from '@/hooks/use-schools';
import { ScrollArea } from '../ui/scroll-area';
import { School } from '@/types';

const billingAccountSchema = z.object({
  schoolId: z.string().min(1, 'School is required'),
  legalName: z.string().min(2, 'Legal name is required'),
  email: z.string().email("Please provide an Email!").optional(),
  Phone: z.string().min(2).optional(),
  TaxId: z.string().min(2, 'Enter Tax ID').optional(),
  country: z.string().min(2, 'Enter a country Name').optional().default("Kenya"),
  city: z.string().min(2, 'Enter a city name').optional(),
  addressLine1: z.string().min(2, 'Please Enter an Address').optional(),
  addressLine2: z.string().min(2, 'Please Enter an Address').optional(),
  prefferedCurrency: z.string().min(2, 'Enter a preffered currency').optional().default("KES"),
});

type CreateBillingAccountInput = z.infer<typeof billingAccountSchema>;

interface CreateBillingAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function CreateBillingAccountModal({
  open,
  onOpenChange,
  isLoading,
}: CreateBillingAccountModalProps) {
  const { schoolId, isSuperAdmin } = useSchoolContext();
  const schoolsData = useSchools();
  const createMutation = useCreateBillingAccount();

  const schools = schoolsData.data?.data
 
  const {
    watch, 
    handleSubmit, 
    reset, 
    setValue,
    register, 
    formState: { errors },
  } = useForm<CreateBillingAccountInput>({
    resolver: zodResolver(billingAccountSchema),
    defaultValues: {
      prefferedCurrency: "KES",
    },
  });

  const selectedSchool = watch("schoolId");
  const onSubmit = async (data: CreateBillingAccountInput) => {
    // Prefer the selected school when super admin, otherwise use context school
    const finalSchoolId = isSuperAdmin ? (selectedSchool ?? schoolId) : schoolId;
    if (!finalSchoolId) {
      return;
    }

    await createMutation.mutateAsync({
      schoolId:finalSchoolId,
      legalName: data.legalName,
      email: data.email,
      phone: data.Phone,
      taxId: data.TaxId,
      country: data.country,
      city: data.city,
      addressLine1: data.addressLine1 || "",
      addressLine2: data.addressLine2,

    });

    if (!createMutation.isPending) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Billing Account</DialogTitle>
          <DialogDescription>
            Set up a new Billing Account for your school
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
        <form id="billing-account-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* School Selection (only applicable when user is SUPER_ADMIN) */}
         {isSuperAdmin &&
          <div>
            <Label htmlFor="schoolId">Select School</Label>
            <Select
              value={selectedSchool}
              onValueChange={(value) => setValue('schoolId', value)}
              disabled={!isSuperAdmin || isLoading || createMutation.isPending}
            >
              <SelectTrigger id="schoolId">
                <SelectValue placeholder="Select a School" />
              </SelectTrigger>
              <SelectContent>
                {schools?.map((school: School) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schoolId && (
              <p className="text-red-600 text-sm mt-1">{errors.schoolId.message}</p>
            )}
          </div>}
        
          {/* Legal Name*/}
          <div>
            <Label htmlFor="legalName">Legal Name</Label>
            <Input
              id="legalName"
              type="text"
              {...register('legalName')}
              disabled={createMutation.isPending}
            />
            {errors.legalName && (
              <p className="text-red-600 text-sm mt-1">{errors.legalName.message}</p>
            )}
          </div>

          {/* email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={createMutation.isPending}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="text"
                {...register('Phone')}
                disabled={createMutation.isPending}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Tax ID */}
            <div>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                type="text"
                {...register('TaxId')}
                disabled={createMutation.isPending}
              />
              {errors.TaxId && (
                <p className="text-red-600 text-sm mt-1">{errors.TaxId.message}</p>
              )}
            </div>

            {/* country */}
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="contry"
                type="text"
                {...register('country')}
                disabled={createMutation.isPending}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.country?.message}</p>
              )}
            </div>

                   {/* city */}
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                {...register('city')}
                disabled={createMutation.isPending}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.city?.message}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                type="address"
                {...register('addressLine1')}
                disabled={createMutation.isPending}
              />
              {errors.addressLine1 && (
                <p className="text-red-600 text-sm mt-1">{errors.addressLine1.message}</p>
              )}
            </div>

             {/* Address Line 2 */}
            <div>
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                type="address"
                {...register('addressLine2')}
                disabled={createMutation.isPending}
              />
              {errors.addressLine2 && (
                <p className="text-red-600 text-sm mt-1">{errors.addressLine2?.message}</p>
              )}
            </div>

             {/* Address Line 1 */}
            <div>
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                type="address"
                {...register('addressLine1')}
                disabled={createMutation.isPending}
              />
              {errors.addressLine1 && (
                <p className="text-red-600 text-sm mt-1">{errors.addressLine1.message}</p>
              )}
            </div>

            </form>
            </ScrollArea>

          {/* Actions */}
         <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                     Cancel
                   </Button>
                   <Button type="submit" form="billing-account-form" disabled={isLoading}>
                     {isLoading ? 'Saving...' :  'Create Billing Account'}
                   </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
