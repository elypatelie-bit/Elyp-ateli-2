import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  if (!body.code || !body.discountValue) {
    return NextResponse.json({ error: 'Código e valor são obrigatórios' }, { status: 400 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: String(body.code).toUpperCase(),
      discountValue: body.discountValue,
      isPercentage: !!body.isPercentage,
      minOrderValue: body.minOrderValue || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json(coupon, { status: 201 });
}
