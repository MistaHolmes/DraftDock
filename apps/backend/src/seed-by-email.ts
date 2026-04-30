import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'abhastheaiexpert@gmail.com';
  console.log(`Seeding blogs for ${email}...`);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Abhas — The AI Expert',
        profilePicture: 'https://ui-avatars.com/api/?name=Abhas+AI&background=111827&color=fff',
        bio: 'Seeded demo user',
        isVerified: true,
        role: 'AUTHOR',
      },
    });
    console.log('Created user:', user.id);
  } else {
    console.log('Found user:', user.id);
  }

  const sampleBlogs = [
    {
      title: 'AI in 2026: How Developers Will Work',
      content: '<h2>AI is reshaping workflows</h2><p>Content powered by a seed script.</p>',
      summary: 'How AI will change developer workflows in 2026.',
      coverImage: 'https://images.unsplash.com/photo-1551887353-8203f3f5e8a1?w=800&q=80',
      published: true,
    },
    {
      title: 'Practical Prompt Engineering Tips',
      content: '<h2>Prompting is an art</h2><p>Practical tips for reliable prompts.</p>',
      summary: 'Short, actionable prompt engineering tips.',
      coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
      published: true,
    },
    {
      title: 'Scaling PostgreSQL with Prisma',
      content: '<h2>Scale safely</h2><p>Best practices for Prisma + Postgres.</p>',
      summary: 'Guidance for scaling Postgres with Prisma.',
      coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      published: true,
    },
  ];

  for (const blog of sampleBlogs) {
    const existing = await prisma.blog.findFirst({ where: { title: blog.title, authorId: user.id }, select: { id: true } });
    if (existing) {
      console.log(`Skipping (exists): ${blog.title}`);
      continue;
    }

    await prisma.blog.create({ data: { ...blog, authorId: user.id } });
    console.log('Created:', blog.title);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
