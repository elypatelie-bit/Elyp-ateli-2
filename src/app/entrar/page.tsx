'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EntrarPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (!name || clean.length < 10) {
      setError('Preencha nome e um telefone válido');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDemoCode(data.demo ? data.demoCode : null);
      setStep('otp');
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndSignIn() {
    setError('');
    setLoading(true);
    const clean = phone.replace(/\D/g, '');
    try {
      const verifyRes = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, code })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.valid) throw new Error(verifyData.error || 'Código inválido');

      const result = await signIn('phone-otp', {
        phone: clean,
        verificationToken: code,
        redirect: false
      });
      if (result?.error) throw new Error('Não foi possível entrar. Tente pedir um novo código.');

      router.push(callbackUrl);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 py-12">
      <h1 className="font-serif text-4xl text-navy">elyp</h1>
      <p className="text-[10px] tracking-[4px] text-navy font-bold uppercase mt-1">Ateliê</p>

      <div className="w-full max-w-sm mt-10 space-y-4">
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full py-3 rounded-xl border border-navy/15 bg-white flex items-center justify-center gap-2 font-semibold text-sm shadow-sm"
        >
          Continuar com Google
        </button>

        <div className="text-center text-xs text-gray-500">ou entre com seu telefone</div>

        {step === 'phone' && (
          <div className="space-y-3">
            <input
              className="w-full p-3 border border-navy/15 rounded-xl text-sm"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full p-3 border border-navy/15 rounded-xl text-sm"
              placeholder="WhatsApp / telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              disabled={loading}
              onClick={sendCode}
              className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-3">
            {demoCode && (
              <div className="bg-amber-50 border border-dashed border-amber-400 rounded-xl p-3 text-center">
                <p className="text-[10px] text-amber-700 font-bold">
                  MODO DEMO (Twilio não configurado) — código:
                </p>
                <p className="text-2xl font-bold tracking-widest text-amber-700">{demoCode}</p>
              </div>
            )}
            <input
              className="w-full p-3 border border-navy/15 rounded-xl text-sm text-center text-xl tracking-widest"
              placeholder="0000"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              disabled={loading}
              onClick={verifyAndSignIn}
              className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Confirmar'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full text-xs text-gray-500 underline">
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
