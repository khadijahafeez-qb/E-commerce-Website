import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  context: { params: { productId: string } }
) {
  try {
    const { productId } = context.params;
    const body = await req.json();
    const { variants } = body as {
      variants: Array<{
        colour: string;
        colourcode: string;
        size: string;
        stock: number;
        price: number;
        img: string;
      }>;
    };

    // 1️⃣ Check duplicates in request payload
    const variantSet = new Set<string>();
    for (const v of variants) {
      const key = `${v.colour}-${v.size}`;
      if (variantSet.has(key)) {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate variant in request for colour "${v.colour}" and size "${v.size}"`,
          },
          { status: 400 }
        );
      }
      variantSet.add(key);
    }

    // 2️⃣ Check duplicates in DB & create non-duplicates
    const createdVariants = [];
    for (const v of variants) {
      const existing = await prisma.productVariant.findUnique({
        where: {
          productId_colour_size: { productId, colour: v.colour, size: v.size },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `Variant already exists in database for colour "${v.colour}" and size "${v.size}"`,
          },
          { status: 400 }
        );
      }

      const variant = await prisma.productVariant.create({
        data: { productId, ...v },
      });
      createdVariants.push(variant);
    }

    return NextResponse.json({ success: true, createdVariants });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add variants';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
