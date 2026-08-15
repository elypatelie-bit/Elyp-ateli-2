'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { href: '/admin', label: 'Início', icon: '🏠' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🛍️' },
  { href: '/admin/produtos', label: 'Produtos', icon: '📦' },
  { href: '/admin/financeiro', label: 'Financ.', icon: '💰' },
  { href: '/admin/configuracoes', label: 'Ajustes', icon: '⚙️' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === 'loading') return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-8">
        <p className="text-navy font-bold">Acesso restrito</p>
        <p className="text-sm text-gray-500 mt-2">Você precisa ser administrador pra ver essa página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-navy pb-24 max-w-md mx-auto">
      <main>{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-navy/10 px-4 py-3 flex justify-between items-center z-50">
        {navItems.map((item: any) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold ${isActive ? 'text-navy' : 'text-navy/40'}`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button onClick={() => signOut({ callbackUrl: '/' })} className="flex flex-col items-center gap-1 text-[10px] uppercase font-bold text-navy/40">
          <span className="text-lg">↩</span>
          Sair
        </button>
      </nav>
    </div>
  );
}
