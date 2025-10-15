'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { notification } from 'antd';

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    if (id) {
      setSessionId(id);
      // Optionally: fetch the session from your API to confirm payment
      fetch(`/api/checkout-session?session_id=${id}`)
        .then(res => res.json())
        .then(data => {
          notification.success({
            message: 'Payment Successful',
            description: `Your order ${data.orderId} is confirmed!`,
          });
        });
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto mt-20 text-center">
      <h1 className="text-2xl font-bold">Payment Success</h1>
      {sessionId ? (
        <p>Your payment session ID</p>
      ) : (
        <p>No session found.</p>
      )}
    </div>
  );
};

export default SuccessPage;
