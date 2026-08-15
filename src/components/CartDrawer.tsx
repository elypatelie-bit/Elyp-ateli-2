'use client';

import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useRouter } from 'next/navigation';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cart, updateQuantity, removeItem, getSubtotal } = useCheckoutStore();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/20 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cream h-full shadow-2xl flex flex-col animate-slide-left">
        <div className="p-4 bg-white border-b border-navy/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy">🛍️ Seu Pedido</h2>
          <button onClick={onClose} className="p-2 text-navy/50 bg-slate-100 rounded-full">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-navy/50">
              <p className="font-medium text-sm">Sua sacola está vazia.</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <div key={item.productId + (item.variantName || '')} className="bg-white p-3 rounded-xl border border-navy/10 flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-navy leading-tight">{item.title}</h4>
                    <button onClick={() => removeItem(item.productId, item.variantName)} className="text-navy/40">✕</button>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-sm font-bold text-navy">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center bg-cream border border-navy/10 rounded-lg">
                      <button onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)} className="p-1.5 text-navy">−</button>
                      <span className="w-6 text-center text-xs font-bold text-navy">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)} className="p-1.5 text-navy">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-navy/10">
            <div className="flex justify-between items-center mb-4 text-navy">
              <span className="text-sm font-medium">Subtotal</span>
              <span className="text-lg font-bold">R$ {getSubtotal().toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              className="w-full py-3.5 bg-navy text-white font-bold rounded-xl shadow-md"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
