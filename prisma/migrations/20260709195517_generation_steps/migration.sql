-- CreateTable
CREATE TABLE "GenerationStep" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GenerationStep" ADD CONSTRAINT "GenerationStep_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
