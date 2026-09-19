'use client';

import { Accordion } from '@/components/ui/accordion';
import { PermissionSection } from './permission-section';
import { PERMISSION_UI_SECTIONS } from './permission-ui-config';

interface PermissionPickerProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({
  selected,
  onChange,
  disabled,
}: PermissionPickerProps) {
  const allSectionKeys = PERMISSION_UI_SECTIONS.map((s) => s.key);

  return (
    <Accordion type="multiple" defaultValue={allSectionKeys}>
      {PERMISSION_UI_SECTIONS.map((section) => (
        <PermissionSection
          key={section.key}
          section={section}
          selected={selected}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </Accordion>
  );
}
