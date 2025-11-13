import { NextResponse,NextRequest} from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { colour, colourcode, size, price, stock, img } = body;
    const duplicate = await prisma.productVariant.findFirst({
      where: {
        colour,
        size,
        productId: body.productId,
        NOT: { id },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Variant with colour "${colour}" and size "${size}" already exists.`,
          code: 'DUPLICATE_VARIANT',
        },
        { status: 400 }
      );
    }
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        colour,
        colourcode,
        size,
        price:price,
        stock: stock,
        img,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error: unknown) {
    console.error('Error updating variant:', error);
    const message =
    error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}