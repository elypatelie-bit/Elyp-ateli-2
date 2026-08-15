import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    const clean = String(phone || '').replace(/\D/g, '');

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: clean, token: String(code || '') } }
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json({ valid: false, error: 'Código inválido ou expirado' }, { status: 400 });
    }

    // Não apagamos aqui: o provider "phone-otp" do NextAuth (src/lib/auth.ts)
    // consome e apaga esse token no momento do signIn(), evitando reuso.
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ valid: false, error: 'Erro ao verificar código' }, { status: 500 });
  }
}
