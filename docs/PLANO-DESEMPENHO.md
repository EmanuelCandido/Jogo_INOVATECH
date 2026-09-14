# Plano de desempenho com qualidade e densidade preservadas

Planejamento de 6 de setembro de 2026. Nenhuma otimização de produção foi aplicada nesta etapa. A análise usa o código atual e o [inventário dos modelos](performance-inventory.json).

Aplicação posterior: [mudanças implementadas, medições e limites de validação](DESEMPENHO-IMPLEMENTADO.md).

## Objetivo e critérios fixos

Maximizar a fluidez mantendo a cidade atual: os mesmos modelos, quantidades, posições, acabamento, sombras, água e vegetação. A referência principal será Ultra com densidade completa, resolução fixa e animações ligadas. Outros perfis serão comparados consigo mesmos. A otimização não poderá alterar automaticamente esses parâmetros para atingir a meta.

O alvo será acompanhar a atualização da tela quando o hardware permitir: 60 FPS correspondem a 16,67 ms por quadro; 120 FPS, a 8,33 ms; 144 FPS, a 6,94 ms. A taxa entregue também depende da GPU, CPU, resolução, navegador e temperatura. O agendamento pelo navegador normalmente acompanha a atualização do monitor. Não é possível prometer um FPS único para qualquer dispositivo mantendo a mesma carga visual. [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

As mudanças iniciais conservarão a geometria e os materiais. Experimentos que mudem sua representação — por exemplo, transformar cálculos de textura em imagens — só poderão entrar se passarem pela comparação visual em todas as distâncias de câmera. Reduzir árvores, veículos, flores, moradores, resolução ou qualidade das sombras não contará como otimização neste trabalho.

## Diagnóstico atual

| Evidência verificada | Implicação para o plano |
| --- | --- |
| `AmbientFrames.tsx` solicita atualizações a cada `1000 / 30` ms. | A animação ambiente, sozinha, é agendada em cerca de 30 Hz. Câmera e outras invalidações podem solicitar mais quadros. |
| `AssetBatch.tsx` já usa `InstancedMesh`; `City.tsx` divide a floresta em células de 12 unidades. | Instanciamento e divisão espacial já existem. É preciso melhorar sua organização, em vez de apenas adicioná-los novamente. |
| A floresta principal completa tem 3.589 instâncias, 572 grupos de célula/modelo e 1.887 primitivas de material nesses grupos. | Há fragmentação em muitas chamadas potenciais. Esse total é um inventário, não a quantidade efetivamente desenhada por quadro; o descarte pela câmera reduz o conjunto visível. Jardins e árvores de outras camadas não estão nessa contagem. |
| Casas e torres representativas possuem 13–14 primitivas de material por modelo. | Vários objetos instanciados ainda geram muitas chamadas devido à separação dos materiais. |
| Edifícios, adereços urbanos e alguns detalhes são agrupados por tipo em regiões extensas. | Uma parte visível pode manter um grupo grande ativo, enviando instâncias fora da câmera para processamento. |
| `ShadowCache.tsx` já mantém `autoUpdate=false`. | A sombra estática já é reaproveitada; a prioridade é evitar invalidações e uploads desnecessários. |
| A camada de folhas calcula padrões em três projeções por fragmento, mesmo antes de aplicar o desvanecimento à distância. | É uma hipótese de custo de GPU a medir, especialmente nos closes da mata. O compilador pode eliminar parte do trabalho; apenas ler o shader não quantifica o gargalo. |
| O catálogo completo tem 77 modelos, 15.351.964 bytes e 369.962 triângulos únicos. | Os triângulos únicos e o tamanho dos arquivos não representam a carga da cena instanciada nem o FPS. Existem ainda 45 variantes leves. |

O registro histórico de Alta tem 1.452 chamadas e 3.652.882 triângulos na câmera usada naquela revisão. Ele antecede os últimos polimentos e mede renderizações síncronas com `gl.finish()` em SwiftShader. Serve como histórico, não como benchmark atual de jogabilidade ou previsão de FPS.

## Sequência de implementação

### 1. Criar uma medição confiável e repetível

**Entregas:** benchmark de produção, relatório por câmera e painel de tempo por quadro.

- Usar a versão compilada, com as configurações e a quantidade de objetos fixadas. Registrar resolução real do canvas, versão do navegador, GPU disponível e taxa da tela.
- Medir panorama, centro denso, mata, porto, praia e situação em foco; incluir arrasto, zoom, ida/volta de uma situação e ativação das ondas.
- Separar carregamento inicial, aquecimento de shaders e navegação já aquecida. Fazer três execuções de 30 segundos por percurso; acrescentar uma execução sustentada de cinco minutos no celular.
- Registrar FPS apresentado, tempos p50/p95/p99, média dos 1% de quadros mais lentos, chamadas, triângulos e memória estimada. Contagens de `gl.info.memory` não serão apresentadas como bytes exatos de VRAM.
- Medir CPU e GPU separadamente quando a extensão de temporização estiver disponível. Ler resultados de GPU de forma assíncrona e descartar amostras inválidas; se a extensão faltar, registrar essa limitação. Não inserir `gl.finish()` no percurso normal de medição. [Khronos: temporização WebGL 2](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/).
- Identificar se cada câmera está limitada pela CPU, geometria, materiais, transparência ou atualização de sombras antes de escolher a próxima otimização.

**Aceite:** repetir a mesma sequência sem alterar a partida ou a densidade; relatório identifica hardware, configurações e variabilidade das amostras.

### 2. Liberar a taxa de quadros e eliminar atualizações redundantes

**Prioridade alta, risco baixo a moderado.** Arquivos principais: `AmbientFrames.tsx`, `GraphicsRuntime.tsx`, `City.tsx`, `AssetBatch.tsx` e `useMapNavigation.ts`.

- Substituir o agendamento ambiente de 30 Hz por solicitações alinhadas ao próximo quadro, enquanto houver animação ou interação. Manter renderização sob demanda quando tudo estiver parado e suspender trabalho em abas ocultas.
- Usar tempo transcorrido para animações, preservando sua velocidade em telas de 60, 120 e 144 Hz. Evitar saltos ao retomar uma aba.
- Consolidar movimentos de ponteiro e roda em uma atualização por quadro, acumulando os eventos sem perder deslocamento ou precisão do zoom.
- Estabilizar arrays de colocações e separar a cidade estática das mudanças das situações. Hoje a expressão que junta edifícios e adereços cria um novo array quando `City` renderiza, podendo disparar reagrupamento e uploads.
- Atualizar matrizes e cores apenas dos grupos alterados. Congelar atualizações automáticas de transformações somente nos nós comprovadamente estáticos, com invalidação explícita quando necessário.
- Manter medições do painel fora de atualizações frequentes da interface; não usar o ajuste automático que baixa o perfil como mecanismo para cumprir a meta deste plano.

**Aceite:** mesma câmera, mesma velocidade de animação e mesmos modelos; nenhuma reconstrução dos buffers estáticos ao abrir uma pergunta ou alterar uma preferência que não muda a cena. Em hardware com folga, a animação deixa de ficar limitada pelo agendamento ambiente de 30 Hz.

### 3. Reduzir chamadas de desenho preservando os objetos

**Prioridade alta, impacto potencial alto nas cenas limitadas pela CPU.** Arquivos principais: `AssetBatch.tsx`, `Landscape.tsx`, `DetailedLayer.tsx` e pipeline de exportação.

- Criar um registro compartilhado de geometria e materiais realmente equivalentes. A chave precisa considerar cor, rugosidade, metal, transparência, lado, sombras, shader e demais parâmetros, não apenas o nome do material.
- Agrupar partes compatíveis por família de material e região. Onde a diferença for apenas cor, avaliar cor por vértice/instância, preservando o sombreado de contato já exportado.
- Manter instâncias para repetições do mesmo modelo. Prototipar `BatchedMesh` para geometrias diferentes com material compatível e comparar com o caminho atual na versão instalada do Three.js. A API oferece descarte individual pela câmera, mas seu benefício precisa ser medido também onde não há suporte eficiente a multi-draw. [Three.js: BatchedMesh](https://threejs.org/docs/pages/BatchedMesh.html).
- Preservar a posição local usada nas texturas de folhas, madeira e vidro ao transformar ou reunir geometrias. Reagrupar não pode deslocar o padrão das texturas ou modificar normais e oclusão.
- Começar por um conjunto de árvores e uma quadra residencial, validar e só então ampliar a transformação.

**Aceite:** mesmos objetos e triângulos visíveis, redução demonstrada no custo de CPU e nenhuma piora no tempo de GPU ou no p95. Não escolher uma solução apenas porque o contador de chamadas ficou menor.

### 4. Aperfeiçoar o descarte do que está fora da câmera

**Prioridade alta, maior potencial durante zoom e deslocamento.** Arquivos principais: `City.tsx`, `AssetBatch.tsx`, `Landscape.tsx`, `Infrastructure.tsx` e camadas de detalhes.

- Estender a organização espacial aos edifícios, jardins, pavimentos, veículos e mobiliário. Comparar tamanhos de célula, inicialmente 12, 18 e 24 unidades, equilibrando chamadas e geometria enviada.
- Usar limites reais que incluam copas, coberturas, altura dos prédios e objetos que atravessam uma célula. Os cálculos de limites acontecem quando os dados mudam.
- Manter todos os objetos existentes no mapa e residentes quando apropriado; retirar apenas seu envio para desenho quando inteiramente fora da área visível. Não cortar pela distância do centro da árvore ou do prédio.
- Tratar a câmera e a luz separadamente: um objeto fora da tela ainda pode projetar uma sombra dentro dela. Preservar os lançadores necessários e a sombra em cache.
- Recalcular a seleção visível apenas quando câmera, viewport ou conteúdo mudarem, com estruturas e buffers reutilizáveis.

`InstancedMesh` possui limites para o conjunto. Isso explica por que o tamanho dos grupos influencia o descarte e precisa ser calibrado. [Three.js: InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html).

**Aceite:** nenhuma árvore, sombra ou construção desaparece na borda; câmera aproximada processa menos geometria fora da tela, e o panorama não sofre regressão pelo excesso de grupos.

### 5. Reduzir o custo de materiais e sombras

**Prioridade condicionada ao perfil de GPU.** Arquivos principais: `surfaceFinish.ts`, `foliageMaterial.ts`, `roofGrassMaterial.ts`, `WaterMaterial.tsx`, `Beach.tsx` e `ShadowCache.tsx`.

- Especializar shaders por superfície e remover trabalho comprovadamente redundante. Investigar primeiro folhas e terrenos que ocupam grandes áreas da tela.
- Testar pré-cálculo de partes estáticas das texturas, com resolução suficiente para o maior zoom, mipmaps e variação que preserve o aspecto atual. Comparar o custo de leitura de textura com o cálculo procedural; a troca não será automática.
- Manter normais, nervuras, contraste suave, brilho, espuma e movimento existentes. Verificar repetição, mudança de cor e cintilação em movimento.
- Consolidar as invalidações de sombra depois de um conjunto de carregamentos ou de uma transformação da situação. Não atualizar o mapa de sombras por mudança apenas de texto ou HUD.
- Preservar a resolução e o filtro das sombras durante a comparação. Não introduzir uma segunda renderização permanente da cidade para reflexos.
- Examinar transparências da praia e efeitos locais para evitar desenhar várias camadas no mesmo pixel. A escolha será orientada por medição de GPU. [MDN: boas práticas WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

**Aceite:** ganho mensurado nas câmeras afetadas e imagens equivalentes em close e no panorama. Qualquer alteração perceptível de textura ou sombra impede a adoção daquela experiência.

### 6. Reduzir travamentos de carregamento e consumo de memória

**Prioridade posterior ao custo por quadro.** Arquivos principais: carregamento de assets, `SceneReady.tsx`, `modelLayout.ts` e `optimize-assets.mjs`.

- Reaproveitar buffers e materiais compatíveis; evitar upload repetido de modelos e compilações idênticas.
- Preparar shaders e recursos das próximas regiões de forma gradual, antes de uma aproximação da câmera, sem congelar a interface nem deixar buracos no mapa.
- Avaliar reordenação de índices, compressão de transporte sem perda e distribuição dos arquivos. Compressão lossy, quantização e texturas comprimidas só entram mediante validação específica de fidelidade.
- Verificar residência simultânea das variantes e liberação de recursos sem referências. Não descartar geometrias ou materiais ainda compartilhados.

**Aceite:** menos picos ao carregar e explorar, sem objetos ausentes, perda de contexto ou crescimento contínuo de memória. Ganho de download será registrado separadamente de ganho de FPS.

## Proteção da qualidade

Cada etapa deve entregar uma comparação antes/depois com:

1. Identificadores, quantidades, posições e estados dos objetos preservados. A floresta principal de referência mantém suas 3.589 instâncias; as demais camadas também terão seus inventários fixados no benchmark.
2. Mesma câmera, resolução, luz, perfil e instante da animação. A comparação automatizada de pixels localiza diferenças; inspeção ampliada confirma silhuetas, texturas, sombras e espuma.
3. Percursos contínuos de câmera para revelar desaparecimentos, mudanças bruscas ou cintilação que uma captura estática não mostra.
4. Tempos p50/p95/p99 e memória antes/depois no mesmo dispositivo. Aceitar ganhos maiores que a variação normal das execuções, sem regressão material nos outros cenários.
5. Testes existentes de implantação, situações e navegação, mais testes focados nas novas regras de agrupamento e visibilidade.

A validação final deve cobrir desktop com GPU dedicada, desktop com GPU integrada e celular físico. Emulação de viewport verifica layout e interação, mas não substitui a medição no hardware móvel. Os registros anteriores em SwiftShader continuam úteis para regressões de renderização, não para certificar o FPS desses dispositivos.

## Ordem recomendada e limites

Começar pela medição, corrigir o agendamento e os uploads, testar agrupamento e descarte espacial juntos, depois trabalhar no gargalo de GPU que restar. Concluir com carregamento, memória e medições sustentadas.

As primeiras melhorias não dependem de novos modelos simplificados, redução de densidade ou migração de engine. Uma reescrita para WebGPU, descarte por oclusão e níveis de geometria por tamanho na tela são pesquisas posteriores, caso o benchmark ainda demonstre necessidade. Não integram o compromisso inicial de preservar as representações atuais.

O resultado esperado desta etapa é um renderer que faz menos trabalho para apresentar a mesma cidade. Ganhos numéricos serão registrados à medida que cada mudança for implementada e medida; não há estimativa confiável de multiplicação de FPS antes desse benchmark.
