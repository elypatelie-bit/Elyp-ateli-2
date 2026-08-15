'use client';

import { useEffect, useState } from 'react';

export default function AdminFinanceiro() {
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: 'INCOME', category: '' });

  async function load() {
    const res = await fetch('/api/finance');
    setData(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.description || !form.amount) return;
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) })
    });
    setModal(false);
    setForm({ description: '', amount: '', type: 'INCOME', category: '' });
    load();
  }

  function exportCsv() {
    if (!data) return;
    const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']];
    data.transactions.forEach((t: any) =>
      rows.push([new Date(t.createdAt).toLocaleDateString('pt-BR'), t.description, t.category, t.type === 'INCOME' ? 'Receita' : 'Despesa', Number(t.amount).toFixed(2)])
    );
    const csv = rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'financeiro.csv';
    a.click();
  }

  if (!data) return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Financeiro</h1>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white p-4 rounded-xl border border-green-200">
          <p className="text-xs text-gray-500">Receitas (mês)</p>
          <p className="text-xl font-bold text-green-700">R$ {data.summary.receitas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200">
          <p className="text-xs text-gray-500">Despesas (mês)</p>
          <p className="text-xl font-bold text-red-600">R$ {data.summary.despesas.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-navy/10 mb-4">
        <p className="text-xs text-gray-500">Saldo (mês)</p>
        <p className={`text-2xl font-bold ${data.summary.saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>R$ {data.summary.saldo.toFixed(2)}</p>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setModal(true)} className="flex-1 py-3 bg-navy text-white rounded-xl font-semibold">+ Adicionar</button>
        <button onClick={exportCsv} className="flex-1 py-3 border border-navy text-navy rounded-xl font-semibold">⬇ Exportar</button>
      </div>

      <p className="text-sm font-bold mb-2">Histórico</p>
      <div className="bg-white border border-navy/10 rounded-xl divide-y divide-navy/5">
        {data.transactions.map((t: any) => (
          <div key={t.id} className="flex justify-between p-3">
            <div>
              <p className="text-sm font-semibold">{t.description}</p>
              <p className="text-xs text-gray-500">{t.category} · {new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-green-700' : 'text-red-600'}`}>
              {t.type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-navy/30 z-50 flex items-end justify-center" onClick={() => setModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold">Nova transação</h3>
              <button onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => setForm({ ...form, type: 'INCOME' })} className={`py-2 rounded-lg font-semibold ${form.type === 'INCOME' ? 'bg-navy text-white' : 'border'}`}>Receita</button>
              <button onClick={() => setForm({ ...form, type: 'EXPENSE' })} className={`py-2 rounded-lg font-semibold ${form.type === 'EXPENSE' ? 'bg-navy text-white' : 'border'}`}>Despesa</button>
            </div>
            <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 border rounded-lg mb-2" />
            <input placeholder="Valor" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full p-3 border rounded-lg mb-2" />
            <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-3 border rounded-lg mb-3" />
            <button onClick={save} className="w-full py-3 bg-navy text-white rounded-xl font-semibold">Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
