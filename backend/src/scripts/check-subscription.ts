import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@tokoutama.com';
  console.log(`Mencari user dengan email: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true
        }
      },
      tenant: {
        include: {
          subscriptionInvoices: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });

  if (!user) {
    console.log(`User dengan email ${email} tidak ditemukan.`);
    return;
  }

  console.log('=== DATA USER ===');
  console.log(`ID: ${user.id}`);
  console.log(`Name: ${user.name}`);
  console.log(`Roles: ${user.userRoles.map((ur) => ur.role.name).join(', ')}`);
  console.log(`Tenant ID: ${user.tenantId}`);

  const tenant = user.tenant;
  if (!tenant) {
    console.log('User tidak memiliki tenant.');
    return;
  }

  console.log('\n=== DATA TENANT & LANGGANAN SEBELUMNYA ===');
  console.log(`Nama Toko/Tenant: ${tenant.name}`);
  console.log(`Tier: ${tenant.subscriptionTier}`);
  console.log(`Status: ${tenant.subscriptionStatus}`);
  console.log(`Expires At: ${tenant.subscriptionExpiresAt}`);
  console.log(`Last Billing At: ${tenant.lastBillingAt}`);

  console.log('\n=== RIWAYAT INVOICE LANGGANAN ===');
  if (tenant.subscriptionInvoices.length === 0) {
    console.log('Belum ada invoice langganan.');
  } else {
    tenant.subscriptionInvoices.forEach((inv) => {
      console.log(`- Invoice: ${inv.invoiceNumber} | Tier: ${inv.tier} | Amount: ${inv.amount} | Status: ${inv.status} | Token: ${inv.paymentToken ? 'Ada' : 'Tidak Ada'} | Created: ${inv.createdAt}`);
    });
  }

  // Jika argumen --reset diberikan, reset langganan ke ACTIVE - FREE
  const args = process.argv.slice(2);
  if (args.includes('--reset-free')) {
    console.log('\n[RESET] Mereset status langganan tenant ke paket FREE - ACTIVE...');
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: null,
      }
    });
    console.log('Berhasil mereset ke FREE - ACTIVE!');
  } else if (args.includes('--set-growth-active')) {
    console.log('\n[UPDATE] Mengubah status langganan tenant ke paket GROWTH - ACTIVE (30 hari)...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionTier: SubscriptionTier.GROWTH,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: expiresAt,
        lastBillingAt: new Date(),
      }
    });

    // Jika ada invoice pending, set ke PAID agar sinkron
    const pendingInvoice = tenant.subscriptionInvoices.find(inv => inv.status === 'PENDING');
    if (pendingInvoice) {
      console.log(`Mengubah status invoice ${pendingInvoice.invoiceNumber} menjadi PAID...`);
      await prisma.subscriptionInvoice.update({
        where: { id: pendingInvoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });
    }
    console.log('Berhasil mengaktifkan paket GROWTH - ACTIVE!');
  } else if (args.includes('--delete-history')) {
    console.log('\n[DELETE] Menghapus riwayat invoice dan audit log langganan tenant...');
    const delInvoices = await prisma.subscriptionInvoice.deleteMany({
      where: { tenantId: tenant.id }
    });
    const delHistories = await prisma.subscriptionHistory.deleteMany({
      where: { tenantId: tenant.id }
    });
    console.log(`Berhasil menghapus ${delInvoices.count} invoice dan ${delHistories.count} catatan riwayat.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
