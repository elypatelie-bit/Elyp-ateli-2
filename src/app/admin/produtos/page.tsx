'use client';

import { useEffect, useState } from 'react';

export default function AdminProdutos() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [catModal, setCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('');
  const [prodModal, setProdModal] = useState<any>(null); // null | {} (novo) | product (editar)

  async function load() {
    const [c, p] = await Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products?all=1').then((r) => r.json())
    ]);
    setCategories(c);
    setProducts(p);
  }
  useEffect(() => { load(); }, []);

  async function saveCategory() {
    if (!catName) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, emoji: catEmoji })
    });
    setCatModal(false);
    setCatName('');
    setCatEmoji('');
    load();
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    load();
  }

  async function saveProduct(form: any) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/products/${form.id}` : '/api/products';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setProdModal(null);
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Excluir este produto?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    load();
  }

  async function toggleActive(p: any) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive })
    });
    load();
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Catálogo</h1>
        <button onClick={() => setProdModal({})} className="bg-navy text-white px-3 py-2 rounded-lg text-sm font-semibold">+ Novo Produto</button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-bold">📚 Categorias</p>
        <button onClick={() => setCatModal(true)} className="text-xs text-navy underline">+ Adicionar</button>
      </div>
      <div className="bg-white border border-navy/10 rounded-xl mb-6 overflow-hidden">
        {categories.map((c: any) => (
          <div key={c.id} className="flex justify-between items-center p-3 border-b border-navy/5 last:border-0">
            <span className="text-sm font-medium">{c.emoji} {c.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-navy/10 px-2 py-1 rounded">{c._count?.products || 0} produtos</span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-500 text-xs">🗑</button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm font-bold mb-2">Produtos ({products.length})</p>
      {products.map((p: any) => (
        <div key={p.id} className="bg-white border border-navy/10 rounded-xl p-3 mb-3">
          <div className="flex gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-navy to-blue-800 rounded-lg overflow-hidden flex-shrink-0">
              {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{p.title}</p>
              <p className="text-xs text-gray-500">Estoque: {p.isMadeToOrder ? 'sob encomenda' : p.stockQuantity}</p>
              <p className="font-bold text-navy text-sm">R$ {Number(p.price).toFixed(2)}</p>
            </div>
            <span className={`text-[10px] h-fit font-bold px-2 py-1 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {p.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setProdModal(p)} className="flex-1 py-2 bg-navy/10 text-navy rounded-lg text-xs font-semibold">Editar</button>
            <button onClick={() => toggleActive(p)} className="flex-1 py-2 border border-navy text-navy rounded-lg text-xs font-semibold">
              {p.isActive ? 'Desativar' : 'Ativar'}
            </button>
            <button onClick={() => deleteProduct(p.id)} className="px-3 bg-red-50 text-red-600 rounded-lg text-xs">🗑</button>
          </div>
        </div>
      ))}

      {catModal && (
        <Modal onClose={() => setCatModal(false)} title="Nova categoria">
          <input placeholder="Nome" value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full p-3 border rounded-lg mb-2" />
          <input placeholder="Emoji (opcional)" value={catEmoji} onChange={(e) => setCatEmoji(e.target.value)} className="w-full p-3 border rounded-lg mb-3" />
          <button onClick={saveCategory} className="w-full py-3 bg-navy text-white rounded-xl font-semibold">Criar</button>
        </Modal>
      )}

      {prodModal && <ProductForm product={prodModal} categories={categories} onSave={saveProduct} onClose={() => setProdModal(null)} />}
    </div>
  );
}

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 bg-navy/30 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProductForm({ product, categories, onSave, onClose }: any) {
  const [form, setForm] = useState({
    id: product.id,
    title: product.title || '',
    price: product.price || '',
    promoPrice: product.promoPrice || '',
    description: product.description || '',
    categoryId: product.categoryId || '',
    stockQuantity: product.stockQuantity ?? 0,
    images: (product.images || []).join('\n'),
    variantLabel: product.variantLabel || '',
    variantOptions: (product.variantOptions || []).map((v: any) => `${v.name}:${v.priceDelta || 0}`).join('\n'),
    isMadeToOrder: product.isMadeToOrder || false,
    isPinned: product.isPinned || false,
    isActive: product.isActive ?? true
  });

  function submit() {
    onSave({
      ...form,
      price: Number(form.price),
      promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
      stockQuantity: Number(form.stockQuantity),
      images: form.images.split('\n').map((s: string) => s.trim()).filter(Boolean).slice(0, 4),
      variantOptions: form.variantOptions
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean)
        .map((l: string) => {
          const [name, delta] = l.split(':');
          return { name: name.trim(), priceDelta: Number(delta || 0) };
        }),
      variantLabel: form.variantLabel || null
    });
  }

  return (
    <Modal onClose={onClose} title={product.id ? 'Editar produto' : 'Novo produto'}>
      <div className="space-y-2 max-h-[65vh] overflow-y-auto">
        <input placeholder="Nome" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-3 border rounded-lg" />
        <div className="flex gap-2">
          <input placeholder="Preço" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="flex-1 p-3 border rounded-lg" />
          <input placeholder='Preço "de"' type="number" value={form.promoPrice} onChange={(e) => setForm({ ...form, promoPrice: e.target.value })} className="flex-1 p-3 border rounded-lg" />
        </div>
        <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-3 border rounded-lg" />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full p-3 border rounded-lg">
          <option value="">Sem categoria</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <input placeholder="Estoque" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="w-full p-3 border rounded-lg" />
        <textarea placeholder="URLs das fotos (uma por linha)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="w-full p-3 border rounded-lg" />
        <input placeholder="Nome da variação (ex: Tamanho)" value={form.variantLabel} onChange={(e) => setForm({ ...form, variantLabel: e.target.value })} className="w-full p-3 border rounded-lg" />
        <textarea placeholder={'Opções (Nome:AjustePreço)\nEx: Pequeno:0'} value={form.variantOptions} onChange={(e) => setForm({ ...form, variantOptions: e.target.value })} className="w-full p-3 border rounded-lg" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isMadeToOrder} onChange={(e) => setForm({ ...form, isMadeToOrder: e.target.checked })} /> Sob encomenda</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /> Fixar no topo</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Ativo</label>
      </div>
      <button onClick={submit} className="w-full py-3 bg-navy text-white rounded-xl font-semibold mt-3">Salvar</button>
    </Modal>
  );
}
