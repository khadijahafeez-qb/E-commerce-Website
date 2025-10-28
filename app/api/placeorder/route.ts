
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

export interface OrderItem {
  productId: string;
  id: string,
  count: number;
  price: number;
  title: string;
}
const prisma = new PrismaClient();
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    const { cartItems, total } = await req.json();
    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
    if (!user.stripeCustomerId) {
      return new Response(JSON.stringify({ error: 'User has no Stripe account' }), { status: 400 });
    }
    const stripeCustomerId = user.stripeCustomerId;
    // Create Checkout Session
    const subtotal = cartItems.reduce((acc: number, item: OrderItem) => acc + item.price * item.count, 0);
    const tax = Math.round(subtotal * 0.10 * 100); // in cents
    const stripe_session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        ...cartItems.map((item: OrderItem) => ({
          price_data: {
            currency: 'usd',
            product_data: { name: item.title },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.count,
        })),
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Tax (10%)' },
            unit_amount: tax,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/user/frontend/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/user/frontend/shopping-cart`,
      automatic_tax: { enabled: false },
      payment_intent_data: {
        receipt_email: user.email, // ensure Stripe sends the receipt
      },
    });
    // Create order in DB as pending
    // 8️⃣ Transaction: decrease stock + create order atomically
    const newOrder = await prisma.$transaction(async (tx) => {
      // Validate & update stock
      for (const item of cartItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.id },
        });
        if (!variant) {
          throw new Error(`Variant not found for ${item.title}`);
        }
        if (variant.stock < item.count) {
          throw new Error(`Insufficient stock for ${item.title}`);
        }

        await tx.productVariant.update({
          where: { id: item.id },
          data: { stock: { decrement: item.count } },
        });
      }

      // Create order and related items
      const order = await tx.order.create({
        data: {
          userId: user.id,
          total,
          stripeSessionId: stripe_session.id,
          status: 'PENDING',
          items: {
            create: cartItems.map((item: OrderItem) => ({
              product: { connect: { id: item.productId } },
              variant: { connect: { id: item.id } },
              quantity: item.count,
              price: item.price,
            })),
          },
        },
      });

      return order;
    });
    return new Response(JSON.stringify({ url: stripe_session.url, orderId: newOrder.id }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500 });
  } finally {
    await prisma.$disconnect(); // ✅ Always close connection
  }
}


