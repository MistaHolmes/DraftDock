import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of test blogs...');
  
  // Find blogs with test-like titles
  const deletedBlogs = await prisma.blog.deleteMany({
    where: {
      OR: [
        { title: { contains: 'hey how are u', mode: 'insensitive' } },
        { title: { contains: 'hey', mode: 'insensitive' } },
        { title: { contains: 'test', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Deleted ${deletedBlogs.count} test blogs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
