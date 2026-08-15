import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const category = await prisma.category.update({ where: { id: params.id }, data: body });
  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const productsUsingIt = await prisma.product.count({ where: { categoryId: params.id } });
  if (productsUsingIt > 0) {
    return NextResponse.json({ error: 'Remova ou realoque os produtos desta categoria antes' }, { status: 400 });
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
