import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { productSchema, ProductInput } from '@/lib/validation/product';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate with Zod
    const parsedData: ProductInput = productSchema.parse(body);

    // Ensure every variant has an image (string)
    parsedData.variants.forEach((v, i) => {
      if (!v.img) throw new Error(`Variant ${i + 1} is missing an image`);
    });

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        title: parsedData.title,
        isDeleted: parsedData.isDeleted,
        variants: {
          create: parsedData.variants.map((v) => ({
            img: v.img!, // now guaranteed to be string
            colour: v.colour,
            colourcode: v.colourcode,
            size: v.size,
            stock: v.stock,
            price: v.price,
            availabilityStatus: v.availabilityStatus!, // include if you track it
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
