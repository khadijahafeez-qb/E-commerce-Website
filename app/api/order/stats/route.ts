import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the latest stats
    const latestStats = await prisma.orderStats.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestStats) {
      return NextResponse.json({
        totalOrders: 0,
        totalUnits: 0,
        totalAmount: 0,
        lastUpdated: null,
      });
    }

    const stats = {
      totalOrders: latestStats.totalOrders,
      totalUnits: latestStats.totalUnits,
      totalAmount: latestStats.totalAmount,
      lastUpdated: latestStats.updatedAt.toISOString(),
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching order stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
