import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/require-auth';

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: 'Entre na sua conta para avaliar' }, { status: 401 });

  const { productId, rating, comment } = await req.json();
  const userId = (session.user as any).id;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  // só permite avaliar produtos de pedidos ENTREGUES desse cliente
  const eligibleOrder = await prisma.order.findFirst({
    where: { customerId: userId, status: 'DELIVERED', items: { some: { productId } } }
  });
  if (!eligibleOrder) {
    return NextResponse.json({ error: 'Você só pode avaliar produtos que já recebeu' }, { status: 403 });
  }

  const review = await prisma.review.upsert({
    where: { productId_userId: { productId, userId } },
    update: { rating, comment },
    create: { productId, userId, rating, comment, orderId: eligibleOrder.id }
  });

  return NextResponse.json(review, { status: 201 });
}
