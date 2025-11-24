import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/nodemailer';
import { resetPasswordEmail } from '@/lib/templates/resetPasswordEmail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: 'If this email exists, a reset link has been sent.' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedToken, resetTokenExpires: expires },
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${email}`;
    await sendMail(
      email,
      'Password Reset Request',
      resetPasswordEmail(resetUrl)
    );
    return NextResponse.json({ message: 'Password reset link sent to your email' }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
