/*
  Warnings:

  - You are about to drop the column `strands` on the `ClassSubject` table. All the data in the column will be lost.
  - You are about to drop the column `nemisCode` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `nemisUpi` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `isCore` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `tscNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Assessment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[kemisCode]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kemisUpi]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectCategory` to the `ClassSubject` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_classSubjectId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_termId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_classTeacherId_fkey";

-- DropForeignKey
ALTER TABLE "ClassSubject" DROP CONSTRAINT "ClassSubject_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_streamTeacherId_fkey";

-- DropIndex
DROP INDEX "School_nemisCode_key";

-- DropIndex
DROP INDEX "Student_nemisUpi_key";

-- DropIndex
DROP INDEX "User_tscNumber_key";

-- AlterTable
ALTER TABLE "ClassSubject" DROP COLUMN "strands",
ADD COLUMN     "subjectCategory" "SubjectCategory" NOT NULL;

-- AlterTable
ALTER TABLE "School" DROP COLUMN "nemisCode",
ADD COLUMN     "kemisCode" TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "nemisUpi",
ADD COLUMN     "kemisUpi" TEXT;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "isCore";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tscNumber";

-- DropTable
DROP TABLE "Assessment";

-- CreateTable
CREATE TABLE "Strand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubjectStrand" (
    "id" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "strandId" TEXT NOT NULL,

    CONSTRAINT "ClassSubjectStrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "maxMarks" DOUBLE PRECISION,
    "termId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "strandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentDefId" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "grade" TEXT,
    "competencyLevel" "CompetencyLevel",
    "comment" TEXT,
    "assessedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubjectStrand_classSubjectId_strandId_key" ON "ClassSubjectStrand"("classSubjectId", "strandId");

-- CreateIndex
CREATE INDEX "AssessmentDefinition_termId_idx" ON "AssessmentDefinition"("termId");

-- CreateIndex
CREATE INDEX "AssessmentDefinition_classSubjectId_idx" ON "AssessmentDefinition"("classSubjectId");

-- CreateIndex
CREATE INDEX "AssessmentDefinition_strandId_idx" ON "AssessmentDefinition"("strandId");

-- CreateIndex
CREATE INDEX "AssessmentResult_studentId_idx" ON "AssessmentResult"("studentId");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessmentDefId_idx" ON "AssessmentResult"("assessmentDefId");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessedById_idx" ON "AssessmentResult"("assessedById");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_studentId_assessmentDefId_key" ON "AssessmentResult"("studentId", "assessmentDefId");

-- CreateIndex
CREATE UNIQUE INDEX "School_kemisCode_key" ON "School"("kemisCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_kemisUpi_key" ON "Student"("kemisUpi");

-- RenameForeignKey
ALTER TABLE "ClassSubject" RENAME CONSTRAINT "ClassSubject_teacherProfile_fkey" TO "ClassSubject_teacherId_fkey";

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_streamTeacherId_fkey" FOREIGN KEY ("streamTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strand" ADD CONSTRAINT "Strand_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectStrand" ADD CONSTRAINT "ClassSubjectStrand_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubjectStrand" ADD CONSTRAINT "ClassSubjectStrand_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDefinition" ADD CONSTRAINT "AssessmentDefinition_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDefinition" ADD CONSTRAINT "AssessmentDefinition_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDefinition" ADD CONSTRAINT "AssessmentDefinition_strandId_fkey" FOREIGN KEY ("strandId") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessmentDefId_fkey" FOREIGN KEY ("assessmentDefId") REFERENCES "AssessmentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
