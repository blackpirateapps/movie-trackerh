'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 text-[#A0A0A0] text-xs">
      <div className="animate-pulse">Redirecting to Settings Page...</div>
    </div>
  );
}
