-- CreateEnum
CREATE TYPE "CollabTokenStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "ydocState" BYTEA;

-- CreateTable
CREATE TABLE "CollabSession" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CollabSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollabInviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "CollabTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 5,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollabInviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollabSession_blogId_idx" ON "CollabSession"("blogId");

-- CreateIndex
CREATE INDEX "CollabSession_userId_idx" ON "CollabSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollabInviteToken_token_key" ON "CollabInviteToken"("token");

-- CreateIndex
CREATE INDEX "CollabInviteToken_token_idx" ON "CollabInviteToken"("token");

-- CreateIndex
CREATE INDEX "CollabInviteToken_blogId_idx" ON "CollabInviteToken"("blogId");

-- AddForeignKey
ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabSession" ADD CONSTRAINT "CollabSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabInviteToken" ADD CONSTRAINT "CollabInviteToken_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabInviteToken" ADD CONSTRAINT "CollabInviteToken_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
