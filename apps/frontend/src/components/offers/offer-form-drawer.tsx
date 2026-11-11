'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod/v4';
import { Check } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { cn } from '@/lib/utils';
import { DetailDrawer } from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const OFFER_CANDIDATES = [
  { name: 'Hannah Kim', role: 'Frontend Engineer', department: 'Engineering' },
  { name: 'Lucas Becker', role: 'DevOps Engineer', department: 'Engineering' },
  {
    name: 'Ishita Rao',
    role: 'Product Manager, Growth',
    department: 'Product',
  },
  { name: 'Daniel Okafor', role: 'Data Analyst', department: 'Data' },
  { name: 'Clara Novak', role: 'Product Designer', department: 'Design' },
  { name: 'Mateo Garcia', role: 'Sales Executive', department: 'Sales' },
];

export const OFFER_APPROVERS = [
  'Vikram Joshi',
  'Rohit Sharma',
  'Finance',
  'People lead',
  'CEO',
];
const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Data',
  'Product',
  'Marketing',
  'Sales',
  'People',
];
const LOCATIONS = [
  'Remote',
  'Bengaluru',
  'London',
  'Berlin',
  'Austin',
  'Singapore',
];
const CURRENCIES = ['₹', '$', '£', '€', 'S$'];

const schema = z.object({
  candidate: z.string().min(1, 'Select a candidate'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Select a department'),
  location: z.string().min(1, 'Select a location'),
  currency: z.string().min(1),
  salary: z.string().min(1, 'Base salary is required'),
  equity: z.string().optional(),
  startDate: z.string().min(1, 'Pick a start date'),
  approvers: z.array(z.string()).min(1, 'Add at least one approver'),
  notes: z.string().optional(),
});

export type OfferFormValues = z.infer<typeof schema>;

const DEFAULTS: OfferFormValues = {
  candidate: '',
  role: '',
  department: '',
  location: '',
  currency: '₹',
  salary: '',
  equity: '',
  startDate: '',
  approvers: ['Vikram Joshi', 'Finance'],
  notes: '',
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PlainSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('h-9', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OfferFormDrawer({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OfferFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    onSubmit(values);
    onOpenChange(false);
  });

  const pickCandidate = (name: string) => {
    const match = OFFER_CANDIDATES.find((c) => c.name === name);
    if (match) {
      setValue('role', match.role, { shouldValidate: true });
      setValue('department', match.department, { shouldValidate: true });
    }
  };

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="New offer"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>
            Create draft
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={submit}>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Candidate</h3>
          <Field label="Candidate" error={errors.candidate?.message}>
            <Controller
              name="candidate"
              control={control}
              render={({ field }) => (
                <PlainSelect
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    pickCandidate(v);
                  }}
                  options={OFFER_CANDIDATES.map((c) => c.name)}
                  placeholder="Select candidate"
                />
              )}
            />
          </Field>
          <Field label="Role" error={errors.role?.message}>
            <Input className="h-9" {...register('role')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" error={errors.department?.message}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <PlainSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={DEPARTMENTS}
                    placeholder="Select department"
                  />
                )}
              />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <PlainSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={LOCATIONS}
                    placeholder="Select location"
                  />
                )}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Compensation</h3>
          <Field label="Base salary" error={errors.salary?.message}>
            <div className="flex gap-2">
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <PlainSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={CURRENCIES}
                    className="w-20"
                  />
                )}
              />
              <Input
                className="h-9 flex-1"
                placeholder="38,00,000"
                {...register('salary')}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Equity">
              <Input
                className="h-9"
                placeholder="2,000 RSU"
                {...register('equity')}
              />
            </Field>
            <Field label="Start date" error={errors.startDate?.message}>
              <Input type="date" className="h-9" {...register('startDate')} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Approvals</h3>
          <Field label="Approvers, in order" error={errors.approvers?.message}>
            <Controller
              name="approvers"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {OFFER_APPROVERS.map((a) => {
                    const selected = field.value.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((x) => x !== a)
                              : [...field.value, a],
                          )
                        }
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[13px]',
                          selected
                            ? 'border-[#3F6650]/40 bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/20 dark:text-[#8FBFA1]'
                            : 'border-border text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        {a}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Field>
          <Field label="Notes for approvers">
            <Textarea
              rows={3}
              placeholder="Context on level, band position or competing offers"
              {...register('notes')}
            />
          </Field>
        </section>
      </form>
    </DetailDrawer>
  );
}
