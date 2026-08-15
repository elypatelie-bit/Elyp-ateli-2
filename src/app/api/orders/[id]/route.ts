import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireAdmin } from '@/lib/require-auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, customer: { select: { name: true, phone: true, email: true } }, coupon: true }
  });
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

  const userId = (session.user as any).id;
  const isOwner = order.customerId === userId;
  const isAdmin = (session.user as any).role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Não é possível editar um pedido já entregue ou cancelado' }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // reconcilia estoque se as quantidades dos itens mudaram
    if (body.items) {
      for (const oldItem of order.items) {
        const newItem = body.items.find((i: any) => i.productId === oldItem.productId);
        const newQty = newItem ? newItem.quantity : 0;
        const delta = oldItem.quantity - newQty; // positivo = devolve, negativo = consome
        if (delta !== 0 && oldItem.productId) {
          const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
          if (product && !product.isMadeToOrder) {
            await tx.product.update({ where: { id: product.id }, data: { stockQuantity: Math.max(0, product.stockQuantity + delta) } });
          }
        }
      }
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({
        data: body.items.map((i: any) => ({
          orderId: order.id,
          productId: i.productId,
          title: i.title,
          variantName: i.variantName || null,
          price: i.price,
          quantity: i.quantity
        }))
      });
    }

    const subtotal = body.items ? body.items.reduce((a: number, i: any) => a + i.price * i.quantity, 0) : Number(order.subtotal);
    const shippingFee = body.shippingFee ?? Number(order.shippingFee);
    const discount = body.discount ?? Number(order.discount);

    return tx.order.update({
      where: { id: order.id },
      data: {
        trackingCode: body.trackingCode ?? order.trackingCode,
        cep: body.cep ?? order.cep,
        street: body.street ?? order.street,
        number: body.number ?? order.number,
        neighborhood: body.neighborhood ?? order.neighborhood,
        city: body.city ?? order.city,
        complement: body.complement ?? order.complement,
        subtotal,
        shippingFee,
        discount,
        totalAmount: Math.max(0, subtotal + shippingFee - discount)
      },
      include: { items: true }
    });
  });

  return NextResponse.json(updated);
}
