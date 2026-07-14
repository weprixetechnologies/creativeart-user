'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReferralTrackerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ref = searchParams.get('ref');
    if (ref && ref.trim() !== '') {
      const code = ref.trim().toUpperCase();
      
      // Store referral code and the timestamp when it was captured
      localStorage.setItem('referralCode', code);
      localStorage.setItem('referralCapturedAt', String(Date.now()));
      console.log('[ReferralTracker] Saved referral code:', code);
    }
  }, [searchParams]);

  return null;
}

export default function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerContent />
    </Suspense>
  );
}
