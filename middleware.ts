// import { NextResponse,NextRequest} from 'next/server';
// import { getToken } from 'next-auth/jwt';
// import dayjs from 'dayjs';

// export default async function middleware( req: NextRequest ) {
  
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

//   console.log('Middleware token:', token);


//   const url = new URL(req.url);
//   const path = url.pathname;
 

//   const publicPaths = ['/',
//      '/auth/login',
//       '/auth/signup',
//       '/auth/reset-password',
//       '/auth/forgot-password'];
//   if (publicPaths.includes(url.pathname) || url.pathname.includes('uploads')) {

//     return NextResponse.next();
//   }

//   if (!token) {

//     return NextResponse.redirect(new URL('/auth/login', req.url));
//   }

//   if (dayjs(token.expire).isBefore(new Date())) {

//     const res = NextResponse.redirect(new URL('/auth/login', req.url));
//     res.cookies.set('authjs.session-token', '', {
//       path: '/',
//       expires: new Date(0),
//     });
//     res.cookies.set('authjs.csrf-token', '', {
//       path: '/',
//       expires: new Date(0),
//     });
//     return res;
//   }

//   const sharedPrefixes = ['/user/frontend/orderdetails'];
//   if (sharedPrefixes.some(prefix => path.startsWith(prefix))) {
//   return NextResponse.next();
//   }

//   if (path.startsWith('/admin')) {
//     if (token.role !== 'ADMIN') {
//       return NextResponse.redirect(new URL('/auth/login', req.url));
//     }
//   }

//   if (path.startsWith('/user')) {
//     if (token.role !== 'USER') {

//       return NextResponse.redirect(new URL('/auth/login', req.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [

//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// };
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dayjs from 'dayjs';

export async function middleware(req: NextRequest) {
  // ✅ Try to read token (works in both local & prod)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  // 🧩 Debug log — to verify token in both environments
  console.log('🔍 ENV:', process.env.NODE_ENV);
  console.log('🔑 Middleware token:', token ? 'Token found ✅' : 'No token ❌');
  if (token) {
    console.log('🧠 Token contents:', {
      email: token.email,
      role: token.role,
      exp: token.exp,
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;

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

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
