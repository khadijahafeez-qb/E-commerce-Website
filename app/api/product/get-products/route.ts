import { NextResponse } from 'next/server';
import { PrismaClient,Prisma } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await auth();
    const role = session?.user?.role;

    const { searchParams } = new URL(req.url);

    // 🧠 Extract query params
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';

    // 🧩 If no limit, we fetch all (no pagination)
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = limit ? (page - 1) * limit : 0;

        // 🧠 Role-based filtering moved here:
    const whereProduct: Prisma.ProductWhereInput = {
      isDeleted: 'active',
      ...(search
        ? { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
        : {}),

      ...(role === 'USER'
        ? {
            // Show only products that have active variants (and optionally stock > 0)
            variants: {
              some: {
                availabilityStatus: 'ACTIVE',
              },
            },
          }
        : {}),
    };
   
    // Group variants to get min price
    const priceGroups = await prisma.productVariant.groupBy({
      by: ['productId'],
      _min: { price: true },
       where: { availabilityStatus: 'ACTIVE' },
    });


    const priceMap = Object.fromEntries(
      priceGroups.map(p => [p.productId, p._min.price ?? 0])
    );

    // Fetch products with variants
    const products = await prisma.product.findMany({
      where: whereProduct,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
            include: {
        variants:
          role === 'ADMIN'
            ? true // show ALL variants for admin
            : {
                where: { availabilityStatus: 'ACTIVE' },
              },
      },
    });

    const enrichedProducts = products.map(p => ({
      ...p,
      price: priceMap[p.id] ?? 0,
    }));

    // Sort manually
    if (sort === 'price-asc') enrichedProducts.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') enrichedProducts.sort((a, b) => b.price - a.price);

    const total = await prisma.product.count({ where: whereProduct });
  
    
    return NextResponse.json({
      products: enrichedProducts,
      total,
      hasMore: limit ? page * limit < total : false,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
