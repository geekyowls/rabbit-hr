import { toast as baseToast } from '@/components/ui/use-toast';
import { ReactNode } from 'react';

export const toast = {
  show: ({
    title,
    description,
    variant = 'default',
  }: {
    title?: string;
    description?: string | ReactNode;
    variant?: 'default' | 'success' | 'error' | 'info';
  }) => {
    baseToast({
      title,
      description,
      variant,
    });
  },

  success: (title: string, description?: string | ReactNode) => {
    baseToast({
      title,
      description,
      variant: 'success',
    });
  },

  error: (title: string, description?: string | ReactNode) => {
    baseToast({
      title,
      description,
      variant: 'error',
    });
  },

  info: (title: string, description?: string | ReactNode) => {
    baseToast({
      title,
      description,
      variant: 'info',
    });
  },
};
