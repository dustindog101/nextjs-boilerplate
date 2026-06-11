/**
 * Guest pay-session — mints HMAC pay token for white-label / public track flows.
 */

export interface PaySession {
  payToken: string;
  expiresAt: string;
}

export async function createPaySession(orderId: string): Promise<PaySession> {
  const response = await fetch('/api/payments/pay-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Could not start pay session.');
  }
  return data as PaySession;
}
