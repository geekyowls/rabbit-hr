'use client';

import ForgotPasswordForm from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex flex-col justify-center space-y-6 w-96">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
