import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
 

  //🌱 Insert demo products
  await prisma.product.createMany({
  data: [
    {
      title: 'Nike Killshot 1',
      colour: 'Black',
      size: '39',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/abf29e1c-cff0-44b3-a5f3-e6db9b5b7b6a/KILLSHOT+2.png',
      price: 500,
    },
    {
      title: 'Nike Field General 1',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/f88d6973-428c-4e75-ba36-1d7709662246/NIKE+FIELD+GENERAL.png',
      price: 300,
    },
    {
      title: 'Air Jordan MVP 92 1',
      colour: 'Blue',
      size: '38',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/bb72c5b8-6d9e-48cd-89d8-d4ad83dcc579/JORDAN+MVP+92.png',
      price: 800,
    },
    {
      title: 'Nike Gato 1',
      colour: 'Black',
      size: '42',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/deaad533-893d-4cf9-8a23-ea5de97c844c/NIKE+GATO.png',
      price: 300,
    },
    {
      title: 'Nike Court Vission Low 1',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/eaf524f7-a9f7-4f70-a438-1b0480eb2540/NIKE+COURT+VISION+LO.png',
      price: 300,
    },
    {
      title: 'Nike Air Force 1',
      colour: 'Blue',
      size: '41',
      stock: 10,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/5daa00d9-afae-4125-a95c-fc71923b81c3/AIR+FORCE+1+%2707.png',
      price: 300,
    },
    {
      title: 'Nike Killshot 2',
      colour: 'Black',
      size: '39',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/abf29e1c-cff0-44b3-a5f3-e6db9b5b7b6a/KILLSHOT+2.png',
      price: 500,
    },
    {
      title: 'Nike Field General 2',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/f88d6973-428c-4e75-ba36-1d7709662246/NIKE+FIELD+GENERAL.png',
      price: 300,
    },
    {
      title: 'Air Jordan MVP 92 2',
      colour: 'Blue',
      size: '38',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/bb72c5b8-6d9e-48cd-89d8-d4ad83dcc579/JORDAN+MVP+92.png',
      price: 800,
    },
    {
      title: 'Nike Gato 2',
      colour: 'Black',
      size: '42',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/deaad533-893d-4cf9-8a23-ea5de97c844c/NIKE+GATO.png',
      price: 300,
    },
    {
      title: 'Nike Court Vission Low 2',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/eaf524f7-a9f7-4f70-a438-1b0480eb2540/NIKE+COURT+VISION+LO.png',
      price: 300,
    },
    {
      title: 'Nike Air Force 2',
      colour: 'Blue',
      size: '41',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/5daa00d9-afae-4125-a95c-fc71923b81c3/AIR+FORCE+1+%2707.png',
      price: 300,
    },
    {
      title: 'Nike Killshot 3',
      colour: 'Black',
      size: '39',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/abf29e1c-cff0-44b3-a5f3-e6db9b5b7b6a/KILLSHOT+2.png',
      price: 500,
    },
    {
      title: 'Nike Field General 3',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/f88d6973-428c-4e75-ba36-1d7709662246/NIKE+FIELD+GENERAL.png',
      price: 300,
    },
    {
      title: 'Air Jordan MVP 92 3',
      colour: 'Blue',
      size: '38',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/bb72c5b8-6d9e-48cd-89d8-d4ad83dcc579/JORDAN+MVP+92.png',
      price: 800,
    },
    {
      title: 'Nike Gato 3',
      colour: 'Black',
      size: '42',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/deaad533-893d-4cf9-8a23-ea5de97c844c/NIKE+GATO.png',
      price: 300,
    },
    {
      title: 'Nike Court Vission Low 3',
      colour: 'White',
      size: '40',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/eaf524f7-a9f7-4f70-a438-1b0480eb2540/NIKE+COURT+VISION+LO.png',
      price: 300,
    },
    {
      title: 'Nike Air Force 3',
      colour: 'Blue',
      size: '41',
      stock: 100,
      img: 'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/5daa00d9-afae-4125-a95c-fc71923b81c3/AIR+FORCE+1+%2707.png',
      price: 300,
    },
  ],
});



  
  // const hashedpass= await bcrypt.hash('Alphabeta@123',10);
  // await prisma.user.create({
  //   data: {
  //     fullname: 'Admin Admin',
  //     email: 'admin2@gmail.com',
  //     mobile: '03333769005',
  //     password: hashedpass,
  //     role: 'ADMIN',
  //   },
  // });
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
