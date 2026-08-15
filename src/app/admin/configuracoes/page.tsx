'use client';

import { useEffect, useState } from 'react';

export default function AdminConfiguracoes() {
  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/store').then((r) => r.json()).then(setForm);
  }, []);

  async function save() {
    const res = await fetch('/api/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        pixKey: form.pixKey,
        merchantName: form.merchantName,
        city: form.city,
        state: form.state,
        address: form.address,
        monthlyGoal: Number(form.monthlyGoal),
        lowStockThreshold: Number(form.lowStockThreshold),
        shippingLocalFee: Number(form.shippingLocalFee),
        shippingLocalDays: Number(form.shippingLocalDays),
        shippingStateFee: Number(form.shippingStateFee),
        shippingStateDays: Number(form.shippingStateDays),
        shippingNationalFee: Number(form.shippingNationalFee),
        shippingNationalDays: Number(form.shippingNationalDays)
      })
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (!form) return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  const field = (label: string, key: string, type = 'text') => (
    <div>
      <label className="text-xs font-bold uppercase text-navy block mb-1">{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full p-3 border border-navy/15 rounded-xl text-sm"
      />
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ajustes da Loja</h1>
      <div className="bg-white p-4 rounded-2xl border border-navy/10 space-y-3">
        {field('Nome do ateliê', 'name')}
        {field('WhatsApp', 'whatsapp')}
        {field('Instagram', 'instagram')}
        {field('Chave PIX', 'pixKey')}
        {field('Nome do titular (PIX)', 'merchantName')}
        <div className="flex gap-2">
          <div className="flex-1">{field('Cidade', 'city')}</div>
          <div className="w-20">{field('UF', 'state')}</div>
        </div>
        {field('Endereço do ateliê', 'address')}

        <p className="text-xs font-bold text-navy mt-2">🚚 Frete automático por CEP</p>
        <div className="flex gap-2">
          {field('Mesma cidade R$', 'shippingLocalFee', 'number')}
          {field('Dias', 'shippingLocalDays', 'number')}
        </div>
        <div className="flex gap-2">
          {field('Mesmo estado R$', 'shippingStateFee', 'number')}
          {field('Dias', 'shippingStateDays', 'number')}
        </div>
        <div className="flex gap-2">
          {field('Outros estados R$', 'shippingNationalFee', 'number')}
          {field('Dias', 'shippingNationalDays', 'number')}
        </div>

        {field('Meta de faturamento mensal (R$)', 'monthlyGoal', 'number')}
        {field('Alerta de estoque baixo (unidades)', 'lowStockThreshold', 'number')}

        <button onClick={save} className="w-full py-3.5 bg-navy text-white font-bold rounded-xl">💾 Salvar Alterações</button>
        {saved && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-xl text-center">Configurações salvas!</div>}
      </div>
    </div>
  );
}
