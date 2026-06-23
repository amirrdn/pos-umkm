import { prisma } from './src/lib/prisma';
import { tenantStorage } from './src/lib/tenantContext';

async function test() {
  try {
    await tenantStorage.run('some-tenant-id', async () => {
      const products = await prisma.product.findMany();
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
