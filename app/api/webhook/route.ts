import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Payment completed

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      // Update order using stripeSessionId
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: 'PAID' },
      });
    }
  }


  return new Response(JSON.stringify({ received: true }));
}
