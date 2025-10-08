import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const images = [
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/abf29e1c-cff0-44b3-a5f3-e6db9b5b7b6a/KILLSHOT+2.png',
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/f88d6973-428c-4e75-ba36-1d7709662246/NIKE+FIELD+GENERAL.png',
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/bb72c5b8-6d9e-48cd-89d8-d4ad83dcc579/JORDAN+MVP+92.png',
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/deaad533-893d-4cf9-8a23-ea5de97c844c/NIKE+GATO.png',
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/eaf524f7-a9f7-4f70-a438-1b0480eb2540/NIKE+COURT+VISION+LO.png',
    'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/5daa00d9-afae-4125-a95c-fc71923b81c3/AIR+FORCE+1+%2707.png',
  ];

  const colours = ['Black', 'White', 'Blue', 'Red', 'Green'];
  const sizes = ['38', '39', '40', '41', '42', '43'];
  const prices = [200, 300, 400, 500, 600, 700];

  for (let i = 1; i <= 200; i++) {
    const product = {
      title: `Product ${i}`,
      colour: colours[i % colours.length],
      size: sizes[i % sizes.length],
      stock: 10 + (i % 10) * 10, // varying stock
      img: images[i % images.length],
      price: prices[i % prices.length],
    };

    await prisma.product.create({ data: product });
    console.log(`✅ Created product ${i}`);
    
    // Add delay between inserts (e.g., 100ms)
    await sleep(100);
  }
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
