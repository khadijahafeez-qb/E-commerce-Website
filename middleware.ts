import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dayjs from 'dayjs';
import { z } from 'zod';
import { signupSchema,forgotPasswordSchema,resetPasswordApiSchema} from '@/lib/validation/auth';

// Define which APIs need Zod validation
const validationMap = [
  {
    path: /^\/api\/auth\/signup$/,
    method: 'POST',
    schema: signupSchema,
  },
  {
    path: /^\/api\/auth\/forgot-password$/,
    method: 'POST',
    schema: forgotPasswordSchema,
  },
  {
    path: /^\/api\/auth\/reset-password$/,
    method: 'POST',
    schema: resetPasswordApiSchema,
  },

];

// Helper to handle validation errors
function handleValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    const { fieldErrors } = error.flatten();
    return NextResponse.json(
      { error: 'Validation failed', fields: fieldErrors },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: 'Validation failed', details: (error as Error).message },
    { status: 400 }
  );
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // ✅ Zod validation for API routes
  if (path.startsWith('/api')) {
    const matched = validationMap.find(
      (rule) =>
        rule.method === req.method &&
        (rule.path instanceof RegExp ? rule.path.test(path) : rule.path === path)
    );

    if (matched) {
      try {
        const clone = req.clone();
        const text = await clone.text();
        const body = text ? JSON.parse(text) : {};
        matched.schema.parse(body); // throws if invalid
      } catch (err) {
        return handleValidationError(err);
      }
    }

    return NextResponse.next();
  }

  // ✅ Auth token validation for normal routes
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/forgot-password',
  ];

  if (publicPaths.includes(path) || path.includes('uploads')) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (token.expire && dayjs(token.expire).isBefore(new Date())) {
    const res = NextResponse.redirect(new URL('/auth/login', req.url));
    res.cookies.set('__Secure-next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
    });
    res.cookies.set('next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
    });
    return res;
  }

  const sharedPrefixes = ['/user/frontend/orderdetails'];
  if (sharedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (path.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (path.startsWith('/user') && token.role !== 'USER') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

// Run middleware for all non-static routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
