import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

export interface OrderItem {
  id: string;
  count: number;
  price: number;
}

const prisma = new PrismaClient();
export async function POST(req: Request) {

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' })
      );
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' })
      );
    }
    const body = await req.json();

    const { cartItems, total } = body;

    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty, cannot place order' }),
        { status: 400 }
      );
    }

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true, title: true },
      });

      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product ${item.title} not found` }),
          { status: 400 }
        );
      }

      if (item.count > product.stock) {
        return new Response(
          JSON.stringify({
            error: `Not enough stock for ${product.title}. Available: ${product.stock}`,
          }),
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.count } },
        });
      }
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          items: {
            create: cartItems.map((item: OrderItem) => ({
              productId: item.id,
              quantity: item.count,
              price: item.price
            })),
          },
        },
      });
return newOrder;
    });
 return new Response(JSON.stringify({ message: 'Order placed successfully' }));
  } catch (error) {
    console.log('Place order error', error);
  }

}

