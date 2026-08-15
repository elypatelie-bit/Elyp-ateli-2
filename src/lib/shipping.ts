import { prisma } from './prisma';

export interface ShippingResult {
  tier: 'local' | 'state' | 'national';
  fee: number;
  days: number;
  cepData: { uf: string; localidade: string; logradouro: string; bairro: string };
}

/**
 * Busca o endereço pelo CEP (ViaCEP, gratuito e sem necessidade de chave) e
 * calcula o frete comparando a cidade/UF do cliente com a da loja.
 *
 * Isso é uma ESTIMATIVA PRÓPRIA da loja, não a tabela oficial dos Correios.
 * Para cotação real, troque a lógica abaixo por uma chamada à API do Melhor
 * Envio (https://docs.melhorenvio.com.br) usando o token em MELHOR_ENVIO_TOKEN.
 */
export async function calculateShipping(cep: string): Promise<ShippingResult | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;

  const store = await prisma.store.findFirst();
  if (!store) return null;

  const sameCity = data.localidade?.trim().toLowerCase() === store.city.trim().toLowerCase();
  const sameState = data.uf?.toUpperCase() === store.state.toUpperCase();

  const tier: ShippingResult['tier'] = sameCity ? 'local' : sameState ? 'state' : 'national';
  const fee = Number(
    tier === 'local' ? store.shippingLocalFee : tier === 'state' ? store.shippingStateFee : store.shippingNationalFee
  );
  const days = tier === 'local' ? store.shippingLocalDays : tier === 'state' ? store.shippingStateDays : store.shippingNationalDays;

  return {
    tier,
    fee,
    days,
    cepData: { uf: data.uf, localidade: data.localidade, logradouro: data.logradouro, bairro: data.bairro }
  };
}
