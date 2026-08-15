'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo', CONFIRMED: 'Confirmado', IN_PREPARATION: 'Em Preparo', READY: 'Pronto',
  DISPATCHED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado'
};

export default function MinhaContaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/entrar?callbackUrl=/minha-conta');
  }, [status]);

  useEffect(() => {
    if (session) {
      // Busca só os pedidos do próprio cliente logado.
      fetch('/api/orders/me').then((r) => (r.ok ? r.json() : { orders: [] })).then((d) => setOrders(d.orders || []));
    }
  }, [session]);

  if (!session) return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  return (
    <div className="min-h-screen bg-cream max-w-md mx-auto p-4 pb-20">
      <h1 className="text-xl font-bold text-navy mb-4">Minha conta</h1>
      <div className="bg-white p-4 rounded-xl border border-navy/10 mb-4">
        <p className="font-bold text-navy">{session.user?.name || session.user?.email || (session.user as any)?.phone}</p>
        <p className="text-xs text-gray-500 mt-1">{session.user?.email}</p>
      </div>

      <p className="text-sm font-bold mb-2">Meus pedidos</p>
      {orders.length === 0 ? (
        <p className="text-xs text-gray-500">Você ainda não fez pedidos.</p>
      ) : (
        orders.map((o: any) => (
          <div key={o.id} className="bg-white p-3 rounded-xl border border-navy/10 mb-2 flex justify-between">
            <div>
              <p className="text-sm font-bold">#{String(o.dailyNumber).padStart(4, '0')}</p>
              <p className="text-xs text-gray-500">{STATUS_LABEL[o.status]}</p>
            </div>
            <p className="font-bold text-navy">R$ {Number(o.totalAmount).toFixed(2)}</p>
          </div>
        ))
      )}

      <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full mt-6 py-3 border border-navy text-navy rounded-xl font-semibold">
        Sair da conta
      </button>
    </div>
  );
}
