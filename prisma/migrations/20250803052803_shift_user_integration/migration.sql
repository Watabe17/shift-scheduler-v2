-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'employee';

-- CreateTable
CREATE TABLE "public"."positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."required_staffs" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "required_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_key" ON "public"."positions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_positions_userId_positionId_key" ON "public"."employee_positions"("userId", "positionId");

-- AddForeignKey
ALTER TABLE "public"."employee_positions" ADD CONSTRAINT "employee_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_positions" ADD CONSTRAINT "employee_positions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_requests" ADD CONSTRAINT "shift_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_requests" ADD CONSTRAINT "shift_requests_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."required_staffs" ADD CONSTRAINT "required_staffs_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
