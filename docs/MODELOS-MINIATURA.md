# Direção de arte — cidade em miniatura

Referência desta rodada: imagem fornecida em 05/09/2026, cidade isométrica com prédios azuis, coral, amarelos e rosados; hospital branco, escola de tijolos, edifício cívico com cúpula, indústria cinza e vegetação arredondada.

## Cobertura de todo o conjunto

Todos os modelos ativos de objetos do jogo foram remodelados e exportados como GLB. As superfícies extensíveis de terreno, pavimentação e rio continuam paramétricas, com paleta coordenada. A cidade mantém seu mapa e suas regras; a referência guia o estilo dos modelos.

| Grupo | Mudanças verificáveis nos GLBs |
| --- | --- |
| Quatro prédios urbanos | Fachadas nos quatro lados, molduras claras, vidros azuis, platibandas, cobertura cinza, climatização, vasos e toldos listrados. Removidas as escadas externas grandes da direção anterior. |
| Duas casas | Telhados inclinados cinza/vermelho, empenas, chaminés, varandas, janelas subdivididas, cercas e jardim. |
| Hospital | Volume branco, torre de entrada com cruz, marquise, vidraças e equipamentos na cobertura. |
| Escola | Alvenaria de tijolos, dois pavimentos, relógio, portal e cornijas claras. |
| Edifício cívico | Colunata, cobertura verde e cúpula com pináculo. |
| Fábrica | Galpão cinza, cobertura inclinada, docas, persianas metálicas, tubulações e chaminés listradas. |
| Estufa | Cobertura curva e estrutura de vidro com nervuras claras e jardineiras. |
| Árvores e arbusto | Copas contínuas e arredondadas, variação de verdes, troncos finos e flores. |
| Quatro carros | Carroceria suavizada, cabine inclinada, retrovisores, pneus, rodas, faróis e para-choques. |
| Postes, semáforos e turbinas | Perfis finos; lentes, difusores e pás afiladas. |
| Bancos e fonte | Ripas, pernas metálicas, apoios; bacia, água, coluna e jatos na fonte. |
| Ponte e quadra | Pilares, pistas e guarda-corpos; pintura azul/vermelha, cestas, linhas e alambrado. |
| Degrau e rampas | Piso definido, sinalização, guarda-corpos, tátil, madeira e cones, preservando o sentido da inclinação e o encaixe das consequências. |
| Lixo e lixeira | Sacos amarrados, papelão, papéis, abertura, tampa, etiqueta e rodas. |
| Salvador 3D e pedras | Figura arredondada com cabelo, mochila e roupas; rochas facetadas pequenas. Escala de Salvador ajustada à miniatura urbana. |

## Pipeline e desempenho

`scripts/blender/miniature_style.py` é a autoria do kit completo. `build_city.py` fornece primitivas, agrupamento por material e exportação. `bake_occlusion.py` calcula oclusão de curta distância e grava cores por vértice. `optimize-assets.mjs` reduz essas cores a 8 bits normalizados e aplica weld/dedup/prune. Não há efeito de oclusão em tempo real nem nova dependência.

Comando de reconstrução: `npm run assets:build`. Arquivos editáveis: `assets-source/*.blend`. Arquivos do jogo: `public/assets/models/*.glb`. O registry preserva os IDs anteriores e registra os novos modelos de ponte, quadra e prédio rosado.

O carregamento inicial também foi ajustado: `SceneReady` libera escolhas e seleção de problemas após os modelos carregarem e a cena renderizar. O texto narrativo continua disponível durante a espera. Isso corrige a condição em que um save restaurado permitia pedir retorno ao mapa antes de o Canvas existir. A câmera mede o tempo decorrido desde o comando com um relógio monotônico, mantendo a duração configurada quando a renderização pausa. A prontidão é estado local da interface e não altera o save, custos ou consequências. `tests/e2e/loading.spec.ts` atrasa os GLBs intencionalmente para verificar essa sequência.

Resultado medido após simplificar os chanfros de peças minúsculas: **33 GLBs, 4.388.616 bytes, 113.520 triângulos somados nos arquivos únicos**. A versão anterior desta rodada tinha 6.614.080 bytes e 224.688 triângulos. Foram preservados os detalhes, as cores e as silhuetas principais; as pranchas da versão otimizada foram renderizadas e inspecionadas. A soma dos arquivos não é a contagem de triângulos da cena: ela depende das instâncias. Construções e props repetidos compartilham geometrias e materiais. Resolução e sombras seguem os presets do jogo.

## Evidências

- `node scripts/audit-models.mjs`: verifica posições e índices válidos, normais e sombreamento exportados; grava `assets-source/model-audit.json`.
- `node scripts/capture-models.mjs`: renderiza todos os GLBs finais no Three.js. Pranchas: `docs/screenshots/models-buildings.png` (11 modelos) e `models-props.png` (22 modelos).
- `node scripts/capture.mjs desktop` e `small`: integração na cidade e na narrativa, inclusive resultado FULL.
- `npm test` e `npm run test:e2e -- --workers=1`: regressões de regras e interação.

### Estado real da validação em 05/09/2026

Auditoria final dos 33 arquivos aprovada: índices e posições válidos, normais e oclusão presentes. Pranchas finais renderizadas às 16:52 e inspecionadas depois da exportação otimizada das 16:49. **Build web final aprovado**, incluindo os modelos otimizados em `dist`. Os 22 testes unitários passaram antes da última simplificação de geometria; essa simplificação não alterou TypeScript ou regras.

A suíte com os modelos otimizados e a correção de carregamento/câmera passou: **15 testes E2E aprovados em 6,6 minutos**, incluindo a regressão com carregamento atrasado nos três viewports. Os 22 testes unitários também passaram. As capturas desktop, Pixel 7 e 360 × 640 foram concluídas e inspecionadas (17:21–17:23).

A inspeção mostrou três ajustes adicionais: elevar os bancos sobre a praça, elevar os carros que estão sobre as pontes e impedir que foco em marcadores desloque o contêiner principal. As posições foram corrigidas e `.game` passou de `overflow: hidden` para `overflow: clip`, preservando a rolagem própria do diálogo. Após a liberação do limite de execução, **as capturas finais foram concluídas e inspecionadas às 17:27–17:29**, nos três viewports. Confirmados: bancos apoiados na praça, carro acima do tabuleiro, interface e escolhas sem corte lateral, resultado FULL visível e nenhuma falha de carregamento de modelos ou erro JavaScript. `scrollX`, `scrollY` e `visualViewport.offsetLeft` permaneceram zero; largura do documento igual à viewport em 1440, 412 e 360 px. O build de produção inclui esses ajustes. Não há validação de navegador pendente desta rodada.

### Auditoria visual de fechamento

Os 11 modelos de edifícios e 22 modelos de props/personagem/consequências foram renderizados individualmente e inspecionados nas pranchas. O conjunto no jogo foi conferido em visão geral, pergunta e resultado. A comparação com a referência cobre cores vivas, fachadas com janelas claras e vidros azuis, telhados cinza/vermelho, detalhes de cobertura, edifícios públicos reconhecíveis, vegetação contínua arredondada, veículos em miniatura, mobiliário detalhado e materiais foscos com sombras. Todo objeto ativo usa o kit remodelado; terreno, pavimentação e rio permanecem paramétricos com materiais coordenados. Os 33 arquivos editáveis existem e os GLBs de produção correspondem aos arquivos otimizados. O objetivo de aproximação do estilo foi aplicado ao conjunto inteiro, sem trocar a cidade por uma imagem.

A comparação visual avalia paleta, silhuetas, proporções, coberturas, fachadas e acabamento em todos os modelos. As pranchas mostram a aproximação construída; não são a imagem de referência aplicada como cenário nem uma alegação de igualdade pixel a pixel entre uma imagem 2D e uma cena 3D. Não se adicionaram os elementos que só existem na imagem, como navio e porto, pois o pedido é remodelar o conjunto existente.

Medição de FPS em dispositivos físicos continua pendente. A ferramenta de prancha fica em `scripts/model-review.html`, acessível no servidor de desenvolvimento e fora da entrada de produção do jogo.
