'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [finance, setFinance] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then(setData);
    fetch('/api/store').then((r) => r.json()).then(setStore);
    fetch('/api/finance').then((r) => r.json()).then(setFinance);
    fetch('/api/products?all=1').then((r) => r.json()).then(setProducts);
  }, []);

  if (!data || !store || !finance) return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  const goal = Number(store.monthlyGoal || 0);
  const pct = goal > 0 ? Math.min(100, (finance.summary.receitas / goal) * 100) : 0;
  const lowStock = products.filter((p: any) => !p.isMadeToOrder && p.stockQuantity <= store.lowStockThreshold);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Painel — {store.name}</h1>

      <div className="bg-white p-4 rounded-xl border border-navy/10">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-bold">🔗 Sua loja</span>
          <Link href="/" className="text-xs text-navy underline">Ver loja ↗</Link>
        </div>
        <p className="text-xs text-gray-500">Compartilhe o link do site com seus clientes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-navy/10 text-center">
          <p className="text-2xl font-bold">{data.metrics.pedidosHoje}</p>
          <p className="text-[10px] text-gray-500 font-semibold">PEDIDOS HOJE</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-navy/10 text-center">
          <p className="text-2xl font-bold">{data.metrics.pedidosPendentes}</p>
          <p className="text-[10px] text-gray-500 font-semibold">PENDENTES</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-navy/10">
        <div className="flex justify-between">
          <span className="text-xs font-bold">🎯 Meta do mês</span>
          <span className="text-xs font-bold">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-navy/10 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold to-navy rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">R$ {finance.summary.receitas.toFixed(2)} de R$ {goal.toFixed(2)}</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-navy/10">
        <p className="text-xs font-bold mb-2">⚠️ Alerta de estoque</p>
        {lowStock.length ? (
          lowStock.map((p: any) => (
            <div key={p.id} className="flex justify-between text-sm py-1">
              <span>{p.title}</span>
              <span className="text-red-600 font-bold">{p.stockQuantity} un.</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">Tudo certo por aqui 🎉</p>
        )}
      </div>

      <div>
        <p className="text-sm font-bold mb-2">Pedidos recentes</p>
        {data.orders.slice(0, 5).map((o: any) => (
          <div key={o.id} className="bg-white p-3 rounded-xl border border-navy/10 mb-2 flex justify-between">
            <div>
              <p className="text-xs font-bold text-navy">#{String(o.dailyNumber).padStart(4, '0')}</p>
              <p className="text-sm font-semibold">{o.customer?.name || o.customer?.phone}</p>
            </div>
            <p className="font-bold text-navy">R$ {Number(o.totalAmount).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
