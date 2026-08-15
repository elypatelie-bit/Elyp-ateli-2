import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpSms, generateOtpCode } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const clean = String(phone || '').replace(/\D/g, '');
    if (clean.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    const code = generateOtpCode();

    // remove códigos antigos desse telefone antes de criar um novo
    await prisma.verificationToken.deleteMany({ where: { identifier: clean } });
    await prisma.verificationToken.create({
      data: {
        identifier: clean,
        token: code,
        expires: new Date(Date.now() + 5 * 60 * 1000) // expira em 5 minutos
      }
    });

    const result = await sendOtpSms(clean, code);

    // Em modo demo (sem Twilio configurado) devolvemos o código na resposta
    // pra tela conseguir mostrar "código de demonstração", igual ao protótipo.
    return NextResponse.json({ success: true, demo: result.demo, demoCode: result.demo ? code : undefined });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 });
  }
}
