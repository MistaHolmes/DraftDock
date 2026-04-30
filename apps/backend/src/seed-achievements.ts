import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      name: "First Word",
      description: "Published your first story on DraftDock",
      icon: "✍️",
      xpReward: 100,
      criteria: JSON.stringify({ publishedBlogs: 1 })
    },
    {
      name: "Influencer",
      description: "Reached 100 total likes across all stories",
      icon: "🔥",
      xpReward: 500,
      criteria: JSON.stringify({ totalLikes: 100 })
    },
    {
      name: "Community Pillar",
      description: "Received 10 comments on your stories",
      icon: "🏛️",
      xpReward: 300,
      criteria: JSON.stringify({ receivedComments: 10 })
    },
    {
      name: "Binge Reader",
      description: "Read 10 different stories",
      icon: "📚",
      xpReward: 200,
      criteria: JSON.stringify({ readingHistory: 10 })
    },
    {
      name: "Rising Star",
      description: "Reached 50 followers",
      icon: "🌟",
      xpReward: 400,
      criteria: JSON.stringify({ followers: 50 })
    }
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: a,
      create: a,
    });
  }

  console.log("Achievements seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
