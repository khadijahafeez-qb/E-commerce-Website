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
    const existingVariant = await prisma.productVariant.findUnique({
      where: {
        productId_colour_size: {  
          productId,
          colour: body.colour,
          size: body.size
        }
      }
    });
    if (existingVariant) {
      return NextResponse.json(
        {
          success: false,
          error: `Variant with colour "${body.colour}" and size "${body.size}" already exists.`,
          code: 'DUPLICATE_VARIANT',
        },
        { status: 400 }
      );
    }
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        colour: body.colour,
        colourcode: body.colourcode,
        size: body.size,
        stock: body.stock,
        price: body.price,
        img: body.img,
      },
    });
    return NextResponse.json({ success: true, variant }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to add variant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
