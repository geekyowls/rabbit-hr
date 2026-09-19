'use client';

import { forwardRef, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

interface ProtectedNavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  'data-tour'?: string;
}

export const ProtectedNavLink = forwardRef<
  HTMLAnchorElement,
  ProtectedNavLinkProps
>(function ProtectedNavLink(
  { href, children, className, 'data-tour': dataTour, ...props },
  ref,
) {
  const router = useRouter();
  const { isDirty, confirmNavigation } = useUnsavedChanges();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty) return;
    e.preventDefault();
    confirmNavigation(() => {
      router.push(href);
    });
  };

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      className={className}
      data-tour={dataTour}
      prefetch={false}
      {...props}
    >
      {children}
    </Link>
  );
});
