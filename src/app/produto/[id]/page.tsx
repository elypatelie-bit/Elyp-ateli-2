'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCheckoutStore } from '@/store/useCheckoutStore';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem } = useCheckoutStore();

  const [product, setProduct] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct);
  }, [id]);

  if (!product) return <p className="text-center py-20 text-navy/50">Carregando...</p>;

  const images: string[] = product.images?.length ? product.images : [];
  const promo = product.promoPrice && Number(product.promoPrice) > Number(product.price);
  const variant = product.variantOptions?.[variantIndex];
  const basePrice = promo ? Number(product.promoPrice) : Number(product.price);
  const unitPrice = basePrice + Number(variant?.priceDelta || 0);
  const inStock = product.stockQuantity > 0 || product.isMadeToOrder;

  async function submitReview() {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, rating, comment })
    });
    if (res.ok) {
      const refreshed = await fetch(`/api/products/${id}`).then((r) => r.json());
      setProduct(refreshed);
      setShowReviewForm(false);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  return (
    <div className="min-h-screen bg-cream max-w-md mx-auto pb-28">
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-cream z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-lg bg-navy/10 text-navy">←</button>
        <h1 className="font-bold text-navy text-lg">{product.title}</h1>
      </div>

      <div className="px-4">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-navy to-blue-800 overflow-hidden relative">
          {images[imgIndex] && <img src={images[imgIndex]} className="w-full h-full object-cover" />}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {images.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-navy' : 'bg-navy/20'}`} onClick={() => setImgIndex(i)} />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-navy">R$ {unitPrice.toFixed(2)}</span>
          {promo && <span className="text-sm text-gray-400 line-through">R$ {(Number(product.promoPrice) + Number(variant?.priceDelta || 0)).toFixed(2)}</span>}
        </div>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.description}</p>

        {product.variantOptions?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-navy mb-2">{product.variantLabel || 'Opção'}</p>
            <div className="flex gap-2 overflow-x-auto">
              {product.variantOptions.map((v: any, i: number) => (
                <button
                  key={v.name}
                  onClick={() => setVariantIndex(i)}
                  className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${i === variantIndex ? 'bg-navy text-white border-navy' : 'border-navy/20 text-navy'}`}
                >
                  {v.name} {v.priceDelta ? `(+R$${v.priceDelta})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="text-xs font-bold uppercase text-navy mb-2">Avaliações ({product.reviews?.length || 0})</p>
          {product.reviews?.length ? (
            product.reviews.map((r: any) => (
              <div key={r.id} className="border-b border-navy/10 py-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">{r.user?.name || 'Cliente'}</span>
                  <span className="text-gold text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-xs text-gray-500 mt-1">{r.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Ainda sem avaliações.</p>
          )}

          {session ? (
            showReviewForm ? (
              <div className="mt-3 bg-white p-3 rounded-xl border border-navy/10">
                <div className="flex gap-1 text-xl mb-2">
                  {[1, 2, 3, 4, 5].map((n: number) => (
                    <button key={n} onClick={() => setRating(n)} className={n <= rating ? 'text-gold' : 'text-gray-300'}>★</button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte sua experiência..."
                  className="w-full p-2 border border-navy/15 rounded-lg text-sm"
                />
                <button onClick={submitReview} className="mt-2 w-full py-2 bg-navy text-white rounded-lg text-sm font-semibold">
                  Enviar avaliação
                </button>
              </div>
            ) : (
              <button onClick={() => setShowReviewForm(true)} className="mt-3 text-sm text-navy underline">
                Avaliar este produto
              </button>
            )
          ) : (
            <p className="text-xs text-gray-500 mt-2">Entre na sua conta para avaliar produtos que você comprou.</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-navy/10 p-4">
        <button
          disabled={!inStock}
          onClick={() =>
            addItem({
              productId: product.id,
              title: product.title + (variant ? ` — ${variant.name}` : ''),
              price: unitPrice,
              quantity: 1,
              image: images[0],
              variantName: variant?.name || null
            })
          }
          className="w-full py-3.5 bg-navy text-white font-bold rounded-xl disabled:opacity-40"
        >
          {inStock ? 'Adicionar à sacola' : 'Produto esgotado'}
        </button>
      </div>
    </div>
  );
}
