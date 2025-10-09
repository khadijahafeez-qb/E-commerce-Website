import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(req: NextRequest,{ params }: Params): Promise<NextResponse> {
  try {
    const { id } = params;

  
    await prisma.productVariant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true});
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

