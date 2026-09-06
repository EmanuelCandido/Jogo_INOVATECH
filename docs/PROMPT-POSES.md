# Preparação das poses

Ferramenta: `imagegen.imagegen` integrada ao Codex. Entradas: as cinco imagens `Pose 1.png` a `Pose 5.png` fornecidas pelo usuário. Os originais não foram substituídos.

## Poses 1 a 4

Prompt aplicado individualmente, usando somente a imagem da pose correspondente:

> Use case: background-extraction. Edit target: the supplied image of the purple and ivory robot. Remove ONLY the pale lavender background and floor shadow, replacing them with genuinely transparent alpha. Preserve the entire robot exactly: identical pose, face expression, helmet lightning, chest lightning, hands/fingers, cape shape and texture, proportions, purple and ivory colors, all reflections and highlights. No redesign, no stylization, no vector flattening, no extra elements. Keep original square framing and the complete robot including both feet and all cape tips. Clean antialiased edges and transparent spaces between limbs and cape. No checkerboard drawn into the image; actual transparency. This is a production game character cutout. This is pose N; preserve this specific source pose.

## Pose 5

As primeiras tentativas produziram fundo quadriculado opaco e foram descartadas. Prompt do recorte aceito:

> Remova o fundo desta imagem. Entregue o mesmo robô em PNG transparente (canal alfa), sem modificar o personagem.

## Exportação

`node scripts/export-robot-poses.mjs` lê os PNGs já recortados em `public/assets/portraits/robot/source`, valida o canal alfa e incorpora os arquivos sem perda em SVG. Também gera WebP transparente de 768 × 768 para uso na interface e um manifesto com SHA-256 das fontes. A conversão usa Sharp; não remove fundos nem redesenha imagens.

As poses correspondem a apresentação, reflexão, alerta, comemoração e preocupação. O jogo troca de imagem depois de decodificar a próxima pose para evitar piscadas durante o diálogo. Os cinco formatos PNG/SVG são arquivos de entrega; somente WebP é carregado pelo jogo.
