import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const transactions = await prisma.ledgerEntry.findMany({ orderBy: { createdAt: 'desc' } });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthTx = transactions.filter((t: any) => t.createdAt >= startOfMonth);

  const receitas = monthTx.filter((t: any) => t.type === 'INCOME').reduce((a: number, t: any) => a + Number(t.amount), 0);
  const despesas = monthTx.filter((t: any) => t.type === 'EXPENSE').reduce((a: number, t: any) => a + Number(t.amount), 0);

  return NextResponse.json({ transactions, summary: { receitas, despesas, saldo: receitas - despesas } });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { description, amount, type, category } = await req.json();
  if (!description || !amount || !type) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const entry = await prisma.ledgerEntry.create({
    data: { description, amount, type, category: category || 'Geral' }
  });
  return NextResponse.json(entry, { status: 201 });
}
