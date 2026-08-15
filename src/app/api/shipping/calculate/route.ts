import { NextResponse } from 'next/server';
import { calculateShipping } from '@/lib/shipping';

export async function POST(req: Request) {
  try {
    const { cep } = await req.json();
    const result = await calculateShipping(cep);
    if (!result) {
      return NextResponse.json({ error: 'CEP não encontrado ou inválido' }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
