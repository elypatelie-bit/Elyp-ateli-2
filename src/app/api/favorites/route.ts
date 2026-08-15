import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-auth';

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: 'Entre na sua conta' }, { status: 401 });

  const { productId } = await req.json();
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const current = user.favorites || [];
  const updated = current.includes(productId) ? current.filter((id: string) => id !== productId) : [...current, productId];

  await prisma.user.update({ where: { id: userId }, data: { favorites: updated } });
  return NextResponse.json({ favorites: updated });
}
