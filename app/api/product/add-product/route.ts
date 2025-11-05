import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { VariantInput} from '@/lib/validation/product';

const prisma = new PrismaClient();
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Step 1: Check for existing product title (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        title: {
          equals: body.title,
          mode: 'insensitive', // ignores case (e.g. "Nike" == "nike")
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: `A product with the title "${body.title}" already exists.`,
        },
        { status: 400 }
      );
    }
        // Check for duplicate colour+size combinations
    const variantSet = new Set();
    for (const v of body.variants) {
      const key = `${v.colour}-${v.size}`;
      if (variantSet.has(key)) {
        return NextResponse.json({
          success: false,
          error: `Duplicate variant found for colour ${v.colour} and size ${v.size}`,
        }, { status: 400 });
      }
      variantSet.add(key);
    }
    const product = await prisma.product.create({
      data: {
        title: body.title,
        isDeleted: body.isDeleted,
        variants: {
          create: body.variants.map((v:VariantInput) => ({
            img: v.img!,
            colour: v.colour,
            colourcode: v.colourcode,
            size: v.size,
            stock: v.stock,
            price: v.price,
            availabilityStatus: v.availabilityStatus!, 
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
