import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const body = await req.json();
    const { colour, colourcode, size, stock, price, img } = body;

    if (!colour || !size || !price || !img) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        colour,
        colourcode,
        size,
        stock: Number(stock) || 0,
        price: Number(price),
        img,
      },
    });

    return NextResponse.json({ success: true, variant });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to add variant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
