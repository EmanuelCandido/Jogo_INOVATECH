import type { Progress } from './types';

export type AccessorySlot = 'cape' | 'jacket' | 'hat';
export type CollectionId = 'solar' | 'garden' | 'repair';
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
  collection?: CollectionId;
  art?: string;
  feature?: string;
}

export const accessoryCategories: { id: AccessorySlot; label: string }[] = [
  { id: 'cape', label: 'Costas' }, { id: 'jacket', label: 'Trajes' }, { id: 'hat', label: 'Cabeça' },
];
export const accessories: Accessory[] = [
  {id:'pack-solar',slot:'cape',collection:'solar',art:'solar-pack',name:'Estação de bolso',price:240,color:'#c58315',light:'#ffe3a0',trim:'#71edff',style:0,feature:'Carregador solar de mochila',description:'Energia limpa para acompanhar o Impactus. Painel solar, bateria compacta e um indicador de energia que acompanha cada descoberta.'},
  {id:'vest-solar',slot:'jacket',collection:'solar',art:'solar-vest',name:'Colete raio de sol',price:160,color:'#c98c14',light:'#ffe9ab',trim:'#fff5d9',style:0,feature:'Acabamentos âmbar e refletivos',description:'Amarelo solar, costuras acolchoadas e detalhes refletivos. Um detalhe solar no peito completa o visual.'},
  {id:'head-solar',slot:'hat',collection:'solar',art:'solar-helmet',name:'Capacete horizonte',price:140,color:'#c58315',light:'#ffe3a0',trim:'#71edff',style:0,feature:'Casco âmbar e células solares',description:'Um visual de mobilidade limpa: capacete leve em âmbar com pequenos painéis no topo.'},
  {id:'pack-garden',slot:'cape',collection:'garden',art:'garden-pack',name:'Viveiro portátil',price:220,color:'#286754',light:'#b2deac',trim:'#db8154',style:0,feature:'Mudas e reservatório de água',description:'Uma pequena horta vai junto: mudas protegidas, água e ferramentas para imaginar uma cidade mais verde.'},
  {id:'vest-garden',slot:'jacket',collection:'garden',art:'garden-vest',name:'Avental semeador',price:140,color:'#376b5e',light:'#b6d9aa',trim:'#ecae85',style:0,feature:'Bolsos de sementes e tons de sálvia',description:'Lona clara, bolsos de sementes e costuras em forma de folha. Verde e terracota para cuidar dos jardins da cidade.'},
  {id:'head-garden',slot:'hat',collection:'garden',art:'garden-hat',name:'Chapéu flor do bairro',price:110,color:'#286754',light:'#b2deac',trim:'#db8154',style:0,feature:'Trama vegetal e folhas na faixa',description:'Aba curva, trama de papel reaproveitado e folhas na faixa. Pronto para cuidar das praças.'},
  {id:'pack-repair',slot:'cape',collection:'repair',art:'repair-pack',name:'Oficina nas costas',price:230,color:'#285594',light:'#b0d4ed',trim:'#fda351',style:0,feature:'Lona, ferramentas e peças reaproveitadas',description:'Lona e jeans reaproveitados, bolsos de ferramentas e um rolo de tecido. Uma oficina compacta para dar nova vida ao que a cidade já tem.'},
  {id:'vest-repair',slot:'jacket',collection:'repair',art:'repair-vest',name:'Colete segunda vida',price:160,color:'#295b9c',light:'#aaceec',trim:'#f4aa64',style:0,feature:'Retalhos, costuras e azul de oficina',description:'Retalhos azuis, remendos cuidadosos e bolsos de oficina. Detalhes laranja dão outra vida ao visual do Impactus.'},
  {id:'head-repair',slot:'hat',collection:'repair',art:'repair-goggles',name:'Óculos de boas ideias',price:120,color:'#285594',light:'#b0d4ed',trim:'#fda351',style:0,feature:'Lentes de inspeção sobre a testa',description:'Lentes claras, armação de metal e uma tira ajustada ao capacete. Ficam sobre a testa, deixando a expressão do Impactus livre.'},
  { id: 'cape-star', slot: 'cape', name: 'Capa guardião da cidade', price: 120, color: '#2b7036', light: '#5d8f65', trim: '#f4d586', style: 0, feature:'A cidade bordada no verde do Impactus', description: 'Casas, caminhos e uma árvore bordados na barra dourada. O verde clássico celebra a cidade que você ajuda a transformar.' },
  { id: 'cape-comet', slot: 'cape', name: 'Capa correnteza', price: 80, color: '#096db5', light: '#8be9ff', trim: '#e7faff', style: 1, feature:'Curvas do rio em azul e turquesa', description: 'Faixas claras acompanham as dobras como um rio limpo. Tecido azul, bordado de gota e acabamento prateado.' },
  { id: 'cape-galaxy', slot: 'cape', name: 'Capa jardim do bairro', price: 180, color: '#316039', light: '#ff9ccd', trim: '#ffe9a3', style: 2, feature:'Flores e folhas bordadas', description: 'Rosa e verde com um ramo de folhas e flores. Acabamentos ondulados para quem espalha novos jardins pela cidade.' },
  { id: 'cape-neon', slot: 'cape', name: 'Capa ciclo novo', price: 220, color: '#067a69', light: '#71ffb0', trim: '#c4ff56', style: 3, feature:'Retalhos verdes com costuras douradas', description: 'Pedaços de tecido ganham outra vida: verde, menta e turquesa unidos por costuras aparentes e um bordado de reciclagem.' },
  { id: 'cape-moon', slot: 'cape', name: 'Capa brisa limpa', price: 260, color: '#5e729f', light: '#e6f0ff', trim: '#ffffff', style: 4, feature:'Bordados de vento e energia eólica', description: 'Tecido índigo com barra azul-clara. Linhas prateadas de vento envolvem uma pequena turbina e folhas bordadas.' },
  { id: 'cape-legend', slot: 'cape', name: 'Capa cidade solar', price: 300, color: '#bb5b10', light: '#ffe28b', trim: '#fff0b4', style: 5, feature:'Sol, telhados e mosaico solar', description: 'Dourado acolhedor e forro claro. Um sol nasce sobre os telhados, com uma barra azul inspirada nos painéis da cidade.' },
  { id: 'jacket-trail', slot: 'jacket', name: 'Jaqueta aventura', price: 80, color: '#bc5a23', light: '#ffb760', trim: '#ffecc3', style: 0, description: 'Bolsos e tons de terracota para explorar cada cantinho.' },
  { id: 'jacket-forest', slot: 'jacket', name: 'Jaqueta floresta', price: 120, color: '#15765f', light: '#83db9d', trim: '#f0e5a7', style: 1, description: 'Verde folha com um pequeno símbolo de cuidado.' },
  { id: 'jacket-ocean', slot: 'jacket', name: 'Jaqueta oceano', price: 150, color: '#136eae', light: '#7eddff', trim: '#eaf7ff', style: 2, description: 'Azul profundo e faixas claras como uma onda.' },
  { id: 'jacket-sun', slot: 'jacket', name: 'Jaqueta solar', price: 180, color: '#d09411', light: '#fff093', trim: '#8b391d', style: 3, description: 'Amarelo acolhedor para levar energia por onde passar.' },
  { id: 'jacket-city', slot: 'jacket', name: 'Jaqueta urbana', price: 220, color: '#37463a', light: '#91a595', trim: '#cbffd3', style: 4, description: 'Grafite com acabamentos verdes e um toque de atitude.' },
  { id: 'jacket-cosmos', slot: 'jacket', name: 'Jaqueta cósmica', price: 280, color: '#2d5233', light: '#b8f1c2', trim: '#ffdf91', style: 5, description: 'Uma edição estrelada para imaginar novos futuros.' },
  { id: 'hat-explorer', slot: 'hat', name: 'Chapéu explorador', price: 80, color: '#a86c32', light: '#f9d99a', trim: '#62421f', style: 0, description: 'A companhia perfeita para uma aventura pela cidade.' },
  { id: 'hat-artist', slot: 'hat', name: 'Boina criativa', price: 100, color: '#b52e62', light: '#ff98b2', trim: '#ffe0e8', style: 1, description: 'Um toque de cor para enxergar possibilidades.' },
  { id: 'hat-bucket', slot: 'hat', name: 'Chapéu maré', price: 140, color: '#126c83', light: '#96dbe6', trim: '#f2e8b9', style: 2, description: 'Leve e descontraído, com ondas bordadas na aba.' },
  { id: 'hat-cap', slot: 'hat', name: 'Boné solar', price: 160, color: '#c17415', light: '#ffe469', trim: '#fff4bc', style: 3, description: 'Um raio de sol para iluminar o próximo passeio.' },
  { id: 'hat-inventor', slot: 'hat', name: 'Cartola inventor', price: 240, color: '#384567', light: '#95badf', trim: '#edbc58', style: 4, description: 'Óculos dourados e muitas ideias debaixo da cartola.' },
  { id: 'hat-crown', slot: 'hat', name: 'Coroa da cidade', price: 300, color: '#cc870d', light: '#fff0a3', trim: '#53835b', style: 5, description: 'Uma coroa para quem cuida do que é de todos.' },
];
export const accessoryById: Record<string, Accessory> = Object.assign(Object.create(null), Object.fromEntries(accessories.map(item => [item.id, item])));
export const defaultOutfit = (): Outfit => ({ cape: 'cape-star', jacket: null, hat: null });
export const initialWardrobe = (): Wardrobe => ({ owned: ['cape-star'], equipped: defaultOutfit() });

export interface AccessoryCollection {
  id: CollectionId;
  name: string;
  theme: string;
  description: string;
  accent: string;
  surface: string;
  outfit: Outfit;
}
export const accessoryCollections: AccessoryCollection[] = [
  {id:'solar',name:'Pulso Solar',theme:'ENERGIA LIMPA',description:'Carregue boas ideias. Vista a energia do sol.',accent:'#9b5d08',surface:'#fff1d1',outfit:{cape:'pack-solar',jacket:'vest-solar',hat:'head-solar'}},
  {id:'garden',name:'Jardim de Bolso',theme:'CIDADE MAIS VERDE',description:'Um pedacinho de verde, por onde você passar.',accent:'#267357',surface:'#e0f1df',outfit:{cape:'pack-garden',jacket:'vest-garden',hat:'head-garden'}},
  {id:'repair',name:'Oficina Circular',theme:'REUTILIZAR É CRIAR',description:'Tudo pode ganhar uma segunda vida. Até seu estilo.',accent:'#2b5e96',surface:'#e1edfb',outfit:{cape:'pack-repair',jacket:'vest-repair',hat:'head-repair'}},
];
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
