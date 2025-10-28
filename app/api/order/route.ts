import { PrismaClient, Prisma } from '@prisma/client';
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
      where: { email: session.user.email ?? undefined },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';

    // ✅ FIX — use Prisma.QueryMode type, not a plain string
    const searchFilter: Prisma.OrderWhereInput = search
      ? {
          OR: [
            { id: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ...(isAdmin
              ? [
                  {
                    user: {
                      fullname: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                ]
              : []),
          ],
        }
      : {};

    const where: Prisma.OrderWhereInput = isAdmin
      ? searchFilter
      : {
          userId: user.id,
          ...(search
            ? {
                id: { contains: search, mode: Prisma.QueryMode.insensitive },
              }
            : {}),
        };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          _count: { select: { items: true } },
          user: { select: { fullname: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    if (isAdmin) {
      const allOrders = await prisma.order.findMany({
        include: { _count: { select: { items: true } } },
      });

      const totalOrders = allOrders.length;
      const totalUnits = allOrders.reduce((sum, o) => sum + o._count.items, 0);
      const totalAmount = allOrders.reduce((sum, o) => sum + o.total, 0);

      return NextResponse.json({
        stats: { totalOrders, totalUnits, totalAmount },
        orders,
        total,
        page,
        limit,
      });
    }

    return NextResponse.json({ orders, total, page, limit });
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
