import { NextResponse ,NextRequest} from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const product = await prisma.product.update({
      where: { id},
      data: { isDeleted: 'deleted' },
    });
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