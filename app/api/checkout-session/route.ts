// app/api/checkout-session/route.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return new Response(JSON.stringify({ error: 'No session ID' }), { status: 400 });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return new Response(JSON.stringify({ session, orderId: session.client_reference_id || null }));
}
