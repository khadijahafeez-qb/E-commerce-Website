import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'No user found' }, { status: 404 });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedToken, resetTokenExpires: expires },
    });

    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}&email=${email}`;

    await sendMail(
      email,
      'Password Reset Request',
      `<p>Click the link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`
    );

    return NextResponse.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
