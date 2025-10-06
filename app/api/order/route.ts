import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';
    let searchFilter = {};
    if (search) {
      searchFilter = {
        OR: [
          { id: { contains: search, mode: 'insensitive' } }, 
          { user: { fullname: { contains: search, mode: 'insensitive' } } }, 
        ],
      };
    }

    const where = isAdmin
      ? searchFilter
      : { userId: user.id, ...searchFilter };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          _count: { select: { items: true } },
          user: { select: { fullname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    if (isAdmin) {
      const [result, totalOrders, totalUnits] = await Promise.all([
        prisma.order.aggregate({
          _sum: { total: true }, 
          where: searchFilter,  
        }),
        prisma.order.count({
          where: searchFilter,     
        }),
        prisma.orderItem.count({
          where: {
            order: searchFilter,  
          },
        }),
      ]);
      const totalAmount = result._sum.total || 0;

      return NextResponse.json({
        stats: { totalOrders, totalUnits, totalAmount },
        orders,
        total,
        page,
        limit,
      });
    }

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
