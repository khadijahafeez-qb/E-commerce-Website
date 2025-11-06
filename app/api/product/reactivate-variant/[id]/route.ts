import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: { availabilityStatus: 'ACTIVE' },
    });

    return NextResponse.json(variant);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reactivate variant' }, { status: 500 });
  }
}

