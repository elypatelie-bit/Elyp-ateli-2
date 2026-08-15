// Promove um usuário (que já fez login pelo menos uma vez) para ADMIN.
// Uso: npx tsx prisma/make-admin.ts seu-email@gmail.com
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error('Uso: npx tsx prisma/make-admin.ts seu-email@gmail.com');
  process.exit(1);
}

prisma.user
  .update({ where: { email }, data: { role: 'ADMIN' } })
  .then((u) => console.log(`✅ ${u.email} agora é ADMIN.`))
  .catch((e) => {
    console.error('Erro: verifique se esse e-mail já fez login pelo menos uma vez no site.', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
