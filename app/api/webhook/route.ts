import { PrismaClient } from '@prisma/client';
import { sendMail } from '@/lib/nodemailer';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new Response('Stripe not configured', { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' });
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      return new Response(`Webhook Error: ${message}`, { status: 400 });
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      let email = session.customer_email as string | undefined;
      if (!email && session.customer) {
        const customer = await stripe.customers.retrieve(session.customer as string);
        email = (customer as Stripe.Customer).email ?? undefined;
      }
      if (session.payment_status === 'paid' && email) {
        await prisma.order.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: 'PAID' },
        });
        try {
          await sendMail(
            email,
            'Your Order is Confirmed!',
            `<p>Thank you for your purchase!</p>`
          );
        } catch (err) {
          console.error('Error sending email:', err);
        }
      }
    }
    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}
