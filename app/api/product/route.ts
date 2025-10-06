import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const skip = (page - 1) * limit;

    const where = search
      ? {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }
      : {};
     
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error fetching products:', { error });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

 