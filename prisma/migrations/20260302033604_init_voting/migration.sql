-- CreateTable
CREATE TABLE "ElectionSettings" (
    "id" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxWinners" INTEGER NOT NULL DEFAULT 1,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "positionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voter" (
    "id" SERIAL NOT NULL,
    "coopId" TEXT NOT NULL,
    "coopIdNormalized" TEXT NOT NULL,
    "fullName" TEXT,
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" SERIAL NOT NULL,
    "voterId" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotSelection" (
    "id" SERIAL NOT NULL,
    "ballotId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BallotSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_key" ON "Position"("name");

-- CreateIndex
CREATE INDEX "Position_displayOrder_name_idx" ON "Position"("displayOrder", "name");

-- CreateIndex
CREATE INDEX "Candidate_positionId_idx" ON "Candidate"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_positionId_name_key" ON "Candidate"("positionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Voter_coopIdNormalized_key" ON "Voter"("coopIdNormalized");

-- CreateIndex
CREATE INDEX "Voter_coopIdNormalized_idx" ON "Voter"("coopIdNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_voterId_key" ON "Ballot"("voterId");

-- CreateIndex
CREATE INDEX "Ballot_submittedAt_idx" ON "Ballot"("submittedAt");

-- CreateIndex
CREATE INDEX "BallotSelection_ballotId_idx" ON "BallotSelection"("ballotId");

-- CreateIndex
CREATE INDEX "BallotSelection_positionId_idx" ON "BallotSelection"("positionId");

-- CreateIndex
CREATE INDEX "BallotSelection_candidateId_idx" ON "BallotSelection"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "BallotSelection_ballotId_positionId_candidateId_key" ON "BallotSelection"("ballotId", "positionId", "candidateId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "Position"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_voterId_fkey"
FOREIGN KEY ("voterId") REFERENCES "Voter"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotSelection" ADD CONSTRAINT "BallotSelection_ballotId_fkey"
FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotSelection" ADD CONSTRAINT "BallotSelection_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "Position"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotSelection" ADD CONSTRAINT "BallotSelection_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
