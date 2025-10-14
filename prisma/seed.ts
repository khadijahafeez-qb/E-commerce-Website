import { PrismaClient, VariantAvailability, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // ✅ 1. Create Admin User with hashed password
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        fullname: 'Admin User',
        email: adminEmail,
        mobile: '03000000000',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log(`✅ Admin user created: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log(`ℹ️ Admin already exists: ${adminEmail}`);
  }

  // ✅ 2. Seed Products with 4 Variants Each
  const colors = ['Black', 'White', 'Green', 'Grey'];
  const colorCodes = ['#000000', '#FFFFFF', '#008000', '#808080'];
  const sizes = ['S', 'M', 'L', 'XL'];
  const colorImages: Record<string, string> = {
    Black: 'https://m.media-amazon.com/images/I/61wfjo8j5tL._AC_SX679_.jpg',
    White: 'https://m.media-amazon.com/images/I/61LT6tiJgoL._AC_SX679_.jpg',
    Green: 'https://m.media-amazon.com/images/I/71nFRsR7lRL._AC_SX679_.jpg',
    Grey: 'https://m.media-amazon.com/images/I/618b8Wy4wHL._AC_SX679_.jpg',
  };

  const JacketNames = [
    'Lightweight Tech Jacket',
    'StormGuard Rain Jacket',
    'Arctic Parka',
    'Hybrid Fleece Zip-Up',
    'Hoodie',
  ];

  for (let i = 0; i < 60; i++) {
    const typeName = JacketNames[i % JacketNames.length];

    const variantsData = colors.map((color, idx) => ({
      colour: color,
      colourcode: colorCodes[idx],
      size: sizes[idx],
      price: 100 + i * 5 + idx * 10,
      stock: 20 + i,
      img: colorImages[color],
      availabilityStatus: VariantAvailability.ACTIVE,
    }));

    const product = await prisma.product.create({
      data: {
        title: `${typeName} ${i + 1}`,
        isDeleted: 'active',
        variants: { create: variantsData },
      },
      include: { variants: true },
    });

    console.log(`🧥 Inserted product: ${product.title} (${product.variants.length} variants)`);
    await delay(100);
  }

  console.log('✅ All products seeded successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
