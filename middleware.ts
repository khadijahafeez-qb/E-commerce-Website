import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dayjs from 'dayjs';
import { z, type ZodTypeAny } from 'zod';
import { signupSchema, forgotPasswordSchema, resetPasswordApiSchema } from '@/lib/validation/auth';
import { productSchema, variantSchema, productIdSchema, productQuerySchema } from './lib/validation/product';
import { orderdetailParamsSchema } from './lib/validation/orderdetail';
import { getOrdersSchema,updateOrderStatusSchema } from './lib/validation/order';

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
  {
    path: /^\/api\/product\/add-product$/, // 👈 your new route for product creation
    method: 'POST',
    schema: productSchema,
  },
  {
    path: /^\/api\/product\/add-variant\/.*$/, // 👈 your new route for product creation
    method: 'POST',
    schema: variantSchema,
  },
  {
    path: /^\/api\/product\/delete-product\/.*$/,
    method: 'PATCH',
    schema: productIdSchema,
  },
  {
    path: /^\/api\/product\/delete-product-variant\/.*$/,
    method: 'PUT',
    schema: productIdSchema,
  },
  {
    path: /^\/api\/product\/update-product\/.*$/,
    method: 'PUT',
    schema: {
      param: productIdSchema,
      body: variantSchema,
    },
  },
  {
    path: /^\/api\/product\/get-products$/, // exact path for GET products
    method: 'GET',
    query: productQuerySchema, // ✅ add query validation
  },
  {
    path: /^\/api\/orderdetail\/.*$/,
    method: 'GET',
    schema: orderdetailParamsSchema,
  },
    {
    path: /^\/api\/order$/, 
    method: 'GET',
    query: getOrdersSchema, // ✅ validate query params like page, limit, search
  },
  {
    path: /^\/api\/order\/.*\/status$/, 
    method: 'PATCH',
    schema: updateOrderStatusSchema, // ✅ validate params + body
  },



];

function handleValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    const detailedErrors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    return NextResponse.json(
      { error: 'Validation failed', details: detailedErrors },
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
  const searchParams = Object.fromEntries(url.searchParams.entries());

    // ✅ List of public API paths that DON’T require token
  const publicApiPaths = [
    /^\/api\/auth\//, // login, signup, forgot-password, etc.
     /^\/api\/webhook$/,
  ];

  if (path.startsWith('/api')) {
        // 👇 CHANGED: Require token for all /api routes except public ones
    const isPublicApi = publicApiPaths.some((regex) => regex.test(path));

    if (!isPublicApi) {
      const token =
        (await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET,
          secureCookie: process.env.NODE_ENV === 'production',
        })) || null;

      // If no token, block the request
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const matched = validationMap.find(
      (rule) =>
        rule.method === req.method &&
        (rule.path instanceof RegExp ? rule.path.test(path) : rule.path === path)
    );

    if (matched) {
      try {
        // ✅ Query validation
        if ('query' in matched && matched.query) {
          matched.query.parse(searchParams);
        }
      
        // ✅ Handle GET with param (like /api/orderdetail/:id)
        else if (req.method === 'GET' && matched.schema) {
          const id = path.split('/').pop();

          // Narrow the type to only call .parse if it's a Zod schema
          if ('parse' in matched.schema && typeof matched.schema.parse === 'function') {
            matched.schema.parse({ id });
          } else if ('param' in matched.schema) {
            matched.schema.param.parse({ id });
          }
        }

        // Combined param + body validation (update-product)
        else if ('param' in matched.schema && 'body' in matched.schema) {
          const id = path.split('/').pop();
          matched.schema.param.parse({ id });

          const body = await req.json();
          matched.schema.body.parse(body);
        }
        
        // Only param validation (DELETE / soft-delete PUT)
        else if (req.method === 'DELETE' || req.method === 'PUT'|| req.method === 'PATCH') {
          const schema = matched.schema as ZodTypeAny;
          const id = path.split('/').pop();
          schema.parse({ id });
        }
        // Only body validation (POST)
        else {
          const schema = matched.schema as ZodTypeAny;
          const clone = req.clone();
          const text = await clone.text();
          const body = text ? JSON.parse(text) : {};
          schema.parse(body);
        }
        // ✅ Validation PASSED → continue request
        return NextResponse.next();
      } catch (err) {
        return handleValidationError(err);
      }
    }

    return NextResponse.next();
  }

  // ✅ Auth token validation for normal routes ✅ For frontend pages (non-API)
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
