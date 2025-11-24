import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = limit ? (page - 1) * limit : 0;
    const whereProduct: Prisma.ProductWhereInput = {
      isDeleted: 'active',
      ...(search
        ? { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
        : {}),
      ...(role === 'USER'
        ? {
          variants: {
            some: {
              availabilityStatus: 'ACTIVE',
            },
          },
        }
        : {}),
    };
    type ProductOrderBy = Prisma.ProductOrderByWithRelationInput;
    let orderBy: ProductOrderBy;
    switch (sort) {
      case 'title-asc':
        orderBy = { title: 'asc' };
        break;
      case 'title-desc':
        orderBy = { title: 'desc' };
        break;
      case 'date-asc':
        orderBy = { createdAt: 'asc' };
        break;
      case 'date-desc':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' }; // default sorting
    }
    const products = await prisma.product.findMany({
      where: whereProduct,
      skip,
      take: limit,
      orderBy,
      include: {
        variants:
          role === 'ADMIN'
            ? true 
            : {
              where: { availabilityStatus: 'ACTIVE' },
            },
      },
    });
    const total = await prisma.product.count({ where: whereProduct });
    return NextResponse.json({
      products,
      total,
      hasMore: limit ? page * limit < total : false,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
