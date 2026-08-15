import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOrderConfirmationEmail(opts: {
  to?: string | null;
  storeName: string;
  dailyNumber: number;
  totalAmount: number;
  itemsHtml: string;
}) {
  if (!resend || !opts.to) {
    console.log(`✉️  [e-mail não configurado ou cliente sem e-mail] Pedido #${opts.dailyNumber} confirmado.`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Loja <onboarding@resend.dev>',
    to: opts.to,
    subject: `Pedido #${String(opts.dailyNumber).padStart(4, '0')} confirmado — ${opts.storeName}`,
    html: `
      <div style="font-family:Georgia,serif;color:#0C2D6B;max-width:520px;margin:0 auto;padding:24px;">
        <h2>${opts.storeName}</h2>
        <p>Recebemos seu pedido <b>#${String(opts.dailyNumber).padStart(4, '0')}</b>!</p>
        ${opts.itemsHtml}
        <p style="font-weight:bold;">Total: R$ ${opts.totalAmount.toFixed(2)}</p>
        <p style="color:#6B7280;font-size:13px;">Obrigado pela confiança 🤍</p>
      </div>
    `
  });
}
