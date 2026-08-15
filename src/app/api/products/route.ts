import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get('all') === '1';
  const session = includeInactive ? await requireAdmin() : null;

  const products = await prisma.product.findMany({
    where: includeInactive && session ? {} : { isActive: true },
    include: {
      category: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } }
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
  });

  const withRating = products.map((p: any) => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length : 0
  }));

  return NextResponse.json(withRating);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.price) {
    return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      title: body.title,
      description: body.description || null,
      price: body.price,
      promoPrice: body.promoPrice || null,
      categoryId: body.categoryId || null,
      stockQuantity: body.stockQuantity ?? 0,
      isMadeToOrder: !!body.isMadeToOrder,
      isPinned: !!body.isPinned,
      isActive: body.isActive ?? true,
      images: body.images || [],
      variantLabel: body.variantLabel || null,
      variantOptions: body.variantOptions || []
    }
  });

  return NextResponse.json(product, { status: 201 });
}
