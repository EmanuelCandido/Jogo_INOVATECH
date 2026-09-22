# Impactus e acessórios

O catálogo contém 18 acessórios: seis capas, seis jaquetas e seis chapéus. As jaquetas e os chapéus podem ser retirados independentemente; a capa estelar é o visual original, disponível desde o início. São 294 combinações, contando as categorias opcionais.

## Fontes e reprodução

- Design das telas: [loja no Figma](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=41-1859) e [missões no Figma](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=47-139).
- Os recortes originais de prancheta e carrinho foram exportados do Figma. Os PNGs originais estão em `assets-source/ui/journey`, e as versões otimizadas de 256 px estão em `public/assets/ui/journey`.
- As peças são vetores editáveis em `src/ui/wardrobe/AccessoryArt.tsx`, com paletas e preços em `src/game/wardrobe.ts`. Execute `node scripts/export-accessories.mjs` depois de alterar sua arte. Os 18 SVGs são exportados para `public/assets/accessories` e usados nas miniaturas da loja.
- `CharacterAvatar.tsx` compõe a imagem original e as peças no mesmo espaço quadrado. As posições são específicas para cada uma das cinco poses. As máscaras mantêm a mudança de cor da capa atrás da armadura e das mãos.
- `impactus-clean.png` é a limpeza do recorte neutro, feita com a ferramenta integrada ImageGen. A versão de uso é `public/assets/portraits/robot/impactus-clean.webp`, de 768 × 768 px. Não foi criado ou alterado um modelo 3D.

## Prompt usado na limpeza

Use case: precise-object-edit. Asset type: transparent game character sprite. Input image is the EDIT TARGET, the existing Impactus robot. Repair ONLY the cutout artifacts: remove all stray horizontal lines, smears and fringe pixels outside the robot/cape silhouette, on both sides, below and between legs. Preserve exactly the original character design, white and purple armor, cyan smiling winking eyes, forehead lightning bolt, chest lightning bolt, original purple cape, anatomy, pose, hands, legs, shape and natural aspect ratio. Preserve original square composition, position and size. Do not stretch or squash the body. Keep the full body including boots and cape. Transparent alpha background, no backdrop, no floor, no new shadow, no added accessories, no text. This is a surgical cleanup, not a redesign.

## Comportamento

Comprar adiciona a peça ao inventário e desconta o preço uma vez. Experimentar não cobra nem substitui o visual salvo. Salvar aceita somente peças adquiridas da categoria correta. Sair da prévia mantém as compras e permite descartar as trocas ainda não salvas. O inventário e o visual são incluídos no save existente; saves anteriores recebem a capa original sem perda de moedas ou decisões.

As missões diárias acompanham energia, cinco visitas distintas, uma observação do companheiro e uma solução completa. Resgates e o bônus são idempotentes. A renovação ocorre à meia-noite local e mantém inventário e história.
