import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { variantSchema } from '@/lib/validation/product';

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const body = await req.json();
    const parsedVariant = variantSchema.parse(body);

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        colour:parsedVariant.colour,
        colourcode:parsedVariant.colourcode,
        size:parsedVariant.size,
        stock: parsedVariant.stock,
        price: parsedVariant.price,
        img:parsedVariant.img,
      },
    });

    return NextResponse.json({ success: true, variant });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to add variant';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
