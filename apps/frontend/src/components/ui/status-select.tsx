import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type StatusType = {
  value: string;
  label: string;
  variant: 'success' | 'error' | 'warning';
};

interface StatusSelectProps {
  value: string;
  options: StatusType[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

const getStatusStyles = (variant: StatusType['variant']) => {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
  }
};

export function StatusSelect({
  value,
  options,
  disabled,
  onValueChange,
}: StatusSelectProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select
      defaultValue={value}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="h-8 w-fit rounded-full text-xs">
        <SelectValue>
          {selectedOption && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                selectedOption.variant,
              )}`}
            >
              {selectedOption.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-xl border-gray-100 shadow-sm">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                option.variant,
              )}`}
            >
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
