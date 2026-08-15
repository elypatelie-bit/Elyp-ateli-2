import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' }
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { name, emoji } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

  const category = await prisma.category.create({ data: { name, emoji } });
  return NextResponse.json(category, { status: 201 });
}
