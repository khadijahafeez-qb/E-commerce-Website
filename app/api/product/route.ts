import { NextResponse } from 'next/server';
import { PrismaClient,Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);
    console.log('search params',searchParams);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const skip = (page - 1) * limit;
    console.log('page limit search sort skip',{page,limit,search,sort,skip});
    const whereProduct: Prisma.ProductWhereInput = search
  ? { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
  : {};
        console.log('helo 1');
    // Group variants to get min price
    const priceGroups = await prisma.productVariant.groupBy({
      by: ['productId'],
      _min: { price: true },
    });
      console.log('helo 2');

    const priceMap = Object.fromEntries(
      priceGroups.map(p => [p.productId, p._min.price ?? 0])
    );
      console.log('helo 3');
    // Fetch products with variants
    const products = await prisma.product.findMany({
      where: whereProduct,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
    });
    
  console.log('helo 4');
    const enrichedProducts = products.map(p => ({
      ...p,
      price: priceMap[p.id] ?? 0,
    }));

    // Sort manually
    if (sort === 'price-asc') enrichedProducts.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') enrichedProducts.sort((a, b) => b.price - a.price);

    const total = await prisma.product.count({ where: whereProduct });
    console.log('fetched products',enrichedProducts);
    
    return NextResponse.json({
      products: enrichedProducts,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
