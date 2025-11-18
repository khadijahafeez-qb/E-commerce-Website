import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken, type JWT } from 'next-auth/jwt';
import dayjs from 'dayjs';
import { z, type ZodTypeAny } from 'zod';
import { signupSchema, forgotPasswordSchema, resetPasswordApiSchema } from '@/lib/validation/auth';
import { productSchema, variantSchema, productIdSchema, productQuerySchema } from './lib/validation/product';
import { orderdetailParamsSchema } from './lib/validation/orderdetail';
import { getOrdersSchema, updateOrderStatusSchema } from './lib/validation/order';


const validationMap = [
  { path: /^\/api\/auth\/signup$/, method: 'POST', schema: signupSchema },
  { path: /^\/api\/auth\/forgot-password$/, method: 'POST', schema: forgotPasswordSchema },
  { path: /^\/api\/auth\/reset-password$/, method: 'POST', schema: resetPasswordApiSchema },
  { path: /^\/api\/product\/add-product$/, method: 'POST', schema: productSchema },
  { path: /^\/api\/product\/add-variant\/.*$/, method: 'POST', schema: variantSchema },
  { path: /^\/api\/product\/delete-product\/.*$/, method: 'PATCH', schema: productIdSchema },
  { path: /^\/api\/product\/delete-product-variant\/.*$/, method: 'PATCH', schema: productIdSchema },
  { path: /^\/api\/product\/update-variant\/.*$/, method: 'PUT', schema: { param: productIdSchema, body: variantSchema }, paramIndex: -1 },
  { path: /^\/api\/product\/get-products$/, method: 'GET', query: productQuerySchema },
  { path: /^\/api\/orderdetail\/.*$/, method: 'GET', schema: orderdetailParamsSchema },
  { path: /^\/api\/order$/, method: 'GET', query: getOrdersSchema },
  { path: /^\/api\/order\/.*\/status$/, method: 'PATCH', schema: updateOrderStatusSchema, paramIndex: -2 },
];


const publicApiRoutes: RegExp[] = [
  /^\/api\/auth\//,
  /^\/api\/product\/get-products/,
  /^\/api\/webhook$/,
];

const adminApiRoutes: RegExp[] = [
  /^\/api\/product\/add-product$/,
  /^\/api\/product\/add-variant\/.*$/,
  /^\/api\/product\/delete-product\/.*$/,
  /^\/api\/product\/delete-product-variant\/.*$/,
  /^\/api\/product\/reactive-variant\/.*$/,
  /^\/api\/product\/update-product-title\/.*$/,
  /^\/api\/product\/update-variant\/.*$/,
  /^\/api\/product\/upload-products/,
  /^\/api\/order\/.*\/status$/,
];

const userApiRoutes: RegExp[] = [
  /^\/api\/placeorder$/,
  /^\/api\/checkout-session$/,
];
const sharedApiRoutes: RegExp[] = [
  /^\/api\/order$/,
  /^\/api\/orderdetail\/.*$/
];

function handleValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    const detailedErrors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return NextResponse.json({ error: 'Validation failed', details: detailedErrors }, { status: 400 });
  }
  return NextResponse.json({ error: 'Validation failed', details: (error as Error).message }, { status: 400 });
}


export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = Object.fromEntries(url.searchParams.entries());

  // Single token declaration for both API and frontend routes
  let token: JWT | null = null;
  console.log('token',token);

  if (path.startsWith('/api')) {
    const isPublicApi = publicApiRoutes.some((r) => r.test(path));

    if (!isPublicApi) {
      token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
      });
        console.log('in api token',token);

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Admin-only access
      if (adminApiRoutes.some((r) => r.test(path)) && token.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }

      // User-only access
      if (userApiRoutes.some((r) => r.test(path)) && token.role !== 'USER') {
        return NextResponse.json({ error: 'User only' }, { status: 403 });
      }

      if (sharedApiRoutes.some((r) => r.test(path))) {
        if (token.role !== 'ADMIN' && token.role !== 'USER') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    //zod validation
    const matched = validationMap.find(
      (rule) =>
        rule.method === req.method &&
        (rule.path instanceof RegExp ? rule.path.test(path) : rule.path === path)
    );

    if (matched) {
      try {
        if ('query' in matched && matched.query) {
          matched.query.parse(searchParams);
        }
        else if (req.method === 'GET' && matched.schema) {
          const id = path.split('/').pop();
          if ('parse' in matched.schema && typeof matched.schema.parse === 'function') {
            matched.schema.parse({ id });
          } else if ('param' in matched.schema) {
            matched.schema.param.parse({ id });
          }
        }
        else if ('param' in matched.schema && 'body' in matched.schema) {
          const parts = path.split('/');
          const index = matched.paramIndex ?? -1;
          const id = parts.at(index) as string;
          matched.schema.param.parse({ id });
          const clone = req.clone();
          const text = await clone.text();
          const body = text ? JSON.parse(text) : {};
          matched.schema.body.parse(body);
        }
        else if (['DELETE', 'PUT', 'PATCH'].includes(req.method)) {
          const schema = matched.schema as ZodTypeAny;
          const id = path.split('/').pop() as string;
          schema.parse({ id });
        }
        else {
          const schema = matched.schema as ZodTypeAny;
          const clone = req.clone();
          const text = await clone.text();
          const body = text ? JSON.parse(text) : {};
          schema.parse(body);
        }
        return NextResponse.next();
      } catch (err) {
        return handleValidationError(err);
      }
    }

    return NextResponse.next();
  }

  //  FRONTEND ROUTES 
  token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const publicPaths = ['/', '/auth/login', '/auth/signup', '/auth/reset-password', '/auth/forgot-password'];

  if (publicPaths.includes(path) || path.includes('uploads')) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (token.expire && dayjs(token.expire).isBefore(new Date())) {
    const res = NextResponse.redirect(new URL('/auth/login', req.url));
    res.cookies.set('__Secure-next-auth.session-token', '', { path: '/', expires: new Date(0) });
    res.cookies.set('next-auth.session-token', '', { path: '/', expires: new Date(0) });
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

// ---------------- Middleware config ----------------
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
