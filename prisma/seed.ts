import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for RYZ Parfums...");

  await prisma.inspiredByConfig.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      globalEnabled: true,
      labelOverride: "INSPIRED BY",
      showImages: true,
    },
  });

  const products = [
    {
      title: "ROYAL OUD EXTRAIT",
      slug: "royal-oud-extrait",
      description: "A majestic blend of rich oud, precious woods, and warm spices crafted for an unforgettable presence.",
      category: "Men",
      concentration: "Extrait de Parfum",
      topNotes: "Pink Pepper, Bergamot, Lemon",
      heartNotes: "Angelica Root, Galbanum, Cedar",
      baseNotes: "Oud, Sandalwood, Tonka Bean",
      longevityRating: 5,
      sillageRating: 5,
      inspiredHouse: "Creed",
      inspiredName: "Royal Oud",
      isFeatured: true,
      variants: [
        { sku: "RYZ-RO-30ML", size: "30ml", pricePesewas: 19900, stock: 50 },
        { sku: "RYZ-RO-50ML", size: "50ml", pricePesewas: 24900, stock: 40 },
        { sku: "RYZ-RO-100ML", size: "100ml", pricePesewas: 29900, stock: 30 },
      ],
    },
    {
      title: "AMBER NECTAR",
      slug: "amber-nectar",
      description: "An intoxicating oriental floral aura boasting sweet saffron, radiant jasmine, and crystalline amber.",
      category: "Unisex",
      concentration: "Extrait de Parfum",
      topNotes: "Grandiflorum Jasmine, Saffron",
      heartNotes: "Bitter Almond, Cedarwood",
      baseNotes: "Ambergris, Woody Musk",
      longevityRating: 5,
      sillageRating: 5,
      inspiredHouse: "Maison Francis Kurkdjian",
      inspiredName: "Baccarat Rouge 540",
      isFeatured: true,
      variants: [
        { sku: "RYZ-AN-30ML", size: "30ml", pricePesewas: 22900, stock: 25 },
        { sku: "RYZ-AN-50ML", size: "50ml", pricePesewas: 28900, stock: 20 },
        { sku: "RYZ-AN-100ML", size: "100ml", pricePesewas: 34900, stock: 15 },
      ],
    },
    {
      title: "EMPEROR EDP",
      slug: "emperor-edp",
      description: "A triumphant scent celebrating strength, vision, and success with crisp pineapple and smoky oakmoss.",
      category: "Men",
      concentration: "Eau de Parfum",
      topNotes: "Pineapple, Bergamot, Blackcurrant, Apple",
      heartNotes: "Birch, Patchouli, Moroccan Jasmine, Rose",
      baseNotes: "Musk, Oakmoss, Ambergris, Vanilla",
      longevityRating: 4,
      sillageRating: 5,
      inspiredHouse: "Creed",
      inspiredName: "Aventus",
      isFeatured: true,
      variants: [
        { sku: "RYZ-EMP-30ML", size: "30ml", pricePesewas: 18900, stock: 0 },
        { sku: "RYZ-EMP-50ML", size: "50ml", pricePesewas: 23900, stock: 10 },
        { sku: "RYZ-EMP-100ML", size: "100ml", pricePesewas: 28900, stock: 12 },
      ],
    },
    {
      title: "VELVET ROSE",
      slug: "velvet-rose",
      description: "Dark Damask rose wrapped in smoky oud wood, clove, and decadent praline.",
      category: "Women",
      concentration: "Extrait de Parfum",
      topNotes: "Clove, Bergamot",
      heartNotes: "Damask Rose, Praline",
      baseNotes: "Oud Wood, Amberwood",
      longevityRating: 5,
      sillageRating: 4,
      inspiredHouse: "Jo Malone",
      inspiredName: "Velvet Rose & Oud",
      isFeatured: true,
      variants: [
        { sku: "RYZ-VR-30ML", size: "30ml", pricePesewas: 19900, stock: 30 },
        { sku: "RYZ-VR-50ML", size: "50ml", pricePesewas: 24900, stock: 25 },
        { sku: "RYZ-VR-100ML", size: "100ml", pricePesewas: 29900, stock: 20 },
      ],
    },
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        category: p.category,
        concentration: p.concentration,
        topNotes: p.topNotes,
        heartNotes: p.heartNotes,
        baseNotes: p.baseNotes,
        longevityRating: p.longevityRating,
        sillageRating: p.sillageRating,
        inspiredHouse: p.inspiredHouse,
        inspiredName: p.inspiredName,
        isFeatured: p.isFeatured,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: createdProduct.id,
          sku: v.sku,
          size: v.size,
          pricePesewas: v.pricePesewas,
          stock: v.stock,
        },
      });
    }
  }

  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      percentageOff: 10.0,
      minSpendGhs: 10000,
      isActive: true,
    },
  });

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
