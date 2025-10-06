import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { resetPasswordApiSchema } from '@/lib/validation/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      return NextResponse.json({ errors }, { status: 400 });
    }
    const { email, token, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpires)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    const isTokenValid = await bcrypt.compare(token, user.resetToken);
    if (!isTokenValid || user.resetTokenExpires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetToken: null, resetTokenExpires: null },
    });
    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
