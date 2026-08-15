'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import CartDrawer from '@/components/CartDrawer';
import Link from 'next/link';

export default function StorefrontPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('TODAS');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { addItem, cart } = useCheckoutStore();
  const cartCount = cart.reduce((a, i) => a + i.quantity, 0);

  useEffect(() => {
    Promise.all([fetch('/api/products').then((r) => r.json()), fetch('/api/categories').then((r) => r.json())])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      (activeCategory === 'TODAS' || p.categoryId === activeCategory) &&
      p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream pb-20 max-w-md mx-auto">
      <header className="bg-cream sticky top-0 z-30 pt-8 pb-4 px-4 border-b border-navy/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-serif text-navy tracking-tight">elyp</h1>
            <p className="text-[10px] tracking-widest text-navy uppercase font-semibold mt-1">Ateliê</p>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/minha-conta" className="p-2 text-navy">👤</Link>
            ) : (
              <button onClick={() => signIn()} className="p-2 text-navy">🔑</button>
            )}
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-navy">
              🛍️
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-navy text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar guias, fios de conta..."
          className="w-full px-4 py-2.5 bg-white border border-navy/10 rounded-xl text-sm text-navy"
        />
      </header>

      <main className="p-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
          <button
            onClick={() => setActiveCategory('TODAS')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold ${activeCategory === 'TODAS' ? 'bg-navy text-white' : 'bg-white text-navy border border-navy/20'}`}
          >
            Todas
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${activeCategory === cat.id ? 'bg-navy text-white' : 'bg-white text-navy border border-navy/20'}`}
            >
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-navy/50 text-sm py-10">Carregando produtos...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((product: any) => {
              const promo = product.promoPrice && Number(product.promoPrice) > Number(product.price);
              const inStock = product.stockQuantity > 0 || product.isMadeToOrder;
              return (
                <Link
                  key={product.id}
                  href={`/produto/${product.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-navy/5 flex flex-col"
                >
                  <div className="aspect-square bg-gradient-to-br from-navy to-blue-800 relative">
                    {product.images?.[0] && <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />}
                    {product.avgRating > 0 && (
                      <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                        ★ {product.avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm font-semibold text-navy leading-tight mb-1">{product.title}</h3>
                    <span className="text-sm font-bold text-navy/80 mb-3 mt-auto">
                      R$ {Number(product.price).toFixed(2)}
                      {promo && <span className="text-xs text-gray-400 line-through ml-1">R$ {Number(product.promoPrice).toFixed(2)}</span>}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!inStock) return;
                        addItem({
                          productId: product.id,
                          title: product.title,
                          price: Number(promo ? product.promoPrice : product.price),
                          quantity: 1,
                          image: product.images?.[0]
                        });
                      }}
                      disabled={!inStock}
                      className="w-full py-2 bg-transparent border border-navy text-navy hover:bg-navy hover:text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                    >
                      {inStock ? 'Adicionar' : 'Esgotado'}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
