'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectApiKeysSettings() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=api-keys');
  }, [router]);

  return null;
}
