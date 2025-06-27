/*
  Warnings:

  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `amountPaid` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaidCny` on the `Order` table. All the data in the column will be lost.
  - The `currency` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderRefund` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `originalPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - The `currency` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountCny` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderNumber` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'TWD', 'SGD', 'AUD', 'CAD');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderRefund" DROP CONSTRAINT "OrderRefund_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderRefund" DROP CONSTRAINT "OrderRefund_parentId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "amountPaid",
DROP COLUMN "amountPaidCny",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "amountCny" INTEGER NOT NULL,
ADD COLUMN     "channelId" INTEGER,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "customerPhoneCode" TEXT,
ADD COLUMN     "externalOrderData" JSONB,
ADD COLUMN     "orderNumber" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "productId" SET DATA TYPE TEXT,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency",
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Order_id_seq";

-- AlterTable
ALTER TABLE "OrderRefund" DROP CONSTRAINT "OrderRefund_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orderId" SET DATA TYPE TEXT,
ALTER COLUMN "parentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "OrderRefund_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "OrderRefund_id_seq";

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "originalPrice" SET DATA TYPE INTEGER,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'CNY',
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Product_id_seq";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums" (
    "id" VARCHAR(50) NOT NULL,
    "project_id" VARCHAR(50),
    "title" VARCHAR(100),
    "description" TEXT,
    "week" INTEGER,
    "topics" JSONB,
    "goals" JSONB,

    CONSTRAINT "curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "subtitle" VARCHAR(150),
    "category" VARCHAR(50),
    "image" VARCHAR(200),
    "duration" VARCHAR(20),
    "level" VARCHAR(20),
    "max_students" INTEGER,
    "description" TEXT,
    "slug" VARCHAR(50),
    "prerequisites" JSONB,
    "outcomes" JSONB,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "channels_code_idx" ON "channels"("code");

-- CreateIndex
CREATE INDEX "curriculums_project_id_idx" ON "curriculums"("project_id");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- CreateIndex
CREATE INDEX "Order_channelId_idx" ON "Order"("channelId");

-- CreateIndex
CREATE INDEX "Order_currentOwnerId_idx" ON "Order"("currentOwnerId");

-- CreateIndex
CREATE INDEX "Order_financialClosed_idx" ON "Order"("financialClosed");

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");

-- CreateIndex
CREATE INDEX "Order_effectiveDate_idx" ON "Order"("effectiveDate");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_orderCode_idx" ON "Order"("orderCode");

-- CreateIndex
CREATE INDEX "OrderRefund_orderId_idx" ON "OrderRefund"("orderId");

-- CreateIndex
CREATE INDEX "OrderRefund_createdBy_idx" ON "OrderRefund"("createdBy");

-- CreateIndex
CREATE INDEX "OrderRefund_isFinancialSettled_idx" ON "OrderRefund"("isFinancialSettled");

-- CreateIndex
CREATE INDEX "OrderRefund_submittedAt_idx" ON "OrderRefund"("submittedAt");

-- AddForeignKey
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRefund" ADD CONSTRAINT "OrderRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRefund" ADD CONSTRAINT "OrderRefund_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrderRefund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
