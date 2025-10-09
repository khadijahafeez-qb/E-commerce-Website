// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Seeding database...');

//   // --- Create Products with Variants ---
//   const products = [
//     {
//       title: 'Mens lightweight Jackets',
//       variants: [
//         {
//           img: 'https://m.media-amazon.com/images/I/61wfjo8j5tL._AC_SX679_.jpg',
//           colour: 'Black',
//           colourcode: '#000000',
//           size: 'S',
//           stock: 50,
//           price: 12000,
//         },
//         {
//           img: 'https://m.media-amazon.com/images/I/61LT6tiJgoL._AC_SX679_.jpg',
//           colour: 'White',
//           colourcode: '#FFFFFF',
//           size: 'S',
//           stock: 40,
//           price: 12500,
//         },
//         {
//           img: 'https://m.media-amazon.com/images/I/61OfM0JLbVL._AC_SX679_.jpg',
//           colour: 'Blue',
//           colourcode: '#0000FF',
//           size: '42',
//           stock: 30,
//           price: 13000,
//         },
//       ],
//     },
//     {
//       title: 'Adidas Ultraboost',
//       variants: [
//         {
//           img: 'https://assets.adidas.com/images/t_prod2_grey.jpg',
//           colour: 'Grey',
//           colourcode: '#808080',
//           size: '40',
//           stock: 20,
//           price: 14000,
//         },
//         {
//           img: 'https://assets.adidas.com/images/t_prod2_black.jpg',
//           colour: 'Black',
//           colourcode: '#000000',
//           size: '41',
//           stock: 35,
//           price: 14500,
//         },
//       ],
//     },
//     {
//       title: 'Puma RS-X³',
//       variants: [
//         {
//           img: 'https://images.puma.com/t_prod3_red.jpg',
//           colour: 'Red',
//           colourcode: '#FF0000',
//           size: '40',
//           stock: 25,
//           price: 11500,
//         },
//         {
//           img: 'https://images.puma.com/t_prod3_blue.jpg',
//           colour: 'Blue',
//           colourcode: '#0000FF',
//           size: '42',
//           stock: 15,
//           price: 11800,
//         },
//         {
//           img: 'https://images.puma.com/t_prod3_white.jpg',
//           colour: 'White',
//           colourcode: '#FFFFFF',
//           size: '43',
//           stock: 20,
//           price: 12000,
//         },
//       ],
//     },
//     {
//       title: 'Converse Chuck Taylor',
//       variants: [
//         {
//           img: 'https://images.converse.com/t_prod4_black.jpg',
//           colour: 'Black',
//           colourcode: '#000000',
//           size: '39',
//           stock: 40,
//           price: 9500,
//         },
//         {
//           img: 'https://images.converse.com/t_prod4_white.jpg',
//           colour: 'White',
//           colourcode: '#FFFFFF',
//           size: '40',
//           stock: 50,
//           price: 9700,
//         },
//       ],
//     },
//   ];

//   // --- Insert Products + Variants ---
//   for (const p of products) {
//     await prisma.product.create({
//       data: {
//         title: p.title,
//         variants: {
//           create: p.variants.map((v) => ({
//             img: v.img,
//             colour: v.colour,
//             colourcode: v.colourcode,
//             size: v.size,
//             stock: v.stock,
//             price: v.price,
//           })),
//         },
//       },
//     });
//   }

//   console.log('✅ Seed completed successfully!');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seed failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient, VariantAvailability } from '@prisma/client';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const colors = ['Black','White','Green','Grey'];
  const colorCodes = ['#000000','#FFFFFF','#008000','#808080',];
  const colorImages: Record<string, string> = {
    Black: 'https://m.media-amazon.com/images/I/61wfjo8j5tL._AC_SX679_.jpg',
    White: 'https://m.media-amazon.com/images/I/61LT6tiJgoL._AC_SX679_.jpg',
    Green: 'https://m.media-amazon.com/images/I/71nFRsR7lRL._AC_SX679_.jpg',
    Grey: 'https://m.media-amazon.com/images/I/618b8Wy4wHL._AC_SX679_.jpg',
  };
  const JacketNames = [
    'Lightweight Tech Jacket', 'StormGuard Rain Jacket', 'Arctic Parka', 'Hybrid Fleece Zip-Up', 'Hoodie',
    
  ];
  const sizes = ['S','M','L','XL'];
  let colorIndex = 0;

  for (let i = 0; i < 60; i++) {
    const typeName = JacketNames[i % JacketNames.length];
    const productColors = [];

    for (let j = 0; j < 4; j++) {
      productColors.push(colors[(colorIndex + j) % colors.length]);
    }
    colorIndex += 4;

    const variantsData = productColors.flatMap((color, colorIdx) =>
      sizes.map((size, sizeIdx) => {
        const basePrice = 100 + (i + 1) * 5;
        const price = basePrice + colorIdx * 10 + sizeIdx * 5;
        return {
          colour: color,
          colourcode: colorCodes[colors.indexOf(color)],
          size,
          price,
          stock: 10 + (i + 1) * 2,
          img: colorImages[color],
          availabilityStatus: VariantAvailability.ACTIVE,
        };
      })
    );

    const product = await prisma.product.create({
      data: {
        title: `${typeName} ${i + 1}`,
        isDeleted: 'active',
        variants: { create: variantsData }
      },
      include: { variants: true }
    });

    console.log(`Inserted product: ${product.title} with ${product.variants.length} variants`);
    await delay(100);
  }

  console.log('✅ All shirt products seeded with dynamic pricing');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
