// sync.ts
import { clerkClient, getAuth } from '@clerk/express';
import prisma from './lib/prisma';

export const syncUser = async (req: any) => {
  const { userId }:any = getAuth(req);
  if (!userId) {
    throw new Error('User not authenticated');
  }
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses[0].emailAddress;

  if (!email) throw new Error("User email not found");

  const prismaUser = await prisma.user.upsert({
    where: { email },
    update: { email },
    create: { email },
  });

  return prismaUser;
};