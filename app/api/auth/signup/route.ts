import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { fullname, email, mobile, password } = await req.json();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    });
    // ✅ Create customer on Stripe
    const customer = await stripe.customers.create({
      email,
      name: fullname,
      phone: mobile || undefined,
    });
    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        mobile,
        password: hashedPassword,
         stripeCustomerId: customer.id,
      }
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error('Signup Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

