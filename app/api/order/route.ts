import { PrismaClient, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

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
    let stats: { totalOrders: number; totalUnits: number; totalAmount: number; lastUpdated: string | null } = {
      totalOrders: 0,
      totalUnits: 0,
      totalAmount: 0,
      lastUpdated: null,
    };
    // if (isAdmin) {
    //   // 1️⃣ Get latest precomputed stats
    //   const latestStats = await prisma.orderStats.findFirst({
    //     orderBy: { createdAt: 'desc' },
    //   });

    //   const lastUpdated = latestStats?.updatedAt ?? new Date(0);

    //   // 2️⃣ Get new orders since last stats
    //   const newOrders = await prisma.order.findMany({
    //     where: { createdAt: { gt: lastUpdated } },
    //     include: { items: true },
    //   });

    //   const newTotalOrders = newOrders.length;
    //   const newTotalUnits = newOrders.reduce(
    //     (acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0),
    //     0
    //   );
    //   const newTotalAmount = newOrders.reduce(
    //     (acc, order) => acc + (order.total ?? 0),
    //     0
    //   );

    //   // 3️⃣ Merge precomputed stats + new orders
    //   stats = {
    //     totalOrders: (latestStats?.totalOrders ?? 0) + newTotalOrders,
    //     totalUnits: (latestStats?.totalUnits ?? 0) + newTotalUnits,
    //     totalAmount: (latestStats?.totalAmount ?? 0) + newTotalAmount,
    //     lastUpdated: latestStats?.updatedAt.toISOString() ?? null,
    //   };
    // }

    // return NextResponse.json({ orders, total, page, limit, stats });
        if (isAdmin) {
      const latestStats = await prisma.orderStats.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (latestStats) {
        stats = {
          totalOrders: latestStats.totalOrders,
          totalUnits: latestStats.totalUnits,
          totalAmount: latestStats.totalAmount,
          lastUpdated: latestStats.updatedAt.toISOString(),
        };
      }
    }

    return NextResponse.json({ orders, total, page, limit, stats });
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
