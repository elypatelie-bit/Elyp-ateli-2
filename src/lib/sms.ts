/**
 * Envia um SMS com o código de verificação.
 * Se as credenciais do Twilio não estiverem configuradas no .env, cai em modo
 * DEMO: não envia SMS de verdade, só loga o código no console do servidor
 * (bom pra testar localmente sem gastar crédito de SMS).
 */
export async function sendOtpSms(phone: string, code: string): Promise<{ demo: boolean }> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`\n📱 [MODO DEMO] Código OTP para ${phone}: ${code}\n(Configure o Twilio no .env para enviar SMS de verdade)\n`);
    return { demo: true };
  }

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({
    To: phone,
    From: TWILIO_PHONE_NUMBER,
    Body: `Seu código Elyp Ateliê: ${code}`
  });

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falha ao enviar SMS via Twilio: ${err}`);
  }

  return { demo: false };
}

export function generateOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
