'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectProfileEdit() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/edit');
  }, [router]);

  return null;
}
