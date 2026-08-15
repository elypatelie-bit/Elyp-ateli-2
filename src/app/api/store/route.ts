import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function GET() {
  const store = await prisma.store.findFirst();
  return NextResponse.json(store);
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const store = await prisma.store.findFirst();
  if (!store) return NextResponse.json({ error: 'Loja não encontrada — rode o seed primeiro' }, { status: 404 });

  const updated = await prisma.store.update({ where: { id: store.id }, data: body });
  return NextResponse.json(updated);
}
