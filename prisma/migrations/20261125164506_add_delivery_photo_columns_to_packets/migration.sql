-- AlterTable
ALTER TABLE "packets" ADD COLUMN     "delivery_photo_key" TEXT,
ADD COLUMN     "delivery_photo_mime_type" TEXT,
ADD COLUMN     "delivery_photo_size" INTEGER,
ADD COLUMN     "delivery_photo_uploaded_at" TIMESTAMP(3);
