// Popula o banco com os dados iniciais da loja.
// Rode com: npm run db:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.store.upsert({
    where: { slug: 'elyp-atelie' },
    update: {},
    create: {
      slug: 'elyp-atelie',
      name: 'Elyp Ateliê',
      whatsapp: '+5521966516910',
      instagram: '@elyp.atelie',
      pixKey: 'elyp.atelie@gmail.com',
      merchantName: 'Elyp Atelie',
      city: 'Sao Paulo',
      state: 'SP',
      address: 'Rua José Domingues, 19 — Enseada'
    }
  });

  const guias = await prisma.category.upsert({
    where: { id: 'seed-cat-guias' },
    update: {},
    create: { id: 'seed-cat-guias', name: 'Guias', emoji: '📿', sortOrder: 1 }
  });
  const pulseiras = await prisma.category.upsert({
    where: { id: 'seed-cat-pulseiras' },
    update: {},
    create: { id: 'seed-cat-pulseiras', name: 'Pulseiras', emoji: '✨', sortOrder: 2 }
  });
  const fios = await prisma.category.upsert({
    where: { id: 'seed-cat-fios' },
    update: {},
    create: { id: 'seed-cat-fios', name: 'Fios de Conta', emoji: '🔮', sortOrder: 3 }
  });

  await prisma.product.upsert({
    where: { id: 'seed-prod-1' },
    update: {},
    create: {
      id: 'seed-prod-1',
      title: 'Guia de Xangô',
      description: 'Guia feita à mão para Xangô, força e justiça.',
      price: 180,
      promoPrice: 200,
      categoryId: guias.id,
      stockQuantity: 8,
      isPinned: true,
      variantLabel: 'Tamanho',
      variantOptions: [
        { name: 'Curto', priceDelta: 0 },
        { name: 'Longo', priceDelta: 15 }
      ]
    }
  });
  await prisma.product.upsert({
    where: { id: 'seed-prod-2' },
    update: {},
    create: {
      id: 'seed-prod-2',
      title: 'Pulseira Búzios e Contas',
      description: 'Pulseira artesanal com búzios naturais.',
      price: 45,
      categoryId: pulseiras.id,
      stockQuantity: 14
    }
  });
  await prisma.product.upsert({
    where: { id: 'seed-prod-3' },
    update: {},
    create: {
      id: 'seed-prod-3',
      title: 'Fio de Conta Iemanjá',
      description: 'Fio de conta longo dedicado a Iemanjá.',
      price: 110,
      categoryId: fios.id,
      stockQuantity: 6
    }
  });

  console.log('✅ Seed concluído. Para virar admin, rode o comando abaixo trocando o e-mail:');
  console.log('   npx tsx prisma/make-admin.ts seu-email@gmail.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
