# Chapéus clássicos e capas da cidade

As doze artes foram produzidas com a ferramenta integrada ImageGen. Os pedidos completos estão em `prompts.json`. As fontes de chapéus mostram as peças **vestidas no Impactus**; as fontes das capas contêm somente o tecido completo, inclusive a parte que fica oculta pelo corpo.

## Exportação

`node scripts/prepare-classic-accessories.mjs` exporta os doze WebPs com transparência para `public/assets/accessories/classic-v2`. O script usa o suporte a TypeScript do Node 22.18 ou superior.

- Chapéus: extração da aba e do tecido a partir da referência vestida, em um quadro de 768 × 768. `classicArtwork.ts` registra recortes, áreas encobertas do capacete, sombra de contato e ajuste da referência à pose inicial. O rosto continua vindo do sprite original.
- Capas: registro do centro da gola sobre o pescoço, com caimento até as coxas. O contorno de corpo existente retira a capa roxa do sprite original antes de compor o novo tecido atrás dele.
- Em todas as poses, cabeça e tronco têm transformações independentes. Tirar o chapéu não muda a escala do personagem nos diálogos.

## Compatibilidade

Os IDs e preços anteriores foram preservados. Os nomes das capas agora descrevem os novos temas:

| ID salvo | Nome exibido |
| --- | --- |
| cape-star | Capa guardião da cidade |
| cape-comet | Capa correnteza |
| cape-galaxy | Capa jardim do bairro |
| cape-neon | Capa ciclo novo |
| cape-moon | Capa brisa limpa |
| cape-legend | Capa cidade solar |

Quem já comprou uma peça recebe a nova arte sem outra cobrança. Capas e chapéus estão disponíveis na aba **Peças** e as peças adquiridas continuam no **Meu armário**. A categoria de costas chama-se **Capas e mochilas**.
