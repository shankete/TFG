import 'dotenv/config';
import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { categories, listings, products, users } from './schema';

// Script para poblar la base de datos con datos de prueba.
// Crea:
//   - Un usuario admin
//   - Categorías y productos del catálogo
//   - Vendedores y compradores con nombres españoles
//   - Una oferta para cada producto en varios vendedores
//
// Es idempotente: se puede ejecutar varias veces sin duplicar datos.
// Si un producto ya existe, le actualiza la imagen y la categoría
// (así arreglamos imágenes rotas sin tener que borrar nada a mano).

// Contraseña común para todos los usuarios de prueba (más fácil de recordar).
const PASSWORD = 'password123';

const CATS = [
  { name: 'Fruta', slug: 'fruta' },
  { name: 'Verdura', slug: 'verdura' },
  { name: 'Hortaliza', slug: 'hortaliza' },
  { name: 'Legumbre', slug: 'legumbre' },
];

// Imágenes de Unsplash que sé que funcionan (probadas a mano).
const PRODUCTS = [
  { name: 'Manzana',   slug: 'manzana',   cat: 'fruta',     img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600' },
  { name: 'Naranja',   slug: 'naranja',   cat: 'fruta',     img: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=600' },
  { name: 'Pera',      slug: 'pera',      cat: 'fruta',     img: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=600' },
  { name: 'Plátano',   slug: 'platano',   cat: 'fruta',     img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600' },
  { name: 'Acelga',    slug: 'acelga',    cat: 'verdura',   img: 'https://images.unsplash.com/photo-1576181256399-834e3b3a49bf?w=600' },
  { name: 'Espinaca',  slug: 'espinaca',  cat: 'verdura',   img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600' },
  { name: 'Tomate',    slug: 'tomate',    cat: 'hortaliza', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600' },
  { name: 'Lechuga',   slug: 'lechuga',   cat: 'hortaliza', img: 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=600' },
  { name: 'Pimiento',  slug: 'pimiento',  cat: 'hortaliza', img: 'https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=600' },
  { name: 'Zanahoria', slug: 'zanahoria', cat: 'hortaliza', img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600' },
  { name: 'Patata',    slug: 'patata',    cat: 'hortaliza', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600' },
  { name: 'Garbanzo',  slug: 'garbanzo',  cat: 'legumbre',  img: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600' },
  { name: 'Lenteja',   slug: 'lenteja',   cat: 'legumbre',  img: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=600' },
];

// Vendedores con nombres y ciudades españolas.
const SELLERS = [
  { email: 'maria.lopez@huerta.es',       name: 'María López',       city: 'Valencia' },
  { email: 'antonio.martinez@huerta.es',  name: 'Antonio Martínez',  city: 'Almería' },
  { email: 'carmen.ruiz@huerta.es',       name: 'Carmen Ruiz',       city: 'Sevilla' },
  { email: 'javier.fernandez@huerta.es',  name: 'Javier Fernández',  city: 'Zaragoza' },
  { email: 'lucia.jimenez@huerta.es',     name: 'Lucía Jiménez',     city: 'Albacete' },
  { email: 'miguel.sanchez@huerta.es',    name: 'Miguel Sánchez',    city: 'Granada' },
  { email: 'pilar.moreno@huerta.es',      name: 'Pilar Moreno',      city: 'Murcia' },
];

// Compradores de ejemplo.
const BUYERS = [
  { email: 'ana.romero@correo.es',  name: 'Ana Romero',    city: 'Madrid'    },
  { email: 'david.torres@correo.es', name: 'David Torres',  city: 'Barcelona' },
  { email: 'sara.vega@correo.es',   name: 'Sara Vega',     city: 'Bilbao'    },
  { email: 'carlos.navarro@correo.es', name: 'Carlos Navarro', city: 'Valladolid' },
];

// Para cada producto, qué vendedores lo ofrecen y a qué precio (€/kg).
// Los precios son inventados pero realistas (precios de mercado típicos).
const OFFERS: Record<string, { sellerEmail: string; price: number }[]> = {
  manzana: [
    { sellerEmail: 'maria.lopez@huerta.es',      price: 1.80 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 1.95 },
    { sellerEmail: 'javier.fernandez@huerta.es', price: 2.10 },
  ],
  naranja: [
    { sellerEmail: 'maria.lopez@huerta.es',      price: 1.20 },
    { sellerEmail: 'carmen.ruiz@huerta.es',      price: 1.40 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 1.30 },
  ],
  pera: [
    { sellerEmail: 'javier.fernandez@huerta.es', price: 2.50 },
    { sellerEmail: 'maria.lopez@huerta.es',      price: 2.30 },
  ],
  platano: [
    { sellerEmail: 'antonio.martinez@huerta.es', price: 1.99 },
    { sellerEmail: 'carmen.ruiz@huerta.es',      price: 2.20 },
  ],
  acelga: [
    { sellerEmail: 'lucia.jimenez@huerta.es',    price: 1.50 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 1.40 },
  ],
  espinaca: [
    { sellerEmail: 'lucia.jimenez@huerta.es',    price: 3.20 },
    { sellerEmail: 'miguel.sanchez@huerta.es',   price: 3.50 },
    { sellerEmail: 'maria.lopez@huerta.es',      price: 3.00 },
  ],
  tomate: [
    { sellerEmail: 'antonio.martinez@huerta.es', price: 2.40 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 2.50 },
    { sellerEmail: 'carmen.ruiz@huerta.es',      price: 2.70 },
    { sellerEmail: 'lucia.jimenez@huerta.es',    price: 2.30 },
  ],
  lechuga: [
    { sellerEmail: 'antonio.martinez@huerta.es', price: 0.95 },
    { sellerEmail: 'lucia.jimenez@huerta.es',    price: 1.10 },
  ],
  pimiento: [
    { sellerEmail: 'antonio.martinez@huerta.es', price: 2.80 },
    { sellerEmail: 'miguel.sanchez@huerta.es',   price: 3.10 },
  ],
  zanahoria: [
    { sellerEmail: 'lucia.jimenez@huerta.es',    price: 1.20 },
    { sellerEmail: 'javier.fernandez@huerta.es', price: 1.10 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 1.30 },
  ],
  patata: [
    { sellerEmail: 'javier.fernandez@huerta.es', price: 0.90 },
    { sellerEmail: 'miguel.sanchez@huerta.es',   price: 1.00 },
    { sellerEmail: 'carmen.ruiz@huerta.es',      price: 0.95 },
  ],
  garbanzo: [
    { sellerEmail: 'javier.fernandez@huerta.es', price: 3.50 },
    { sellerEmail: 'pilar.moreno@huerta.es',     price: 3.80 },
  ],
  lenteja: [
    { sellerEmail: 'javier.fernandez@huerta.es', price: 3.20 },
    { sellerEmail: 'miguel.sanchez@huerta.es',   price: 3.40 },
  ],
};

// Crea un usuario solo si no existe (por email).
async function crearUsuarioSiNoExiste(
  email: string,
  name: string,
  role: 'buyer' | 'seller' | 'admin',
  city: string | null,
) {
  const existente = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existente) return existente;

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const inserted = await db
    .insert(users)
    .values({ email, passwordHash, name, role, city })
    .returning();
  return inserted[0];
}

async function main() {
  console.log('Iniciando seed…');

  // 1. Admin (con contraseña distinta a la del resto, por ser cuenta especial)
  const adminEmail = 'admin@tfg.com';
  const adminExistente = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
  if (!adminExistente) {
    const hash = await bcrypt.hash('admin1234', 10);
    await db.insert(users).values({
      email: adminEmail,
      passwordHash: hash,
      name: 'Admin',
      role: 'admin',
      city: null,
    });
  }
  console.log(' → admin OK');

  // 2. Categorías (no se borran, solo se añaden las que falten)
  await db.insert(categories).values(CATS).onConflictDoNothing();
  const allCats = await db.query.categories.findMany();
  const catBySlug: Record<string, string> = {};
  for (const c of allCats) {
    catBySlug[c.slug] = c.id;
  }
  console.log(` → ${allCats.length} categorías OK`);

  // 3. Productos. Si ya existe el slug, le actualizamos la imagen
  // y la categoría por si habían cambiado (por ejemplo, para arreglar
  // imágenes rotas).
  for (const p of PRODUCTS) {
    await db
      .insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        imageUrl: p.img,
        categoryId: catBySlug[p.cat],
        description: `${p.name} fresca de temporada.`,
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          imageUrl: p.img,
          categoryId: catBySlug[p.cat],
          name: p.name,
        },
      });
  }
  console.log(` → ${PRODUCTS.length} productos OK`);

  // 4. Vendedores
  const sellersByEmail: Record<string, { id: string }> = {};
  for (const s of SELLERS) {
    const u = await crearUsuarioSiNoExiste(s.email, s.name, 'seller', s.city);
    sellersByEmail[s.email] = u;
  }
  console.log(` → ${SELLERS.length} vendedores OK`);

  // 5. Compradores
  for (const b of BUYERS) {
    await crearUsuarioSiNoExiste(b.email, b.name, 'buyer', b.city);
  }
  console.log(` → ${BUYERS.length} compradores OK`);

  // 6. Ofertas. Para cada producto cogemos su lista de ofertas
  // y la metemos en la tabla de listings (saltando las que ya existan).
  const allProducts = await db.query.products.findMany();
  const productBySlug: Record<string, string> = {};
  for (const p of allProducts) {
    productBySlug[p.slug] = p.id;
  }

  let totalOfertas = 0;
  for (const slug of Object.keys(OFFERS)) {
    const productId = productBySlug[slug];
    if (!productId) continue;

    for (const oferta of OFFERS[slug]) {
      const seller = sellersByEmail[oferta.sellerEmail];
      if (!seller) continue;

      // Comprobamos si ya existe esa oferta para ese vendedor y producto.
      const yaExiste = await db.query.listings.findFirst({
        where: and(
          eq(listings.sellerId, seller.id),
          eq(listings.productId, productId),
        ),
      });

      if (!yaExiste) {
        await db.insert(listings).values({
          sellerId: seller.id,
          productId,
          pricePerKg: oferta.price.toFixed(2),
          active: true,
        });
        totalOfertas++;
      }
    }
  }
  console.log(` → ${totalOfertas} ofertas nuevas OK`);

  console.log('\nSeed terminado.');
  console.log(`Contraseña común: ${PASSWORD}`);
  console.log('Admin: admin@tfg.com / admin1234');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
