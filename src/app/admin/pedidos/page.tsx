'use client';

import { useEffect, useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo', CONFIRMED: 'Confirmado', IN_PREPARATION: 'Em Preparo', READY: 'Pronto',
  DISPATCHED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado'
};
const TABS = ['TODOS', 'NEW', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('TODOS');
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/orders?status=${filter}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function doAction(id: string, action: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    setSelected(null);
    load();
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pedidos</h1>
      <div className="flex overflow-x-auto gap-2 pb-2 mb-3 hide-scrollbar">
        {TABS.map((t: string) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${filter === t ? 'bg-navy text-white' : 'bg-white border border-navy/15'}`}
          >
            {t === 'TODOS' ? 'Todos' : STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-navy/50 py-10">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-navy/50 py-10">Nenhum pedido nesta etapa.</p>
      ) : (
        orders.map((o: any) => (
          <div key={o.id} onClick={() => setSelected(o)} className="bg-white border border-navy/10 rounded-xl p-4 mb-3 cursor-pointer">
            <div className="flex justify-between">
              <div>
                <span className="text-xs font-bold text-navy bg-navy/10 px-2 py-1 rounded">#{String(o.dailyNumber).padStart(4, '0')}</span>
                <p className="font-bold mt-1">{o.customer?.name || o.customer?.phone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-navy">R$ {Number(o.totalAmount).toFixed(2)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {o.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>
            <span className="inline-block mt-2 text-xs font-bold bg-navy/10 text-navy px-2 py-1 rounded-full">{STATUS_LABEL[o.status]}</span>
          </div>
        ))
      )}

      {selected && (
        <div className="fixed inset-0 bg-navy/30 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Pedido #{String(selected.dailyNumber).padStart(4, '0')}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <p className="text-sm"><b>Cliente:</b> {selected.customer?.name} · {selected.customer?.phone}</p>
            <p className="text-sm mt-1"><b>Endereço:</b> {selected.street}, {selected.number} — {selected.neighborhood}, {selected.city} — {selected.cep}</p>
            <div className="mt-3 space-y-1">
              {selected.items.map((i: any) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.quantity}x {i.title}</span>
                  <span>R$ {(Number(i.price) * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <p className="font-bold text-right mt-2">Total: R$ {Number(selected.totalAmount).toFixed(2)}</p>

            <div className="mt-4 space-y-2">
              {selected.status !== 'DELIVERED' && selected.status !== 'CANCELLED' && (
                <button onClick={() => doAction(selected.id, 'advance')} className="w-full py-3 bg-navy text-white rounded-xl font-semibold">Avançar status</button>
              )}
              {selected.paymentStatus !== 'PAID' && (
                <button onClick={() => doAction(selected.id, 'markPaid')} className="w-full py-3 bg-navy/10 text-navy rounded-xl font-semibold">Marcar como pago</button>
              )}
              <a
                href={`https://wa.me/${(selected.customer?.phone || '').replace(/\D/g, '')}`}
                target="_blank"
                className="block text-center w-full py-3 bg-green-50 text-green-700 rounded-xl font-semibold"
              >
                💬 WhatsApp
              </a>
              {selected.status !== 'DELIVERED' && selected.status !== 'CANCELLED' && (
                <button onClick={() => doAction(selected.id, 'cancel')} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold">Cancelar pedido</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
