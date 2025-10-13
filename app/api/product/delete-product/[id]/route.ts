import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: Request,context: { params: Promise<{ id: string }> } ) {
  try {
    const { id } = await context.params;
    // ✅ Soft delete the product
    const product = await prisma.product.update({
      where: { id},
      data: { isDeleted: 'deleted' },
    });

    // ✅ Mark all its variants as INACTIVE
    await prisma.productVariant.updateMany({
      where: { productId: id },
      data: { availabilityStatus: 'INACTIVE' },
    });

    return NextResponse.json({
      success: true,
      message: 'Product and its variants marked inactive',
      product,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}