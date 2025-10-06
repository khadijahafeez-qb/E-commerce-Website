import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dayjs from 'dayjs';

export default async function middleware( req: Request ) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = new URL(req.url);
  const path = url.pathname;

  console.log('path: ', path);
  const publicPaths = ['/',
     '/auth/login',
      '/auth/signup',
      '/auth/reset-password',
      '/auth/forgot-password'];
  if (publicPaths.includes(url.pathname) || url.pathname.includes('uploads')) {
    console.log('inside');
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (dayjs(token.expire).isBefore(new Date())) {
    const res = NextResponse.redirect(new URL('/auth/login', req.url));
    res.cookies.set('authjs.session-token', '', {
      path: '/',
      expires: new Date(0),
    });
    res.cookies.set('authjs.csrf-token', '', {
      path: '/',
      expires: new Date(0),
    });
    return res;
  }

  const sharedPrefixes = ['/user/frontend/orderdetails'];
  if (sharedPrefixes.some(prefix => path.startsWith(prefix))) {
  return NextResponse.next();
  }

  if (path.startsWith('/admin')) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  if (path.startsWith('/user')) {
    if (token.role !== 'USER') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [

    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
