import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-auth';

export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = (session.user as any).id;
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ orders });
}
