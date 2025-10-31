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

 let stats = { totalOrders: 0, totalUnits: 0, totalAmount: 0 };

   if (isAdmin) {
      // Trigger Celery task
      const response = await fetch(`${FASTAPI_URL}/calculate-stats`, {
        method: 'POST',
      });
      const data = await response.json();
      const task_id = data.task_id;

      // Wait for the task to finish (polling)
      let done = false;
      while (!done) {
        const res = await fetch(`${FASTAPI_URL}/calculate-stats/${task_id}`);
        const result = await res.json();
        if (result.status === 'done') {
          stats = result.result;
          done = true;
        } else {
          await new Promise((r) => setTimeout(r, 500)); // 0.5s delay
        }
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
