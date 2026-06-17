CREATE TABLE "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "targetId" TEXT,
    "href" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");
CREATE INDEX "AdminActivityLog_kind_createdAt_idx" ON "AdminActivityLog"("kind", "createdAt");
CREATE INDEX "AdminActivityLog_actorId_createdAt_idx" ON "AdminActivityLog"("actorId", "createdAt");
