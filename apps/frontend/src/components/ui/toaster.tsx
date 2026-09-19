'use client';

import { useToast } from '@/components/ui/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import {
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div
              className={cn(
                'flex items-start gap-4 py-2 px-1',
                !description && 'items-center',
              )}
            >
              {props.variant === 'success' && (
                <div
                  className={cn(
                    'rounded-full bg-white dark:bg-dark-background shadow-sm p-1.5',
                    !description && 'mt-0',
                  )}
                >
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
              )}
              {props.variant === 'error' && (
                <div
                  className={cn(
                    'rounded-full bg-white dark:bg-dark-background shadow-sm p-1.5',
                    !description && 'mt-0',
                  )}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
                </div>
              )}
              {props.variant === 'info' && (
                <div
                  className={cn(
                    'rounded-full bg-white dark:bg-dark-background shadow-sm p-1.5',
                    !description && 'mt-0',
                  )}
                >
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                </div>
              )}
              <div className={cn('grid gap-1', !description && 'py-0.5')}>
                {title && (
                  <ToastTitle className="text-[15px] font-medium leading-none text-gray-900 ">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {description}
                  </ToastDescription>
                )}
                {action && <div className="mt-2.5">{action}</div>}
              </div>
            </div>
            <ToastClose className="absolute right-3 top-3 rounded-md p-1 text-gray-400 opacity-100 transition-opacity hover:text-gray-900 dark:hover:text-gray-100 focus:opacity-100 focus:outline-none">
              <XMarkIcon className="h-4 w-4" />
            </ToastClose>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
