import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

const STATUS_FLOW: Record<string, string> = {
  NEW: 'CONFIRMED',
  CONFIRMED: 'IN_PREPARATION',
  IN_PREPARATION: 'READY',
  READY: 'DISPATCHED',
  DISPATCHED: 'DELIVERED'
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { action } = await req.json(); // 'advance' | 'cancel' | 'markPaid'
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

  const history = Array.isArray(order.statusHistory) ? (order.statusHistory as any[]) : [];

  if (action === 'advance') {
    const next = STATUS_FLOW[order.status];
    if (!next) return NextResponse.json({ error: 'Este pedido já está no status final' }, { status: 400 });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: next as any, statusHistory: [...history, { status: next, at: new Date().toISOString() }] }
    });
    return NextResponse.json(updated);
  }

  if (action === 'cancel') {
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Este pedido não pode mais ser cancelado' }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product && !product.isMadeToOrder) {
            await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
          }
        }
      }
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', statusHistory: [...history, { status: 'CANCELLED', at: new Date().toISOString() }] }
      });
    });
    return NextResponse.json(updated);
  }

  if (action === 'markPaid') {
    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } });
      await tx.ledgerEntry.create({
        data: {
          description: `Pedido #${order.dailyNumber}`,
          amount: order.totalAmount,
          type: 'INCOME',
          category: 'Vendas',
          orderId: order.id
        }
      });
      return o;
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
