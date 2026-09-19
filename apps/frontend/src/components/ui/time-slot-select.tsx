'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIME_SLOTS = [
  '6:00 AM',
  '6:30 AM',
  '7:00 AM',
  '7:30 AM',
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
];

interface TimeSlotSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isSlotDisabled?: (slot: string) => boolean;
}

export function TimeSlotSelect({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select time',
  isSlotDisabled,
}: TimeSlotSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TIME_SLOTS.map((slot) => (
          <SelectItem
            key={slot}
            value={slot}
            disabled={isSlotDisabled?.(slot) ?? false}
          >
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function parseTimeSlot(timeSlot: string): {
  hours: number;
  minutes: number;
} {
  const [time, period] = timeSlot.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

export function combineDateAndTime(date: Date, timeSlot: string): Date {
  const { hours, minutes } = parseTimeSlot(timeSlot);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
