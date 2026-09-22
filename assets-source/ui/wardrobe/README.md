# Impactus e acessórios

O catálogo contém 18 acessórios: seis capas, seis jaquetas e seis chapéus. As jaquetas e os chapéus podem ser retirados independentemente; a capa estelar é o visual original, disponível desde o início. São 294 combinações, contando as categorias opcionais.

## Fontes e reprodução

- Design das telas: [loja no Figma](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=41-1859) e [missões no Figma](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=47-139).
- Os recortes originais de prancheta e carrinho foram exportados do Figma. Os PNGs originais estão em `assets-source/ui/journey`, e as versões otimizadas de 256 px estão em `public/assets/ui/journey`.
- As capas usam os vetores de `src/ui/wardrobe/AccessoryArt.tsx`; execute `node scripts/export-accessories.mjs` para atualizar suas miniaturas. As paletas e preços ficam em `src/game/wardrobe.ts`.
- Jaquetas e chapéus usam arte com volume, tecido, reflexos e perspectiva compatíveis com o robô. Os sete PNGs fonte e os prompts da ferramenta integrada ImageGen estão em `assets-source/ui/wardrobe/rendered`. `node scripts/prepare-wearables.mjs` aplica os contornos vetoriais de recorte necessários e exporta sete WebPs com transparência para `public/assets/accessories/rendered`. Os PNGs fonte são preservados. Os antigos SVGs de jaquetas/chapéus são apenas legados, não usados pela loja atual.
- `WearableLayers.tsx` tem contornos separados de tronco, mangas e mãos para cada pose. O tecido do tronco mantém sua proporção; as mangas aproveitam o volume e a iluminação dos braços originais, recebem a cor da jaqueta e costuras nos punhos. Chapéus com abertura visível têm recortes de frente para que o capacete ocupe o interior. As miniaturas mostram as peças completas, enquanto o personagem usa os recortes de vestir.
- `CharacterAvatar.tsx` compõe a imagem original e as peças no mesmo espaço quadrado. As posições são específicas para cada uma das cinco poses. As máscaras mantêm a mudança de cor da capa atrás da armadura e das mãos.
- `impactus-clean.png` é a limpeza do recorte neutro, feita com a ferramenta integrada ImageGen. A versão de uso é `public/assets/portraits/robot/impactus-clean.webp`, de 768 × 768 px. Não foi criado ou alterado um modelo 3D.

## Correção das jaquetas e chapéus

Os ícones planos aplicados sobre o robô foram substituídos por recortes de arte renderizada. A jaqueta passa a cobrir o tronco até a cintura e os ombros. Chapéus têm ajustes próprios de largura, altura e apoio na testa; a composição reserva espaço para a cartola sem cortar o topo. A sobreposição de mãos é diferente em cada uma das cinco poses. Nenhum ID de acessório, compra, preço ou inventário foi alterado, e as capas mantêm sua composição anterior.

Os prompts completos, referência usada e modo integrado de geração estão em `rendered/prompts.json`. As dimensões dos recortes estão em `rendered/dimensions.json`.

### Diagnóstico e encaixe por pose — 22/09/2026

A inspeção das imagens e da composição revelou quatro causas: interiores vazios das peças de catálogo continuavam visíveis sobre o personagem; `preserveAspectRatio="none"` achatava a jaqueta; as mangas mantinham a pose da imagem de catálogo mesmo com os braços levantados; e o enquadramento mudava de escala ao experimentar um chapéu.

O tronco agora usa escala proporcional e um contorno próprio. As mangas seguem a anatomia das cinco poses, sem sobrepor aberturas de mangas vazias; mãos e queixo permanecem à frente dentro da área da roupa, preservando a capa. Chapéu maré, boina e boné escondem o interior e a borda traseira que a cabeça deve cobrir. A loja reserva o mesmo espaço acima da cabeça com ou sem chapéu, mantendo o tamanho do corpo durante a experimentação.

Os testes de interface verificam todos os chapéus e jaquetas, compra e persistência, conservação dos pixels da capa, e comparação do rosto/corpo antes e depois de vestir o chapéu maré. A galeria de inspeção local permite conferir as cinco poses; as capturas dos testes ficam em `test-results`.

## Prompt usado na limpeza

Use case: precise-object-edit. Asset type: transparent game character sprite. Input image is the EDIT TARGET, the existing Impactus robot. Repair ONLY the cutout artifacts: remove all stray horizontal lines, smears and fringe pixels outside the robot/cape silhouette, on both sides, below and between legs. Preserve exactly the original character design, white and purple armor, cyan smiling winking eyes, forehead lightning bolt, chest lightning bolt, original purple cape, anatomy, pose, hands, legs, shape and natural aspect ratio. Preserve original square composition, position and size. Do not stretch or squash the body. Keep the full body including boots and cape. Transparent alpha background, no backdrop, no floor, no new shadow, no added accessories, no text. This is a surgical cleanup, not a redesign.

## Comportamento

Comprar adiciona a peça ao inventário e desconta o preço uma vez. Experimentar não cobra nem substitui o visual salvo. Salvar aceita somente peças adquiridas da categoria correta. Sair da prévia mantém as compras e permite descartar as trocas ainda não salvas. O inventário e o visual são incluídos no save existente; saves anteriores recebem a capa original sem perda de moedas ou decisões.

As missões diárias acompanham energia, cinco visitas distintas, uma observação do companheiro e uma solução completa. Resgates e o bônus são idempotentes. A renovação ocorre à meia-noite local e mantém inventário e história.
