'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/store/useCheckoutStore';

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cart, paymentMethod, setPaymentMethod, splitAmount, setSplitAmount, couponCode, couponDiscount, setCoupon, clearCoupon, getSubtotal, clearCart } =
    useCheckoutStore();

  const [address, setAddress] = useState({ cep: '', street: '', number: '', neighborhood: '', city: '', complement: '' });
  const [shipping, setShipping] = useState<{ fee: number; days: number } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const subtotal = getSubtotal();
  const total = Math.max(0, subtotal + (shipping?.fee || 0) - couponDiscount);

  async function calcShipping() {
    if (address.cep.replace(/\D/g, '').length !== 8) {
      setError('Digite um CEP válido');
      return;
    }
    setCalculating(true);
    setError('');
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: address.cep })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShipping({ fee: data.fee, days: data.days });
      setAddress((a) => ({
        ...a,
        street: a.street || data.cepData.logradouro,
        neighborhood: a.neighborhood || data.cepData.bairro,
        city: data.cepData.localidade
      }));
    } catch (e: any) {
      setError(e.message || 'Não foi possível calcular o frete');
      setShipping(null);
    } finally {
      setCalculating(false);
    }
  }

  async function applyCoupon() {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput, subtotal })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setCoupon(data.code, data.discount);
    setError('');
  }

  async function submitOrder() {
    if (!session) {
      router.push('/entrar?callbackUrl=/checkout');
      return;
    }
    if (!shipping) {
      setError('Calcule o frete antes de continuar');
      return;
    }
    if (!address.street || !address.number || !address.neighborhood || !address.city) {
      setError('Preencha todo o endereço');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          ...address,
          paymentMethod,
          splitAmount,
          couponCode: couponCode || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      clearCart();
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-cream max-w-md mx-auto p-6 pt-16 text-center">
        <h2 className="text-2xl font-bold text-navy">Pedido recebido! 🎉</h2>
        <p className="text-sm text-gray-500 mt-2">Pedido #{String(result.order.dailyNumber).padStart(4, '0')} — R$ {Number(result.order.totalAmount).toFixed(2)}</p>
        {result.order.pixBrCode && (
          <div className="bg-white border border-navy/10 rounded-xl p-4 mt-6 text-left">
            <p className="text-xs text-gray-500 mb-2">Código PIX Copia e Cola:</p>
            <p className="text-[10px] break-all bg-cream p-2 rounded">{result.order.pixBrCode}</p>
            <button
              onClick={() => navigator.clipboard.writeText(result.order.pixBrCode)}
              className="w-full mt-3 py-2 bg-navy text-white rounded-lg text-sm font-semibold"
            >
              Copiar código
            </button>
          </div>
        )}
        <button onClick={() => router.push('/')} className="w-full mt-6 py-3 bg-navy/10 text-navy rounded-xl font-semibold">
          Voltar à loja
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream max-w-md mx-auto pb-32">
      <div className="p-4 sticky top-0 bg-cream z-10">
        <h1 className="text-xl font-bold text-navy">Finalizar Pedido</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-navy/10">
          <p className="text-xs font-bold uppercase text-navy mb-3">🚚 Endereço de entrega</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input placeholder="CEP" value={address.cep} onChange={(e) => setAddress({ ...address, cep: e.target.value })} className="flex-1 p-2.5 border border-navy/15 rounded-lg text-sm" />
              <button onClick={calcShipping} disabled={calculating} className="px-4 bg-navy/10 text-navy rounded-lg text-sm font-semibold">
                {calculating ? '...' : 'Calcular'}
              </button>
            </div>
            {shipping ? (
              <p className="text-xs text-green-700 font-semibold">✓ Frete R$ {shipping.fee.toFixed(2)} — até {shipping.days} dia(s) útil(eis)</p>
            ) : (
              <p className="text-xs text-gray-500">Informe o CEP para calcular o frete e prazo.</p>
            )}
            <input placeholder="Rua" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="w-full p-2.5 border border-navy/15 rounded-lg text-sm" />
            <div className="flex gap-2">
              <input placeholder="Número" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} className="w-24 p-2.5 border border-navy/15 rounded-lg text-sm" />
              <input placeholder="Bairro" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} className="flex-1 p-2.5 border border-navy/15 rounded-lg text-sm" />
            </div>
            <div className="flex gap-2">
              <input placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="flex-1 p-2.5 border border-navy/15 rounded-lg text-sm" />
              <input placeholder="Complemento" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} className="flex-1 p-2.5 border border-navy/15 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-navy/10">
          <p className="text-xs font-bold uppercase text-navy mb-3">💳 Pagamento</p>
          {(['PIX', 'SPLIT', 'CARD'] as const).map((m: 'PIX' | 'SPLIT' | 'CARD') => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`w-full text-left p-3 rounded-lg border mb-2 text-sm ${paymentMethod === m ? 'border-navy bg-navy/5' : 'border-navy/15'}`}
            >
              {m === 'PIX' ? '⚡ PIX' : m === 'SPLIT' ? '🤝 Dividir (50% PIX + 50% entrega)' : '💳 Cartão'}
            </button>
          ))}
          {paymentMethod === 'SPLIT' && (
            <input
              type="number"
              placeholder="Valor do sinal"
              value={splitAmount || ''}
              onChange={(e) => setSplitAmount(Number(e.target.value))}
              className="w-full p-2.5 border border-navy/15 rounded-lg text-sm mt-2"
            />
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-navy/10">
          <p className="text-xs font-bold uppercase text-navy mb-3">🏷️ Cupom</p>
          <div className="flex gap-2">
            <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Código" className="flex-1 p-2.5 border border-navy/15 rounded-lg text-sm" />
            <button onClick={applyCoupon} className="px-4 bg-navy/10 text-navy rounded-lg text-sm font-semibold">Aplicar</button>
          </div>
          {couponCode && (
            <p className="text-xs text-green-700 mt-2">
              Cupom {couponCode} aplicado ✓{' '}
              <button onClick={clearCoupon} className="text-red-600 underline">remover</button>
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-navy/10 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Frete</span><span>{shipping ? `R$ ${shipping.fee.toFixed(2)}` : 'A calcular'}</span></div>
          {couponDiscount > 0 && <div className="flex justify-between text-green-700"><span>Desconto</span><span>- R$ {couponDiscount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-navy text-base pt-2 border-t border-navy/10"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
        </div>

        {error && <p className="text-red-600 text-xs">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-navy/10 p-4">
        <button onClick={submitOrder} disabled={submitting || !cart.length} className="w-full py-3.5 bg-navy text-white font-bold rounded-xl disabled:opacity-50">
          {submitting ? 'Enviando...' : `Confirmar Pedido — R$ ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
