-- CreateTable
CREATE TABLE "public"."OrderStats" (
    "id" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderStats_pkey" PRIMARY KEY ("id")
);
