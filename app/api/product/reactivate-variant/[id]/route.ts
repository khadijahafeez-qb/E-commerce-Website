import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update only the availabilityStatus
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: { availabilityStatus: 'ACTIVE' },
    });

    return NextResponse.json(updatedVariant, { status: 200 });
  } catch (err) {
    console.error('Failed to activate variant:', err);
    return NextResponse.json({ error: 'Failed to activate variant' }, { status: 500 });
  }
}
