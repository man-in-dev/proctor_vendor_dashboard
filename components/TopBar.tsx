'use client';

import { useRouter } from 'next/navigation';

export default function TopBar() {
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">Vendor Portal</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium">Welcome, Vendor</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
        >
          <span>Logout</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}

