import { PrismaClient, Role, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding KasirSimpel database...");

  // 1. Bersihkan data sebelumnya (urutan relasi child -> parent)
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat Akun Pengguna Utama (Sesuai Spesifikasi Setup)
  const owner = await prisma.user.create({
    data: {
      name: "Budi Gunawan (Owner)",
      email: "owner@kasir.com",
      password: "owner123",
      role: Role.OWNER,
    },
  });

  const karyawan = await prisma.user.create({
    data: {
      name: "Ahmad Kasir (Karyawan)",
      email: "kasir@kasir.com",
      password: "kasir123",
      role: Role.KARYAWAN,
    },
  });

  console.log("Pengguna terdaftar:", [
    { email: owner.email, role: owner.role },
    { email: karyawan.email, role: karyawan.role },
  ]);

  // 3. Buat Kategori Produk
  const catMakanan = await prisma.category.create({
    data: { name: "Makanan", slug: "makanan", description: "Menu makanan siap santap" },
  });
  const catMinuman = await prisma.category.create({
    data: { name: "Minuman", slug: "minuman", description: "Minuman hangat dan dingin" },
  });
  const catSnak = await prisma.category.create({
    data: { name: "Snak", slug: "snak", description: "Camilan dan makanan ringan" },
  });

  // 4. Buat 8 Produk Dummy Siap Uji POS
  const dummyProducts = [
    {
      name: "Nasi Ayam Geprek Sambal Bawang",
      sku: "MKN-001",
      barcode: "8992001001",
      price: 22000,
      costPrice: 12000,
      stock: 25,
      unit: "porsi",
      categoryId: catMakanan.id,
    },
    {
      name: "Nasi Goreng Spesial Telur",
      sku: "MKN-002",
      barcode: "8992001002",
      price: 20000,
      costPrice: 9500,
      stock: 18,
      unit: "porsi",
      categoryId: catMakanan.id,
    },
    {
      name: "Mie Goreng Jawa",
      sku: "MKN-003",
      barcode: "8992001003",
      price: 18000,
      costPrice: 8000,
      stock: 4, // Peringatan stok menipis
      unit: "porsi",
      categoryId: catMakanan.id,
    },
    {
      name: "Kopi Susu Gula Aren",
      sku: "MNM-001",
      barcode: "8991001001",
      price: 18000,
      costPrice: 8000,
      stock: 35,
      unit: "cup",
      categoryId: catMinuman.id,
    },
    {
      name: "Es Teh Manis Melati",
      sku: "MNM-002",
      barcode: "8991001002",
      price: 6000,
      costPrice: 2000,
      stock: 50,
      unit: "cup",
      categoryId: catMinuman.id,
    },
    {
      name: "Air Mineral 600ml Dingin",
      sku: "MNM-003",
      barcode: "8991001003",
      price: 5000,
      costPrice: 2800,
      stock: 45,
      unit: "botol",
      categoryId: catMinuman.id,
    },
    {
      name: "Kentang Goreng Saus Keju",
      sku: "SNK-001",
      barcode: "8994001001",
      price: 15000,
      costPrice: 7000,
      stock: 12,
      unit: "porsi",
      categoryId: catSnak.id,
    },
    {
      name: "Keripik Singkong Balado",
      sku: "SNK-002",
      barcode: "8994001002",
      price: 10000,
      costPrice: 5000,
      stock: 0, // Habis untuk tes alert out-of-stock
      unit: "bks",
      categoryId: catSnak.id,
    },
  ];

  for (const product of dummyProducts) {
    await prisma.product.create({ data: product });
  }

  console.log(`Berhasil menambahkan ${dummyProducts.length} produk katalog dummy.`);

  // 5. Buat 1 Contoh Transaksi Awal
  const sample1 = await prisma.product.findUnique({ where: { sku: "MKN-001" } });
  const sample2 = await prisma.product.findUnique({ where: { sku: "MNM-001" } });

  if (sample1 && sample2) {
    const initialTrx = await prisma.transaction.create({
      data: {
        invoiceNumber: "INV-20261022-0001",
        totalAmount: 40000,
        discount: 0,
        tax: 4000,
        finalAmount: 44000,
        paidAmount: 50000,
        changeAmount: 6000,
        paymentMethod: PaymentMethod.TUNAI,
        userId: karyawan.id,
        items: {
          create: [
            {
              productId: sample1.id,
              productName: sample1.name,
              priceAtPurchase: sample1.price,
              quantity: 1,
              subtotal: 22000,
            },
            {
              productId: sample2.id,
              productName: sample2.name,
              priceAtPurchase: sample2.price,
              quantity: 1,
              subtotal: 18000,
            },
          ],
        },
      },
    });
    console.log("Contoh transaksi awal dibuat:", initialTrx.invoiceNumber);
  }

  console.log("Seeding database KasirSimpel sukses!");
}

main()
  .catch((e) => {
    console.error("Gagal melakukan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
