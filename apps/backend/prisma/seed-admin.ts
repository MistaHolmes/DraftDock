import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = 'supritnaik2222@gmail.com';

  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: { email: adminEmail, role: 'ADMIN' },
    });

    console.log(`✅ Admin user seeded: ${user.email} (role: ${user.role})`);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
