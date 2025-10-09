import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

export interface OrderItem {
  productId: string;
  id: string,
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
    console.log('cart items', cartItems);
    for (const item of cartItems) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.id },
        select: {
          stock: true,
          colour: true,
          size: true,
          product: { select: { title: true } }
        },
      });

      if (!variant) {
        return new Response(
          JSON.stringify({ error: `variant ${item.title} not found` }),
          { status: 400 }
        );
      }

      if (item.count > variant.stock) {
        return new Response(
          JSON.stringify({
            error: `Not enough stock for ${variant.product.title}. Available: (${variant.colour} - ${variant.size}). Available: ${variant.stock}`,
          }),
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        await tx.productVariant.update({
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
              product: { connect: { id: item.productId } },
              variant: { connect: { id: item.id } },
              quantity: item.count,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: true,
              product: true,
            },
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

