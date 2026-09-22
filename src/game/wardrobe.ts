import type { Progress } from './types';

export type AccessorySlot = 'cape' | 'jacket' | 'hat';
export interface Outfit { cape: string; jacket: string | null; hat: string | null }
export interface Wardrobe { owned: string[]; equipped: Outfit }
export interface Accessory {
  id: string;
  slot: AccessorySlot;
  name: string;
  price: number;
  color: string;
  light: string;
  trim: string;
  style: number;
  description: string;
}

export const accessoryCategories: { id: AccessorySlot; label: string }[] = [
  { id: 'cape', label: 'Capas' }, { id: 'jacket', label: 'Jaquetas' }, { id: 'hat', label: 'Chapéus' },
];
export const accessories: Accessory[] = [
  { id: 'cape-star', slot: 'cape', name: 'Capa estelar', price: 120, color: '#5800c8', light: '#ba70ff', trim: '#f4d586', style: 0, description: 'O roxo clássico de quem nasceu para transformar a cidade.' },
  { id: 'cape-comet', slot: 'cape', name: 'Capa cometa', price: 80, color: '#096db5', light: '#8be9ff', trim: '#e7faff', style: 1, description: 'Azul celeste com um rastro de luz para novas descobertas.' },
  { id: 'cape-galaxy', slot: 'cape', name: 'Capa galáxia', price: 180, color: '#ac237f', light: '#ff9ccd', trim: '#ffe9a3', style: 2, description: 'Uma constelação de pequenas estrelas em rosa cósmico.' },
  { id: 'cape-neon', slot: 'cape', name: 'Capa neon', price: 220, color: '#067a69', light: '#71ffb0', trim: '#c4ff56', style: 3, description: 'Verde luminoso e detalhes que celebram a natureza.' },
  { id: 'cape-moon', slot: 'cape', name: 'Capa lunar', price: 260, color: '#5e729f', light: '#e6f0ff', trim: '#ffffff', style: 4, description: 'Prata e azul para acompanhar as ideias que brilham à noite.' },
  { id: 'cape-legend', slot: 'cape', name: 'Capa lendária', price: 300, color: '#bb5b10', light: '#ffe28b', trim: '#fff0b4', style: 5, description: 'Uma capa dourada para cada pequena grande conquista.' },
  { id: 'jacket-trail', slot: 'jacket', name: 'Jaqueta aventura', price: 80, color: '#bc5a23', light: '#ffb760', trim: '#ffecc3', style: 0, description: 'Bolsos e tons de terracota para explorar cada cantinho.' },
  { id: 'jacket-forest', slot: 'jacket', name: 'Jaqueta floresta', price: 120, color: '#15765f', light: '#83db9d', trim: '#f0e5a7', style: 1, description: 'Verde folha com um pequeno símbolo de cuidado.' },
  { id: 'jacket-ocean', slot: 'jacket', name: 'Jaqueta oceano', price: 150, color: '#136eae', light: '#7eddff', trim: '#eaf7ff', style: 2, description: 'Azul profundo e faixas claras como uma onda.' },
  { id: 'jacket-sun', slot: 'jacket', name: 'Jaqueta solar', price: 180, color: '#d09411', light: '#fff093', trim: '#8b391d', style: 3, description: 'Amarelo acolhedor para levar energia por onde passar.' },
  { id: 'jacket-city', slot: 'jacket', name: 'Jaqueta urbana', price: 220, color: '#373750', light: '#9b9bbc', trim: '#d5b4ff', style: 4, description: 'Grafite com acabamentos lilás e um toque de atitude.' },
  { id: 'jacket-cosmos', slot: 'jacket', name: 'Jaqueta cósmica', price: 280, color: '#842793', light: '#f1a0e9', trim: '#ffdf91', style: 5, description: 'Uma edição estrelada para imaginar novos futuros.' },
  { id: 'hat-explorer', slot: 'hat', name: 'Chapéu explorador', price: 80, color: '#a86c32', light: '#f9d99a', trim: '#62421f', style: 0, description: 'A companhia perfeita para uma aventura pela cidade.' },
  { id: 'hat-artist', slot: 'hat', name: 'Boina criativa', price: 100, color: '#b52e62', light: '#ff98b2', trim: '#ffe0e8', style: 1, description: 'Um toque de cor para enxergar possibilidades.' },
  { id: 'hat-bucket', slot: 'hat', name: 'Chapéu maré', price: 140, color: '#126c83', light: '#96dbe6', trim: '#f2e8b9', style: 2, description: 'Leve e descontraído, com ondas bordadas na aba.' },
  { id: 'hat-cap', slot: 'hat', name: 'Boné solar', price: 160, color: '#c17415', light: '#ffe469', trim: '#fff4bc', style: 3, description: 'Um raio de sol para iluminar o próximo passeio.' },
  { id: 'hat-inventor', slot: 'hat', name: 'Cartola inventor', price: 240, color: '#384567', light: '#95badf', trim: '#edbc58', style: 4, description: 'Óculos dourados e muitas ideias debaixo da cartola.' },
  { id: 'hat-crown', slot: 'hat', name: 'Coroa da cidade', price: 300, color: '#cc870d', light: '#fff0a3', trim: '#ea61bf', style: 5, description: 'Uma coroa para quem cuida do que é de todos.' },
];
export const accessoryById: Record<string, Accessory> = Object.assign(Object.create(null), Object.fromEntries(accessories.map(item => [item.id, item])));
export const defaultOutfit = (): Outfit => ({ cape: 'cape-star', jacket: null, hat: null });
export const initialWardrobe = (): Wardrobe => ({ owned: ['cape-star'], equipped: defaultOutfit() });

export function normalizeWardrobe(value: unknown): Wardrobe {
  if (!value || typeof value !== 'object') return initialWardrobe();
  const raw = value as Partial<Wardrobe>;
  const owned = [...new Set(['cape-star', ...(Array.isArray(raw.owned) ? raw.owned.filter(id => typeof id === 'string' && accessoryById[id]) : [])])];
  const equipped = defaultOutfit();
  for (const { id: slot } of accessoryCategories) {
    const id = raw.equipped?.[slot];
    if (id && owned.includes(id) && accessoryById[id]?.slot === slot) equipped[slot] = id;
  }
  return { owned, equipped };
}

export function buyAccessory(progress: Progress, id: string): Progress {
  const item = accessoryById[id];
  if (!item) throw new Error('Acessório não encontrado.');
  if (progress.wardrobe.owned.includes(id)) return progress;
  if (progress.coins < item.price) throw new Error(`Faltam ${item.price - progress.coins} moedas para este acessório.`);
  return { ...progress, coins: progress.coins - item.price, wardrobe: { ...progress.wardrobe, owned: [...progress.wardrobe.owned, id] } };
}

export function equipOutfit(progress: Progress, outfit: Outfit): Progress {
  for (const { id: slot } of accessoryCategories) {
    const id = outfit[slot];
    if (id === null && slot !== 'cape') continue;
    if (!id || accessoryById[id]?.slot !== slot || !progress.wardrobe.owned.includes(id)) throw new Error('Compre os acessórios selecionados antes de salvar o visual.');
  }
  return { ...progress, wardrobe: { ...progress.wardrobe, equipped: { ...outfit } } };
}
