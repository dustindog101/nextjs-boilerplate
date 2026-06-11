"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { withAuth } from '../../../components/withAuth';
import { Spinner } from '../../../components/ui/Spinner';

function PayInvoiceRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  useEffect(() => {
    if (orderId) {
      router.replace(`/orders?pay=${orderId}`);
    } else {
      router.replace('/orders');
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-[var(--accent)]" />
    </div>
  );
}

export default withAuth(PayInvoiceRedirectPage);
