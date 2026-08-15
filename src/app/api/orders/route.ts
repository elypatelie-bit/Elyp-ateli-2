import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/require-auth';
import { generatePixBRCode } from '@/lib/pix';
import { calculateShipping } from '@/lib/shipping';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: status && status !== 'TODOS' ? { status: status as any } : {},
    include: { customer: true, items: true },
    orderBy: { createdAt: 'desc' }
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [pedidosHoje, pedidosPendentes] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } })
  ]);

  return NextResponse.json({ orders, metrics: { pedidosHoje, pedidosPendentes } });
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: 'Entre na sua conta para finalizar o pedido' }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { items, cep, street, number, neighborhood, city, complement, paymentMethod, splitAmount, couponCode } = body;

  if (!items?.length) return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
  if (!cep || !street || !number || !neighborhood || !city) {
    return NextResponse.json({ error: 'Endereço de entrega incompleto' }, { status: 400 });
  }
  if (!['PIX', 'SPLIT', 'CARD'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 });
  }

  try {
    // 1) recalcula tudo no servidor (nunca confia em preço/total vindo do cliente)
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    let subtotal = 0;
    const orderItemsData: any[] = [];
    for (const cartItem of items) {
      const product = products.find((p: any) => p.id === cartItem.productId);
      if (!product || !product.isActive) throw new Error(`Produto indisponível: ${cartItem.title || cartItem.productId}`);
      if (!product.isMadeToOrder && product.stockQuantity < cartItem.quantity) {
        throw new Error(`Estoque insuficiente para "${product.title}" (disponível: ${product.stockQuantity})`);
      }
      const variant = (product.variantOptions as any[] | null)?.find((v: any) => v.name === cartItem.variantName);
      const basePrice = product.promoPrice && Number(product.promoPrice) < Number(product.price) ? product.promoPrice : product.price;
      const unitPrice = Number(basePrice) + Number(variant?.priceDelta || 0);
      subtotal += unitPrice * cartItem.quantity;
      orderItemsData.push({
        productId: product.id,
        title: product.title + (cartItem.variantName ? ` — ${cartItem.variantName}` : ''),
        variantName: cartItem.variantName || null,
        price: unitPrice,
        quantity: cartItem.quantity
      });
    }

    // 2) frete real, calculado de novo no servidor a partir do CEP
    const shipping = await calculateShipping(cep);
    if (!shipping) throw new Error('Não foi possível calcular o frete para esse CEP');

    // 3) cupom (se houver), validado de novo no servidor
    let discount = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: String(couponCode).toUpperCase() } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue)) {
          discount = coupon.isPercentage ? subtotal * (Number(coupon.discountValue) / 100) : Math.min(Number(coupon.discountValue), subtotal);
          couponId = coupon.id;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + shipping.fee - discount);

    // 4) PIX (se aplicável)
    const store = await prisma.store.findFirst();
    let pixBrCode: string | null = null;
    const pixAmount = paymentMethod === 'SPLIT' ? Number(splitAmount) || totalAmount / 2 : totalAmount;
    if (paymentMethod === 'PIX' || paymentMethod === 'SPLIT') {
      const pix = await generatePixBRCode({
        pixKey: store!.pixKey,
        merchantName: store!.merchantName,
        merchantCity: store!.city,
        amount: pixAmount,
        txid: `ORD${Date.now()}`
      });
      pixBrCode = pix.brCode;
    }

    // 5) tudo isso numa transação: cria pedido + desconta estoque + atualiza cliente
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId: userId,
          status: 'NEW',
          statusHistory: [{ status: 'NEW', at: new Date().toISOString() }],
          subtotal,
          shippingFee: shipping.fee,
          discount,
          totalAmount,
          estimatedDeliveryDays: shipping.days,
          paymentMethod,
          paymentStatus: 'PENDING',
          pixBrCode,
          cep, street, number, neighborhood, city, complement,
          couponId,
          items: { create: orderItemsData }
        },
        include: { items: true }
      });

      for (const item of orderItemsData) {
        const product = products.find((p: any) => p.id === item.productId)!;
        if (!product.isMadeToOrder) {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: { decrement: item.quantity } }
          });
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: totalAmount },
          lastAddress: { cep, street, number, neighborhood, city, complement }
        }
      });

      return created;
    });

    // e-mail de confirmação (não bloqueia a resposta se falhar)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    sendOrderConfirmationEmail({
      to: user?.email,
      storeName: store!.name,
      dailyNumber: order.dailyNumber,
      totalAmount,
      itemsHtml: `<ul>${orderItemsData.map((i: any) => `<li>${i.quantity}x ${i.title}</li>`).join('')}</ul>`
    }).catch((e) => console.error('Falha ao enviar e-mail:', e));

    return NextResponse.json({ order, pixAmount }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erro ao criar pedido' }, { status: 400 });
  }
}
