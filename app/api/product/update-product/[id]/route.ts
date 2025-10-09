// import { NextRequest, NextResponse } from 'next/server';
// import fs from 'fs';
// import path from 'path';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function PUT(req: NextRequest) {
//   try {
  
//     const id = req.url.split('/').pop(); // get id from URL

//     if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

//     const formData = await req.formData();
//     const title = formData.get('title')?.toString();
//     const price = formData.get('price') ? Number(formData.get('price')) : undefined;
//     const stock = formData.get('stock') ? Number(formData.get('stock')) : undefined;
//     const file = formData.get('img') as File | null;

//     let imagePath: string | undefined;
//     if (file) {
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const uploadsDir = path.join(process.cwd(), 'public/uploads');
//       if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
//       const filename = Date.now() + '-' + file.name;
//       const filepath = path.join(uploadsDir, filename);
//       fs.writeFileSync(filepath, buffer);
//       imagePath = `/uploads/${filename}`;
//     }

//     await prisma.product.update({
//       where: { id },
//       data: {
//         ...(title ? { title } : {}),
//         ...(price !== undefined ? { price } : {}),
//         ...(stock !== undefined ? { stock } : {}),
//         ...(imagePath ? { img: imagePath } : {}),
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { colour, colourcode, size, price, stock, img, productId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Validate input (optional but safe)
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        colour,
        colourcode,
        size,
        price: Number(price),
        stock: Number(stock),
        img,
        productId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, variant: updatedVariant });
  } catch (error: unknown) {
    console.error('Error updating variant:', error);

    // Type-safe error message extraction
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}