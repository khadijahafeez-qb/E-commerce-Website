import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const body = await req.json();
    const { title } = body;
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
       // Check for duplicate title in other products
    const existingProduct = await prisma.product.findFirst({
      where: {
        title,
        NOT: { id }, // exclude the current product
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'A product with this title already exists' }, { status: 400 });
    }
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { title },
    });
    return NextResponse.json({ product: updatedProduct });
  } catch (err) {
    console.error('Update product title error:', err);
    return NextResponse.json(
      { error: 'Something went wrong while updating the product title' },
      { status: 500 }
    );
  }
}
