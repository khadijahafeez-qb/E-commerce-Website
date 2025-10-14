import { NextResponse,NextRequest} from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest,context: { params: Promise<{ id: string }> }) {
  try {
        const { id } = await context.params;
    const body = await req.json();
    const { colour, colourcode, size, price, stock, img, productId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Validate input (optional but safe)
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        colour,
        colourcode,
        size,
        price: Number(price),
        stock: Number(stock),
        img,
        productId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error: unknown) {
    console.error('Error updating variant:', error);

    // Type-safe error message extraction
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}