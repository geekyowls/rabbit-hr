'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export type SignupStep =
  'email' | 'otp' | 'details' | 'context' | 'welcome' | 'waitlist-thanks';

const STEPS: { key: SignupStep; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'otp', label: 'Verify' },
  { key: 'details', label: 'Profile' },
  { key: 'context', label: 'About You' },
  { key: 'welcome', label: 'Get Started' },
];

export function SignupStepper({ currentStep }: { currentStep: SignupStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  if (currentStep === 'email' || currentStep === 'waitlist-thanks') return null;

  return (
    <div className="mb-6 px-4">
      <div className="flex items-start">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isCurrentLast = isCurrent && currentIndex === STEPS.length - 1;

          return (
            <div key={step.key} className="contents">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    isCompleted && 'bg-green-600 text-white dark:bg-green-500',
                    isCurrent &&
                      !isCurrentLast &&
                      'border-2 border-primary bg-primary text-primary-foreground',
                    isCurrentLast &&
                      'border-2 border-green-600 bg-background text-muted-foreground/50 dark:border-green-500',
                    !isCompleted &&
                      !isCurrent &&
                      'border-2 border-muted-foreground/30 bg-background text-muted-foreground/50',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-center text-[10px] font-medium transition-colors duration-300',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    !isCompleted && !isCurrent && 'text-muted-foreground/50',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    '-mx-1 mt-4 h-[2px] flex-1 rounded-full transition-colors duration-300',
                    index < currentIndex
                      ? 'bg-green-600 dark:bg-green-500'
                      : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
