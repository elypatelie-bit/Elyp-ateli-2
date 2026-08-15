import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { code, subtotal } = await req.json();
  const coupon = await prisma.coupon.findUnique({ where: { code: String(code || '').toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 });
  }
  if (coupon.minOrderValue && Number(subtotal) < Number(coupon.minOrderValue)) {
    return NextResponse.json({ error: `Pedido mínimo de R$ ${Number(coupon.minOrderValue).toFixed(2)} para este cupom` }, { status: 400 });
  }

  const discount = coupon.isPercentage
    ? Number(subtotal) * (Number(coupon.discountValue) / 100)
    : Math.min(Number(coupon.discountValue), Number(subtotal));

  return NextResponse.json({ valid: true, couponId: coupon.id, code: coupon.code, discount });
}
