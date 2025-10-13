import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: { title },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    console.error('Error adding product:', err);

    const message =
      err instanceof Error ? err.message : 'Failed to add product';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
