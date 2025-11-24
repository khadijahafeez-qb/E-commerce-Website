import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const existingVariant = await prisma.productVariant.findUnique({ where: { id } });
    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }
    const variant = await prisma.productVariant.update({
      where: { id },
      data: { availabilityStatus: 'ACTIVE' },
    });
    return NextResponse.json(variant, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reactivate variant' }, { status: 500 });
  }
}

