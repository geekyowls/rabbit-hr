'use client';

import { ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from '@/contexts/session-context';

export default function Page() {
  const { logout } = useSession();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-orange-300 to-transparent dark:from-orange-900 opacity-25" />
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg text-center max-w-md w-full z-10">
        <ClockIcon className="h-16 w-16 text-orange-500 mb-6 mx-auto" />
        <h1 className="text-3xl font-bold mb-4 dark:text-white">
          Account Pending
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your account is currently pending approval. Please contact support if
          you have any questions.
        </p>
        <div className="flex justify-center space-x-6 mb-8">
          <Link
            href="mailto:support@example.com"
            className="bg-gradient-to-r from-gray-700 to-black dark:from-gray-600 dark:to-gray-800 text-white px-6 py-2 rounded-lg text-base font-medium hover:from-gray-600 hover:to-gray-900 transition duration-300 inline-flex items-center shadow-md"
          >
            <EnvelopeIcon className="size-4 mr-2" />
            Email
          </Link>
          <Link
            href="tel:+1234567890"
            className="bg-gradient-to-r from-gray-700 to-black dark:from-gray-600 dark:to-gray-800 text-white px-6 py-2 rounded-lg text-base font-medium hover:from-gray-600 hover:to-gray-900 transition duration-300 inline-flex items-center shadow-md"
          >
            <PhoneIcon className="size-4 mr-2" />
            Call
          </Link>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-center mb-8">
          <InformationCircleIcon className="size-6 text-blue-500 dark:text-blue-400 mr-2" />
          <p className="text-blue-800 dark:text-blue-200 text-sm text-left">
            If your account access issues have been resolved, please log out and
            try logging in again.
          </p>
        </div>
        <Button
          onClick={logout}
          className="bg-gradient-to-r from-gray-700 to-black dark:from-gray-600 dark:to-gray-600 text-white px-6 py-5 rounded-lg text-base font-medium hover:from-gray-600 hover:to-gray-900 transition duration-300 inline-flex items-center shadow-md"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
