import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get('title')?.toString() || '';
    const price = Number(formData.get('price') || 0);
    const stock = Number(formData.get('stock') || 0);
    const size = formData.get('size')?.toString() || 'M';
    const file = formData.get('img') as File | null;

    let imagePath = '';
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = Date.now() + '-' + file.name;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, buffer);
      imagePath = `/uploads/${filename}`;
    }

    await prisma.product.create({
      data: { title, price, stock, img: imagePath,size },
    });

    return NextResponse.json({ success: true});
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
