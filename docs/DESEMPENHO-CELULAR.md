# Desempenho em celular e PC fraco

26/09/2026. Primeira aplicação do plano "Plano de desempenho para celular e PC fraco", com a regra de qualidade aprovada por Emanuel: a imagem parada fica igual, todos os modelos, posições, sombras e animações continuam; pode haver menos resolução durante o movimento e modelos repetidos simplificados quando a diferença fica abaixo de meio pixel.

Aparelho de referência: Redmi 14C (Mali-G52 MC2, tela 720 × 1640). Meta pedida: 60 fps no Alto com sombras. As medições abaixo são do navegador de testes com SwiftShader (processador, sem placa de vídeo), no perfil de celular 360 × 800 a DPR 2, qualidade Alta. Elas medem trabalho (triângulos, tempo de CPU na abertura), não o FPS do celular.

## O que mudou

| Mudança | Arquivos | Efeito medido |
| --- | --- | --- |
| Ruas, calçadas, terreno e água pré-calculados no build | `scripts/generate-city-surfaces.mjs`, `src/components/environment/citySurfaces.ts`, `cityGeometry.ts`, `surfaceAttributes.ts`, `src/assets/geometryPack.ts` | Abertura de 32,5 s para 16,9 s até o botão Jogar; some a tarefa de 12,5 s que congelava a animação |
| Sombreadores compilados em paralelo antes de mostrar a cidade | `src/components/city/ShaderGate.tsx` | Evita a travada de 5 a 6 s no primeiro desenho quando o navegador tem `KHR_parallel_shader_compile` (o SwiftShader não tem, então não foi medido aqui) |
| Resolução menor só durante o movimento | `src/components/city/MotionResolution.tsx` | Cerca de metade dos pixels enquanto a câmera se move; o quadro parado volta à resolução total |
| Modelos repetidos simplificados quando pequenos na tela | `src/game/instanceLod.ts` | Panorama de 2,08 para 1,54 milhão de triângulos; 0,13% dos pixels mudam mais de 24/255 |
| Contador contínuo de FPS | `src/components/city/LiveFrameRate.tsx`, `src/ui/hud/PerformanceReadout.tsx` | "Mostrar desempenho" passa a mostrar FPS, pior quadro, triângulos, resolução e placa |

### Superfícies pré-calculadas

`createSurfaces()` continua sendo a fonte da verdade. O build roda o mesmo código em Node (empacotado com esbuild) e grava `public/assets/generated/city-surfaces.bin.gz` (1,87 MB). O script confirma, antes de gravar, que o arquivo decodificado devolve os mesmos valores:

- posições, índices, UVs e normais do terreno são idênticos (a compressão meshopt não tem perda; um triângulo pode ter os vértices rotacionados, sem mudar a face);
- normais das superfícies planas são recalculadas no navegador com a mesma chamada que as criou, e o script exige igualdade exata;
- cores e posições do terreno são reconstruídas da altura e do ponto do mapa, com diferença abaixo de 0,0001.

Se o arquivo não puder ser usado, o jogo calcula as superfícies como antes. `npm run dev` e `npm run build` regeneram o arquivo; `npm run surfaces:build` faz só esse passo.

### Modelos simplificados

A câmera é ortográfica, então todos os objetos têm a mesma escala na tela: `zoom × DPR` pixels por metro. Para cada modelo com 12 ou mais cópias, o meshoptimizer gera até quatro níveis que reusam os mesmos vértices, normais e cores. O jogo usa o nível mais simples cujo erro medido, multiplicado pela maior escala das cópias, fica abaixo de 0,4 pixel. O passe de sombra sempre usa o modelo completo. Nenhum GLB ou fonte Blender foi alterado. `?lod=0` desliga para comparação.

As copas das árvores já são pequenos icosaedros no limite da simplificação; o ganho veio dos troncos, carros, postes, grades e peças de estrutura. [Comparação](performance/lod-mobile-high/results.json): full × simplificado no panorama, centro, floresta e zoom máximo.

## O que falta medir no Redmi 14C

Nada aqui prova 60 fps no celular. É preciso abrir a versão de teste no Redmi 14C, em Alto, com "Mostrar desempenho" ligado, e anotar o FPS parado e arrastando no panorama, no centro e na floresta. Com esses números decidimos a próxima etapa (folhas pré-calculadas, custo das sombras ou da água).

## Reprodução

- `node scripts/measure-mobile.mjs <pasta>` com `npx vite preview` rodando: triângulos e imagens por vista.
- `node scripts/compare-lod.mjs <pasta>`: imagens com e sem simplificação e diferença de pixels.
- `node scripts/profile-startup-mobile.mjs` depois de `npx vite build --outDir .tools/startup-profile --sourcemap`: perfil de CPU da abertura.
