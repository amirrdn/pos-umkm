-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ALTER COLUMN "password" DROP NOT NULL;
