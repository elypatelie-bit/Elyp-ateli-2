import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Configure essa URL como webhook no painel do Mercado Pago
 * (Suas integrações > sua aplicação > Webhooks):
 *   https://seudominio.com/api/webhooks/mercadopago
 *
 * Esse endpoint recebe uma notificação de "payment", busca os detalhes na API
 * do Mercado Pago e, se o pagamento estiver aprovado, marca o pedido correspondente
 * como PAID automaticamente — sem precisar de clique manual no painel.
 *
 * IMPORTANTE: isso assume que você gerou a cobrança PIX através da API do
 * Mercado Pago (não apenas com o código EMV estático de src/lib/pix.ts) e
 * guardou o `mpPaymentId` no pedido. Se você continuar usando só o PIX estático
 * (chave Pix direta, sem gateway), não existe confirmação automática possível —
 * nesse caso o "Marcar como pago" manual no painel admin continua sendo o fluxo.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = body?.data?.id;
    if (!paymentId) return NextResponse.json({ received: true });

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado — ignorando webhook.');
      return NextResponse.json({ received: true });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payment = await mpRes.json();

    if (payment.status === 'approved') {
      const order = await prisma.order.findFirst({ where: { mpPaymentId: String(paymentId) } });
      if (order && order.paymentStatus !== 'PAID') {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } });
          await tx.ledgerEntry.create({
            data: {
              description: `Pedido #${order.dailyNumber} (Mercado Pago)`,
              amount: order.totalAmount,
              type: 'INCOME',
              category: 'Vendas',
              orderId: order.id
            }
          });
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return NextResponse.json({ received: true }); // sempre 200, senão o MP fica re-tentando
  }
}
