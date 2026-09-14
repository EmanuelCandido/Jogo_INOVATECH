# Plano de otimização para 60 fps com gráficos no máximo

14 de setembro de 2026, revisado conforme a exigência do usuário de alcançar 60 fps com gráficos no máximo, preservando toda a qualidade e todos os modelos. Escopo: desktop e celulares. Esta entrega contém análise e planejamento; não aplica mudanças ao jogo nem aos modelos.

## Direção proposta

Alcançar movimentação suave a 60 fps fazendo menos trabalho para produzir a mesma cena. Priorizar arrasto, pinça, zoom, teclado e transições, preservando os modelos, sua quantidade e posição, todos os detalhes, materiais, sombras, efeitos, resolução e animações da referência.

Esta revisão substitui as propostas anteriores deste documento de LOD simplificado, materiais econômicos e modo adaptativo que reduz resolução ou qualidade. Retoma a preservação integral do plano de 6 de setembro, avançando sobre as otimizações já implementadas. As oportunidades são reorganizar o desenho, eliminar uploads e cálculos redundantes, reaproveitar recursos e preparar trabalho antes de ele interromper a navegação.

Não há modelo de celular definido. A primeira etapa deve registrar os aparelhos de referência; até lá, os limites abaixo são metas de engenharia, não uma certificação de 60 fps em qualquer dispositivo. Mantida a carga visual, o hardware continua impondo um limite. Um aparelho que não atingir a meta deve ser reportado como tal, sem baixar a qualidade para aparentar aprovação.

### Requisitos fixos de qualidade

- Manter os mesmos modelos e todas as instâncias, com geometria, posições, escalas, materiais e estados preservados. Não substituir por versões leves nem remover objetos pequenos ou distantes.
- Manter resolução interna, DPR, antialiasing, densidade, sombras, transparências, acabamento da água, folhas e demais efeitos. Não criar um controlador que reduza esses parâmetros.
- Manter frequência e velocidade das animações; não simular fluidez reduzindo a atualização de efeitos ou interpolando quadros para ocultar renderização lenta.
- Usar Ultra completo, escala de resolução em 150% e animações ligadas como referência obrigatória também nos celulares. Registrar a resolução efetiva por aparelho e mantê-la no antes/depois. Outros perfis são comparações adicionais consigo mesmos; trocar de perfil não conta como ganho nem como cumprimento da meta.
- Descartar do desenho apenas trabalho que não contribui para a imagem, preservando todos os objetos no mundo e seus efeitos indiretos, como sombras. Não usar distância ou tamanho em pixels para eliminar detalhes visíveis.
- Aceitar reorganização interna de buffers e lotes somente se mantiver a geometria e o resultado visual. Fontes e modelos originais continuam preservados.
- Exigir comparação visual antes/depois com os mesmos parâmetros. Uma mudança que introduza perda de detalhe, nitidez, sombra ou continuidade será rejeitada, mesmo que melhore o FPS.

### Configuração obrigatória: máximo disponível no jogo atual

Valores conferidos em `src/config/graphics.ts`, `src/ui/menus/SettingsPanel.tsx` e `src/app/World.tsx`. O benchmark deve verificar os valores efetivamente aplicados, além das preferências salvas.

| Parâmetro | Valor de referência |
| --- | --- |
| Qualidade | `ULTRA`, explicitamente selecionado |
| Escala de resolução | `renderScale: 150`, o máximo do controle atual |
| Sombras | `PRESET` no Ultra, resultando em mapa de 4.096 × 4.096 |
| Animação ambiente | `ambientAnimation: true` |
| Redução de movimentos | `reducedMotion: false` |
| Vegetação, flores, tráfego e visitantes | Densidades do Ultra em 100%, mantendo todas as colocações da referência |
| Detalhe, água e geometria | `cityDetail: 2`, `waterEffects: true`, `smoothGeometry: true` |
| Antialiasing | Ativado, como no renderer atual; registrar o suporte efetivo do contexto |
| Modelos | GLBs completos selecionados pelo Ultra, sem substituição por variantes leves |
| Interface | HUD, marcadores e controles visíveis durante o percurso |

A opção de sombra chamada “Detalhadas” usa 2.048 no código atual; portanto, para testar o máximo, é preciso manter “Seguir qualidade escolhida” no Ultra, que usa 4.096.

O DPR efetivo depende do dispositivo, do viewport e dos limites atuais. No Ultra, o limite inicial de DPR é 2 antes de aplicar a escala, e o teto de canvas é 6.500.000 pixels, além do limite de textura do hardware. Em 150%, o DPR desejado pode chegar a 3 antes desses tetos. Manter a fórmula e os tetos existentes; não reduzi-los para melhorar o resultado. Registrar largura e altura reais do canvas em cada execução. Medições anteriores em escala de 100% não certificam este alvo máximo.

## O que a análise encontrou

O caminho principal atual é `World → City → ReferenceCity + SituationLayers`. O trabalho deve concentrar-se nesse caminho, evitando gastar esforço em componentes antigos que não participam da cena atual.

| Constatação no código atual | Consequência |
| --- | --- |
| `AmbientFrames.tsx` já acompanha o ciclo de renderização; não existe mais o antigo temporizador ambiente de 30 Hz. | Repetir essa correção não resolverá a lentidão atual. |
| `AssetBatch.tsx` já instancia os modelos, e `ShadowCache.tsx` já reaproveita as sombras. | Melhorar a organização dos lotes existentes, preservando o conteúdo e a imagem. |
| `InstanceVisibility.select()` percorre os limites de todas as instâncias do lote quando a matriz da câmera muda, copia as matrizes visíveis e marca o buffer para upload. | Arrasto e zoom provocam trabalho que não aparece adequadamente em medições com câmera parada. Mesmo com a mesma seleção visível, os buffers são reescritos. |
| `modelLayout.ts` usa as variantes `-low.glb` somente em `MINIMUM` e `LOW`. | Fixar a seleção de modelos na referência; a otimização não recorrerá à troca por variantes leves. |
| `ReferenceWater.tsx` mantém os cálculos principais de ruído mesmo quando `waterEffects` está desligado; a opção remove a perturbação da normal. | Medir os cálculos e buscar equivalências que preservem o material completo, sem desligar efeitos. |
| `foliageMaterial.ts` calcula a pintura das folhas em três projeções. O argumento `economical` diferencia a chave do programa, mas não simplifica esse cálculo. | Investigar trabalho redundante e programas equivalentes, preservando todas as projeções que contribuem para a imagem. |
| `ReferenceCity.tsx` reúne estradas, calçadas e outras superfícies em malhas extensas por categoria. | Uma parte visível mantém uma malha extensa no desenho; avaliar divisão espacial sem perder o benefício do agrupamento. |
| `GraphicsRuntime.tsx` mede amostras curtas e mostra `1000 / p50` como FPS. `AUTO` recomenda um perfil por características do aparelho e não se adapta ao tempo medido. | Corrigir a medição e fixar as configurações no benchmark. Não introduzir ajuste automático de qualidade. |
| As setas em `useMapNavigation.ts` executam deslocamentos por eventos de teclado, passando pelo store e por um efeito. | Segurar uma tecla depende da repetição do sistema e pode parecer descontínuo mesmo com renderização rápida. |
| Pré-carga de situações e `compileAsync` já existem. | Refinar prioridade e quantidade de trabalho, em vez de adicionar outro aquecimento global concorrente. |

### Inventário de modelos para preservar a referência

Leitura direta dos GLBs atuais, somando triângulos de suas primitivas. Esses números descrevem um exemplar de cada arquivo, não o total desenhado pela cidade.

| Modelo | Triângulos completo → leve | Primitivas completo → leve |
| --- | ---: | ---: |
| Carvalho (`tree-oak`) | 964 → 964 | 4 → 4 |
| Bordo (`tree-maple`) | 964 → 964 | 3 → 3 |
| Abeto (`tree-fir`) | 468 → 468 | 2 → 2 |
| Casa coral (`townhouse-coral`) | 21.102 → 7.593 | 14 → 11 |
| Estação solar (`solar-station`) | 15.126 → 4.214 | 14 → 10 |
| Campo (`football-field`) | 10.640 → 10.238 | 10 → 10 |

Há 64 variantes no manifesto de modelos leves. Algumas árvores têm exatamente a mesma contagem de triângulos e primitivas nas duas versões. Essa constatação não será usada para propor novos modelos simplificados: a seleção original será preservada. O diretório contém 168 GLBs, totalizando 29.018.252 bytes; isso inclui variantes e não representa o download inicial nem a memória da GPU. O inventário serve para identificar repetições e oportunidades de compartilhamento sem perda.

### O histórico aponta pressão sobre a GPU

O relatório mais recente encontrado em `docs/performance/*/results.json` é de 9 de setembro: [circulation-indexed/results.json](performance/circulation-indexed/results.json). Intel UHD, Direct3D 11, navegador headless, Ultra, canvas de 1.280 × 800, animação desligada, três amostras de dez segundos por vista.

| Vista | Chamadas de desenho, primeira amostra | Triângulos, primeira amostra | Mediana entre os p50 de GPU |
| --- | ---: | ---: | ---: |
| Panorama | 635 | 4.181.000 | 54,6 ms |
| Centro | 328 | 1.174.398 | 28,6 ms |
| Mata | 338 | 1.172.355 | 34,0 ms |
| Indústria | 166 | 864.084 | 26,1 ms |
| Praia | 236 | 723.929 | 17,6 ms |
| Rio | 337 | 1.320.826 | 29,7 ms |

O orçamento de uma tela a 60 Hz é aproximadamente 16,67 ms. Esses tempos justificam investigar primeiro geometria e materiais, mas são históricos e podem incluir espera/preempção da GPU. A cópia de trabalho tem mudanças posteriores. Não foram feitas novas medições de jogabilidade nesta etapa, e os registros antigos não substituem uma medição atual em celular físico.

Também há picos altos nos intervalos de quadros históricos, inclusive com p50 próximo de 16,7 ms. A CPU registrada mede apenas a chamada de renderização, não todo o processamento de entrada, React e composição. A causa dos picos ainda precisa de trace.

## Meta e protocolo de validação

Usar uma build de produção e testar com o HUD e os marcadores visíveis. O benchmark existente usa vistas paradas, esconde a interface e só liga a animação com `--ambient`; ele precisa ser ampliado para representar a experiência de jogar.

1. Selecionar um desktop com vídeo integrado, um Android de entrada, um Android intermediário e um iPhone de referência. Registrar modelo, sistema, navegador, resolução física do canvas, qualidade e taxa da tela. Aplicar a configuração máxima especificada acima, incluindo escala de 150%; manter exatamente os mesmos valores no antes/depois de cada aparelho. Emulação móvel serve para testes de interface, não para certificar a GPU do telefone.
2. Gravar um percurso repetível: panorama → centro → mata → estação/indústria → rio/reservatório → praia → situação → retorno. Incluir arrasto contínuo, pinça, roda, tecla mantida pressionada e inversões rápidas de direção.
3. Fazer três percursos de 60 segundos por configuração após o aquecimento. Separar o primeiro carregamento e a primeira visita dos percursos aquecidos. Rodar ainda dez minutos contínuos nos celulares para detectar degradação por aquecimento.
4. Registrar intervalos p50/p95/p99, média de FPS no período, 1% low, quadros perdidos, tarefas longas, CPU completa, tempo de GPU quando disponível, chamadas, triângulos e bytes de buffers atualizados. Contagens de geometrias/texturas não são bytes exatos de VRAM.
5. Usar trace de apresentação/composição no navegador quando disponível e identificar explicitamente os aparelhos sem essa evidência. A documentação do [Chrome DevTools](https://developer.chrome.com/docs/devtools/performance/reference) distingue quadros apresentados, parcialmente apresentados e perdidos; contar callbacks sozinho não faz essa distinção.
6. Instrumentar entrada, seleção de visibilidade, cópia de buffers, submissão de desenho, preparação de recursos e GPU. Comparar caminhos antigo/novo e pré-carga ativa/adiada com o mesmo conteúdo visual. Medir separadamente o quadro que atualiza sombras. As versões diagnósticas não alteram resolução, materiais, geometria ou perfil salvo.

### Critérios para validar 60 fps no máximo por aparelho

- Alvo de 60 quadros novos por segundo durante o movimento, acompanhando a atualização nominal de 60 Hz. Registrar a frequência real da tela, inclusive 59,94 Hz; uma pequena diferença de relógio não equivale a quadros perdidos. Uma média de 58 fps não cumpre o alvo solicitado.
- Confirmar cadência pelo registro de apresentação quando disponível, reportando separadamente quadros perdidos ou repetidos e suas causas. Nas telas de maior frequência, verificar a entrega de pelo menos 60 quadros novos por segundo e a regularidade do movimento. Callback, contador arredondado e tempo de GPU isolado não certificam apresentação.
- Usar 16,67 ms como orçamento nominal por quadro. Registrar p50/p95/p99 e 1% low para revelar irregularidade. Não aprovar travamentos recorrentes do jogo acima de 33,4 ms escondidos por uma média de 60; separar eventos externos demonstrados pelo trace de falhas ainda sem causa identificada.
- Metas internas iniciais: CPU principal p95 até 6 ms e GPU p95 até 12 ms, deixando margem para o navegador. São tempos de etapas que podem se sobrepor; não devem ser somados como uma medição de apresentação.
- Arrasto e pinça acompanham o gesto sem saltos, e a tecla mantida pressionada gera movimento contínuo. Retornar de uma situação não causa recarga perceptível da cidade.
- Mesmos modelos, detalhes, resolução, sombras e efeitos, sem desaparecimento, perda visual ou alteração de quantidade; sem aumento contínuo de memória após dez voltas pelo mapa.
- A execução de dez minutos mantém os critérios com a configuração máxima. Se um aparelho não passar ou não houver evidência suficiente de apresentação, registrar a limitação ou a validação pendente; não declarar que a meta móvel foi cumprida apenas porque o teste desktop passou.

## Etapas de implementação

| Ordem | Entrega | Prioridade | Esforço relativo |
| --- | --- | --- | --- |
| 1 | Medição de movimento e correção do indicador | P0 | Médio |
| 2 | Entrada e câmera contínuas | P0 | Médio |
| 3 | Cálculos de materiais e sombras sem redundância | P0 | Alto |
| 4 | Agrupamento e compartilhamento sem alterar modelos | P1 | Alto |
| 5 | Visibilidade por regiões e uploads seletivos | P1 | Alto |
| 6 | Carregamento e memória sob orçamento | P2 | Médio |
| 7 | Validação sustentada de desempenho e equivalência visual | Obrigatória | Médio |

Depois da etapa 1, ajustar a ordem entre materiais, agrupamento e visibilidade conforme o gargalo medido. Validar cada entrega antes de ampliar sua aplicação à cidade inteira. Uma melhoria de CPU sozinha não basta quando o limite está na GPU.

### 1. Medir o movimento e tornar o indicador confiável

**Arquivos:** `scripts/benchmark.mjs`, `components/city/Benchmark.tsx`, `components/city/GraphicsRuntime.tsx`, `game/frameMetrics.ts`, `ui/hud/PerformanceReadout.tsx`.

- Ampliar o benchmark para os percursos e aparelhos definidos acima, com resolução e qualidade parametrizadas; incluir o caminho real de entrada e transições, além das câmeras diagnósticas. Criar uma execução de aceite que exija os valores máximos da tabela e rejeite configurações inferiores, modelos leves ou alteração da resolução efetiva durante a amostra.
- Manter a temporização da GPU assíncrona, descartar resultados inválidos e registrar indisponibilidade. Medir o custo da instrumentação e comparar uma execução com ela desligada.
- Trocar a leitura curta baseada apenas em p50 por uma janela contínua durante interação/animação, com atualização do HUD a cada 500–1.000 ms. Não forçar renderização contínua de uma cena ociosa só para mostrar um número.
- Nomear corretamente o que foi medido: taxa de renderização/agendamento no HUD; apresentação e perdas no relatório que tiver evidência correspondente.

**Aceite:** baseline da build atual com metadados, percurso, repetições, picos e limitações identificados. Nenhuma alegação de ganho baseada apenas no contador de FPS.

### 2. Tornar a entrada e a câmera contínuas

**Arquivos:** `game/useMapNavigation.ts`, `game/CameraDirector.tsx`, `game/frameTask.ts`, `stores/mapStore.ts`.

- Manter as teclas pressionadas em estado transitório e integrar sua velocidade pelo tempo de quadro no loop compartilhado. Limpar o movimento em `keyup`, perda de foco e ocultação da aba. Conservar os comandos pontuais dos botões.
- Preservar a consolidação de ponteiro/roda já implementada. Aplicar entrada antes da seleção de visibilidade e do desenho; verificar se há um quadro de atraso entre os agendamentos atuais.
- Reutilizar vetores e o retângulo do canvas durante o gesto, atualizando-o quando houver resize ou mudança de layout. Evitar leituras repetidas de layout e alocações no caminho quente.
- Manter limites, velocidade independente da taxa de quadros, última atualização do gesto e bloqueio de navegação durante diálogos. Não adicionar suavização que faça a câmera continuar atrás do dedo.

A documentação oficial do [React Three Fiber](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/pitfalls.mdx) recomenda atualizações transitórias por referências e tempo decorrido, evitando passar movimento contínuo por atualizações reativas de estado.

**Aceite:** mesma distância por segundo em execuções de 30 e 60 Hz; movimento contínuo pelo teclado, toque e mouse; nenhum comando preso ou reaplicado ao voltar de uma situação.

### 3. Eliminar cálculos redundantes mantendo os materiais e as sombras

**Arquivos:** `environment/ReferenceWater.tsx`, `assets/foliageMaterial.ts`, `assets/surfaceFinish.ts`, `assets/roofGrassMaterial.ts`, `assets/sharedMaterials.ts`, `environment/Beach.tsx`, `components/city/ShadowCache.tsx` e `components/city/ShaderWarmup.tsx`.

- Inspecionar os programas efetivamente compilados e medir água, folhas e acabamento. Separar operações já eliminadas pelo compilador de redundâncias que ainda custam tempo de GPU.
- Reutilizar resultados idênticos dentro do shader e pré-calcular constantes/uniformes fora do cálculo por pixel. Mover operações de estágio somente quando a interpolação preservar o resultado; ruído não linear não pode ser movido indiscriminadamente para os vértices.
- Especializar programas por condições constantes já existentes sem retirar cálculos que contribuam para a aparência. Preservar projeções de folhas, ruído, espuma, normais, brilho, transparência, precisão e estados limpo/poluído.
- Consolidar materiais e programas comprovadamente equivalentes. A chave deve considerar todas as propriedades que afetam imagem e renderização, incluindo personalizações de shader e coordenadas locais.
- Investigar trabalho de superfícies encobertas e duplicações sem remover geometria dos modelos. Qualquer alteração de ordenação ou descarte precisa preservar transparências, profundidade e todas as câmeras permitidas; abandonar o experimento se seu custo superar o ganho.
- Consolidar invalidações da sombra após mudanças reais da cidade e carregamentos. Preservar tamanho do mapa, filtro, alcance e todos os lançadores; não substituir a sombra atual por uma aproximação.
- Reaproveitar compilações e preparar programas necessários antes das transições. Não substituir texturas procedurais por imagens aproximadas nem reduzir a atualização da água.

As [boas práticas WebGL da MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) apoiam agrupamento, controle de memória, compilação paralela e evitar chamadas bloqueantes. Neste plano, as experiências ficam restritas àquelas que mantêm o resultado visual completo.

**Aceite:** redução mensurável do tempo de GPU nas vistas afetadas, com materiais e sombras visualmente equivalentes em close, panorama e movimento. Nenhum ganho presumido apenas pela redução do texto do shader.

### 4. Desenhar os mesmos modelos com menos chamadas e recursos duplicados

**Arquivos:** `components/city/AssetBatch.tsx`, `assets/sharedMaterials.ts`, carregadores de modelos, `environment/ReferenceCity.tsx` e `environment/Landscape.tsx`.

- Inventariar instâncias e primitivas por modelo/material/região. Começar por árvores repetidas, casas e estação, mantendo todos os exemplares e todos os detalhes. O maior arquivo isolado não necessariamente é o maior custo por quadro.
- Ampliar o compartilhamento de geometrias e materiais idênticos. Manter buffers estáticos e referências estáveis entre mudanças de HUD, diálogos e preferências que não alteram a cena.
- Agrupar primitivas compatíveis sem alterar sua geometria. Preservar normais, cores, oclusão, ordem relevante de transparências e as coordenadas locais usadas pelos materiais procedurais.
- Onde a diferença for exclusivamente cor, testar atributos por vértice/instância que reproduzam a mesma cor e interpolação. Não unificar propriedades físicas ou shaders distintos para reduzir chamadas.
- Comparar instanciamento existente e agrupamento de geometrias diferentes com material equivalente, por região. Considerar o suporte real do driver e manter o caminho anterior para comparação.
- Se útil, reorganizar índices e buffers sem alterar os triângulos ou seus atributos, validando a equivalência. Não aplicar decimação, quantização com perda, LOD, impostores ou remoção de partes dos modelos.
- Priorizar transformações internas no renderer, conservando os fontes e GLBs atuais. Se a implementação posteriormente exigir reexportação estrutural de um modelo, usar **Blender MCP**, conforme `AGENTS.md`: confirmar conexão, inspecionar a cena, manter fontes `.blend` em `assets-source` e GLBs em `public/assets/models`, com todos os detalhes preservados.

**Métrica:** reduzir chamadas, alocações e memória duplicada sem impor uma meta de redução dos triângulos que compõem a imagem. Triângulos enviados podem diminuir ao evitar trabalho totalmente fora da câmera; a cena e os modelos continuam completos.

**Aceite:** mesmo inventário de objetos, geometria e atributos preservados; ganho nos tempos de CPU/GPU e nenhum prejuízo visual. Reduzir chamadas só conta como melhoria se reduzir o custo medido sem regressão em outras vistas.

### 5. Reduzir o trabalho de visibilidade durante o movimento

**Arquivos:** `game/instanceVisibility.ts`, `components/city/InstanceCulling.tsx`, `components/city/AssetBatch.tsx`, `environment/ReferenceCity.tsx`, `environment/referenceGeometry.ts`, `environment/Landscape.tsx`.

- Criar uma hierarquia espacial simples: descartar regiões inteiramente fora da câmera primeiro; tratar regiões totalmente visíveis sem testar todas as instâncias; testar individualmente apenas as que cruzam as bordas. Todos os objetos continuam no mundo e reaparecem completos antes de entrar no enquadramento.
- Comparar tamanhos de região na própria escala do mapa. Regiões pequenas demais aumentam chamadas; regiões grandes demais enviam geometria desnecessária.
- Comparar identificadores/ordem da seleção antes de copiar matrizes e cores. Atualizar somente os intervalos alterados quando essa comparação compensar seu custo.
- Dividir as grandes malhas estáticas de pavimento/terreno em regiões, preservando índices compartilhados, altura, normais e continuidade nas emendas. Não reconstruir as superfícies durante a navegação.
- Preservar limites completos, incluindo copas e coberturas. A seleção da câmera e os lançadores de sombra precisam continuar separados; manter a correção existente para lançadores fora da tela.
- Reavaliar `BatchedMesh` apenas com comparação de CPU/GPU no aparelho-alvo: o protótipo existente não prova ganho em todos os drivers.

**Aceite:** menos testes/copias/uploads durante um percurso contínuo, buffers estáveis quando a seleção permanece igual, nenhuma borda vazia e nenhuma regressão relevante no panorama ou na atualização de sombras.

### 6. Controlar preparação de recursos e memória

**Arquivos:** `components/city/SituationLayers.tsx`, `components/city/ShaderWarmup.tsx`, `components/city/SceneReady.tsx`, carregadores de modelos e geração de geometria.

- Separar recursos necessários para o primeiro quadro, próximos ao enquadramento e de situações futuras. Adiar preparação não essencial durante gestos e retomar em pequenas parcelas após o movimento.
- Refinar a pré-carga já existente para priorizar a próxima região/situação; preparar modelos completos e shaders antes da transição, sem recompilar a cena inteira a cada chegada de arquivo.
- Identificar no trace custo de geração de superfícies, decodificação, upload e compilação. Pré-gerar geometria estática no build; considerar worker somente para cálculo/decodificação que realmente ocupe a thread principal.
- Evitar manter cópias duplicadas sem necessidade. Liberar apenas recursos sem usuários e dispensáveis para a cena e próximas transições, preservando geometria/material compartilhado e evitando recargas ao mover a câmera.
- Avaliar somente compressão de transporte sem perda e medir seu tempo de decode. Não reduzir resolução de texturas nem quantizar atributos com perda. Registrar separadamente redução de download, memória e tempo por quadro.

**Aceite:** primeira exploração e mudanças de situação sem picos recorrentes de preparação; memória estabilizada após percursos repetidos; ausência de contexto WebGL perdido e de modelos faltantes.

### 7. Validar a mesma qualidade em todos os aparelhos-alvo

- Repetir o protocolo no mesmo aparelho, viewport, estado de partida, instante da animação e condições de energia. Fixar os parâmetros visuais e comparar cada perfil consigo mesmo. O aceite exige Ultra completo com a configuração máxima da tabela, incluindo escala de 150%.
- Executar build, testes unitários relevantes de visibilidade/seleção, testes de navegação e situações, e verificação de renderização. Estender os testes existentes para tecla mantida, pinça, estabilidade de buffers e preservação de sombras.
- Comparar capturas equivalentes de close e panorama e gravações em movimento, cobrindo bordas da câmera, zoom máximo, transparências e estados das situações. Usar comparação de pixels no mesmo aparelho com animação congelada apenas para essa verificação; os testes de desempenho mantêm a animação ligada.
- Inventariar antes/depois modelos, quantidades, posições e atributos geométricos. Investigar qualquer diferença de imagem: aceitar apenas ruído numérico de renderização demonstrado como sem perda visual; rejeitar alteração de detalhe, cor, silhueta, sombra, nitidez ou continuidade. Uma captura de panorama sozinha não comprova equivalência em todos os enquadramentos.
- Registrar por aparelho: configuração final, baseline, resultados após cada etapa, aquecimento, memória e limitações. Publicar uma matriz de aparelhos/perfis que passaram, sem extrapolar para hardware não medido.

## Marcos de decisão

**Marco A — diagnóstico:** percurso atual e causas dos picos identificados. Escolher o primeiro gargalo por evidência.

**Marco B — resposta:** entrada contínua e primeira redução do custo de GPU funcionando em um desktop e um celular de referência.

**Marco C — trabalho reduzido:** cálculos, agrupamento e seleção espacial demonstram ganho combinado, com todos os modelos, detalhes e parâmetros visuais preservados.

**Marco D — conclusão:** critérios de 60 fps e equivalência visual cumpridos no teste sustentado dos aparelhos-alvo, com a configuração máxima registrada. Se um aparelho não cumprir, continuar no gargalo comprovado ou registrar uma limitação explícita daquele aparelho; não baixar qualidade, trocar modelos nem substituir a meta de 60 fps silenciosamente.

Uma reescrita de engine, migração para WebGPU ou instalação indiscriminada de bibliotecas não integra a primeira execução. O código e os dados disponíveis já indicam frentes concretas para reduzir trabalho no renderer atual.
