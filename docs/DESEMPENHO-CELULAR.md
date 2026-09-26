# Desempenho em celular e PC fraco

26/09/2026. Primeira aplicação do plano "Plano de desempenho para celular e PC fraco", com a regra de qualidade aprovada por Emanuel: a imagem parada fica igual, todos os modelos, posições, sombras e animações continuam; pode haver menos resolução durante o movimento e modelos repetidos simplificados quando a diferença fica abaixo de meio pixel.

Aparelho de referência: Redmi 14C (Mali-G52 MC2, tela 720 × 1640). Meta pedida: 60 fps no Alto com sombras. As medições abaixo são do navegador de testes com SwiftShader (processador, sem placa de vídeo), no perfil de celular 360 × 800 a DPR 2, qualidade Alta. Elas medem trabalho (triângulos, tempo de CPU na abertura), não o FPS do celular.

## O que mudou

| Mudança | Arquivos | Efeito medido |
| --- | --- | --- |
| Ruas, calçadas, terreno e água pré-calculados no build | `scripts/generate-city-surfaces.mjs`, `src/components/environment/citySurfaces.ts`, `cityGeometry.ts`, `surfaceAttributes.ts`, `src/assets/geometryPack.ts` | Abertura de 32,5 s para 16,9 s até o botão Jogar; some a tarefa de 12,5 s que congelava a animação |
| Sombreadores compilados em paralelo antes de mostrar a cidade | `src/components/city/ShaderGate.tsx` | Evita a travada de 5 a 6 s no primeiro desenho quando o navegador tem `KHR_parallel_shader_compile` (o SwiftShader não tem, então não foi medido aqui) |
| Resolução menor só durante o movimento | `src/components/city/MotionResolution.tsx` | Cerca de metade dos pixels enquanto a câmera se move; o quadro parado volta à resolução total |
| Modelos repetidos simplificados quando pequenos na tela | `src/game/instanceLod.ts` | Panorama de 2,08 para 1,29 milhão de triângulos a 0,9 pixel ([comparação](performance/lod-09-mobile-high/results.json)); 0,31% dos pixels mudam mais de 24/255 |
| Contador contínuo de FPS | `src/components/city/LiveFrameRate.tsx`, `src/ui/hud/PerformanceReadout.tsx` | "Mostrar desempenho" passa a mostrar FPS, pior quadro, triângulos, resolução e placa |

### Superfícies pré-calculadas

`createSurfaces()` continua sendo a fonte da verdade. O build roda o mesmo código em Node (empacotado com esbuild) e grava `public/assets/generated/city-surfaces.bin.gz` (1,87 MB). O script confirma, antes de gravar, que o arquivo decodificado devolve os mesmos valores:

- posições, índices, UVs e normais do terreno são idênticos (a compressão meshopt não tem perda; um triângulo pode ter os vértices rotacionados, sem mudar a face);
- normais das superfícies planas são recalculadas no navegador com a mesma chamada que as criou, e o script exige igualdade exata;
- cores e posições do terreno são reconstruídas da altura e do ponto do mapa, com diferença abaixo de 0,0001.

Se o arquivo não puder ser usado, o jogo calcula as superfícies como antes. `npm run dev` e `npm run build` regeneram o arquivo; `npm run surfaces:build` faz só esse passo.

### Modelos simplificados

A câmera é ortográfica, então todos os objetos têm a mesma escala na tela: `zoom × DPR` pixels por metro. Para cada modelo com 12 ou mais cópias, o meshoptimizer gera até quatro níveis que reusam os mesmos vértices, normais e cores. O jogo usa o nível mais simples cujo erro medido, multiplicado pela maior escala das cópias, fica abaixo de 0,9 pixel (o limite aprovado é 1 pixel; a primeira versão usava 0,4). O passe de sombra sempre usa o modelo completo. Nenhum GLB ou fonte Blender foi alterado. `?lod=0` desliga para comparação.

As copas das árvores já são pequenos icosaedros no limite da simplificação; o ganho veio dos troncos, carros, postes, grades e peças de estrutura. [Comparação](performance/lod-mobile-high/results.json): full × simplificado no panorama, centro, floresta e zoom máximo.

## Primeira medição no Redmi 14C

Emanuel, 26/09, Alto sem sombras: abertura mais curta, mas a animação de carregamento só começou perto do fim; 4 a 6 FPS no panorama e 25 a 30 FPS no zoom máximo. O panorama desenha cerca de 1,5 milhão de triângulos em 900 mil pixels, então a maioria dos triângulos cobre menos de um pixel.

`?diagnostico=1` mostra um botão "Medir esta vista" (`src/components/city/Diagnostic.tsx`). Ele mede a vista atual com partes do quadro desligadas uma por vez (metade da resolução, cores lisas sem luz, sem folhas, sem água, sem modelos repetidos, nada desenhado) e mostra a placa, a resolução, o tempo de abertura e quanto tempo o processador ficou travado durante a abertura. Um print dessa tabela diz se o limite é pixel, sombreamento, triângulos ou processador.

## Segunda medição e cidade parada guardada

Diagnóstico no Redmi 14C (Alto, sem sombras, panorama): 149 ms por quadro completo; 83 ms com a luz PBR sem os acabamentos procedurais; 46 ms com luz simples sem acabamentos; 17 ms com cores lisas. Abertura de 42,5 s para 18,1 s depois da poda exata das contas de distância (`src/config/spatial.ts`, `roadProfiles.ts`, `referenceMap.ts`; os 140 valores de `src/config` ficam idênticos). O celular não tem compilação paralela de sombreadores (28 programas).

Com a câmera parada, só a água e a espuma da praia mudam. `src/game/staticFrame.ts` guarda o último quadro completo num alvo com 4 amostras por pixel, como o antisserrilhado do canvas, e a cada quadro redesenha só os materiais marcados com `userData.ambient` (7 desenhos em vez de cerca de 440). A água opaca é redesenhada no lugar: cada amostra passa no teste de profundidade só onde a água era a superfície mais próxima. No navegador de testes, o quadro guardado e o quadro completo são idênticos (0 pixels diferentes), e 12 redesenhos com o relógio da água parado mudam 6 pixels em 1,15 milhão em no máximo 1/255. Qualquer outro pedido de quadro, mudança de câmera, tamanho, sombra ou transição desenha a cidade inteira de novo. `?cache=0` volta ao caminho antigo.

## Terceira medição e arrastar sem redesenhar a cidade

No Redmi 14C, com sombras ligadas, a cidade parada ficou em 56,7 FPS (8 desenhos) e o contador ao vivo em 59 FPS; o quadro completo custa 301 ms com sombras e 151 ms sem. O print sem sombras ainda era da versão anterior à correção do cache com sombras desligadas; no navegador de testes, a versão atual reaproveita o quadro parado também sem sombras.

Ao arrastar, cada quadro redesenhava a cidade inteira. A câmera olha sempre na mesma direção e não tem perspectiva, então a vista nova é a imagem anterior deslocada (arrastar) ou ampliada/reduzida (zoom). `staticFrame.ts` agora move a imagem anterior na placa de vídeo e desenha só as faixas que entram na tela, cortando a câmera para cada faixa (`setViewOffset`), o que também faz o recorte de modelos pular tudo fora dela. O arrasto desloca por pixels inteiros, então a imagem não borra; a câmera desenhada fica a menos de meio pixel da exata. No zoom, a imagem é ampliada ou reduzida e só a borda nova é desenhada; quando a borda passa de 25% da tela, a imagem montada vira a nova referência, e acima de 60% o quadro é desenhado inteiro. A água fica parada durante o gesto. Quando o dedo sai da tela e a câmera fica 180 ms parada, a cidade é desenhada inteira de novo, então toda imagem parada é a mesma de antes. `?mover=0` desliga só essa parte.

Dois ajustes foram necessários: o pedido de quadro que o recorte de instâncias faz depois de mudar a seleção não conta mais como mudança da cena (a seleção já foi desenhada naquele quadro), e a navegação do mapa pede quadros como movimento de câmera (`cameraInvalidate`). `MotionResolution` só reduz a resolução quando a cidade inteira é redesenhada em movimento (voos de câmera das missões).

No navegador de testes (SwiftShader, 630×1400, Alto, com sombras): 30 passos de arrasto sem nenhum quadro completo, cerca de 330 ms por passo contra cerca de 3 s do quadro completo; 20 passos de zoom afastando a cerca de 750 ms; aproximando, cerca de 30 ms. O quadro final depois do gesto difere de um quadro completo novo em 11 pixels de 880 mil, na borda da água, a mesma diferença do redesenho da água parada. `?diagnostico=1` ganhou as linhas "Arrastando" e "Dando zoom". Teste: `node scripts/measure-moving-frames.mjs` com `npx vite preview --port 4175`.

## Quarta medição: arrastar a 48 FPS

No Redmi 14C, com sombras: parada 55,7 FPS, arrastando 48,2 FPS (20 ms, 1 faixa de 6 pixels por quadro), dando zoom 60,3 FPS. No PC com Intel UHD: parada 108, arrastando 64, zoom 75, quadro completo 19.

Uma faixa de 1% da tela custava quase o mesmo que o quadro inteiro de cópias: a imagem inteira era copiada para o outro buffer a cada quadro, e o three resolvia as 4 amostras do alvo inteiro depois de cada faixa. Agora o arrasto só muda a origem da imagem guardada (endereçamento circular: nenhum pixel é copiado; a tela é montada em até 4 cópias na apresentação), e cada faixa é desenhada no canto do alvo com a largura e altura do alvo reduzidas durante o desenho, então só a faixa é resolvida. O zoom desenrola a imagem uma vez quando começa depois de um arrasto. O diagnóstico ganhou a coluna "cpu" (tempo de processador por quadro, mediana) para separar processador de placa de vídeo.

## O que falta medir no Redmi 14C

Nada aqui prova 60 fps no celular. É preciso abrir a versão de teste no Redmi 14C, em Alto, com "Mostrar desempenho" ligado, e anotar o FPS parado e arrastando no panorama, no centro e na floresta. Com esses números decidimos a próxima etapa (folhas pré-calculadas, custo das sombras ou da água).

## Reprodução

- `node scripts/measure-mobile.mjs <pasta>` com `npx vite preview` rodando: triângulos e imagens por vista.
- `node scripts/compare-lod.mjs <pasta>`: imagens com e sem simplificação e diferença de pixels.
- `node scripts/profile-startup-mobile.mjs` depois de `npx vite build --outDir .tools/startup-profile --sourcemap`: perfil de CPU da abertura.
