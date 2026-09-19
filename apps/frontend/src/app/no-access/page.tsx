'use client';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function NoAccessPage() {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md px-6 py-8 bg-white rounded-2xl shadow-sm border text-center">
        <LockClosedIcon className="w-12 h-12 mx-auto text-red-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          You do not have permission to access this page.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={goBack}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Go Back
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
