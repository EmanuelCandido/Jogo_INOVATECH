# Quinta entrega: reduzir o custo da passagem de profundidade

15 de setembro de 2026. Continuação da otimização com Ultra, escala de 150%, animações e todos os modelos preservados. Esta entrega não equivale à conclusão da quinta frente do plano; a meta de 60 fps permanece pendente.

## Ordem de desenho: não ativada

Foi comparada a ordenação dos opacos pela distância à câmera apenas na passagem de profundidade. A passagem de cor manteve seu comparador original, assim como as transparências. A restauração também foi testada em caso de exceção.

Em duas amostras por modo, alternadas na mesma sessão, os tempos medianos de GPU foram:

| Vista | Original | Ordenada por distância |
| --- | ---: | ---: |
| Geral | 70,77 ms | 71,46 ms |
| Centro | 30,95 ms | 30,00 ms |
| Floresta | 33,49 ms | 33,21 ms |

A CPU aumentou nas três vistas: 5,10 → 5,50; 4,10 → 4,50; 3,70 → 3,95 ms. As oito vistas, incluindo atualização das sombras e retorno ao original, produziram 24 comparações idênticas pixel a pixel. Os 77 modelos e 34.005 instâncias de origem foram preservados. O ganho de GPU não foi consistente e não compensou o aumento de CPU; a ordenação não será ativada. [Dados completos](performance/depth-order-desktop/results.json).

## Faces da passagem de profundidade: não ativada

A segunda candidata deixa de rasterizar os versos dos materiais de dupla face somente na passagem auxiliar de profundidade. A passagem de cor continua usando os materiais originais, com todas as faces. Materiais originalmente de frente ou verso único mantêm seu lado. Não há mudança nos índices, vértices, modelos, shaders de acabamento ou mapas de sombra.

A hipótese é gastar menos na preparação da profundidade. Faces não cobertas por essa preparação continuam desenhadas normalmente na passagem de cor. A candidata exige comparação visual e ganho no quadro completo antes de ser ativada.

Os 16 testes focados de profundidade e medição de GPU, TypeScript e Vite passaram para a build experimental `index-8Ve3TrJE.js`, `World-Cv3Tc1nC.js` e `Benchmark-C43VRe_K.js`. As duas candidatas permanecem desligadas por padrão nesta build.

Nas três vistas desktop, todas as seis comparações pareadas de GPU favoreceram a candidata. A mediana das duas amostras por modo passou de 70,94 → 68,29 ms na vista geral, 31,04 → 29,89 ms no centro e 33,65 → 32,64 ms na floresta (redução de aproximadamente 3% a 4%). As 24 comparações visuais nas oito vistas foram idênticas, sem erros. [Dados de GPU e imagem](performance/depth-front-faces-desktop/results.json).

No primeiro controle móvel alternado, o tempo mediano de GPU caiu de 35,88 → 35,39 ms no arrasto e de 29,76 → 28,22 ms na pinça. A taxa de quadros passou de 23,00 → 22,22/s no arrasto e 29,07 → 29,44/s na pinça; os p95 foram 145,90 → 153,30 ms e 108,15 → 106,60 ms. A CPU foi 4,30 → 4,10 ms e 3,95 → 3,95 ms. Todos os gestos mantiveram seus bytes de upload, chamadas e triângulos; as verificações de máximo passaram. Esse resultado não demonstra melhora de fluidez no arrasto. [Controle móvel](performance/depth-front-faces-mobile-paired/summary.json).

O controle desktop apresentou GPU de 48,00 → 47,05 ms e CPU de 5,50 → 5,90 ms no arrasto; taxa de 17,17 → 15,28/s. Os uploads e o ponto final do percurso desktop variaram entre modos, portanto não são trajetórias comprovadamente idênticas. No teclado, a taxa ficou em 17,85 → 17,93/s. [Controle desktop](performance/depth-front-faces-desktop-paired/summary.json).

Uma repetição móvel com aquecimento de 30 segundos também não confirmou ganho no arrasto: GPU de 35,41 → 35,09 ms, CPU de 4,15 → 4,35 ms, taxa de 23,23 → 22,40/s. Na pinça, GPU de 29,55 → 28,82 ms, taxa de 28,97 → 29,65/s. Os bytes de upload se mantiveram iguais por gesto. [Repetição após aquecimento](performance/depth-front-faces-mobile-warm/summary.json).

**Decisão:** manter a dupla face original na passagem de profundidade. A redução pequena de GPU não compensou os resultados inconsistentes de navegação. A candidata continua apenas diagnóstica, desligada por padrão. Estes controles são emulação de viewport/entrada móvel no desktop, não testes em celulares físicos.

## Inventário para agrupamento

A leitura das 584 primitivas dos 77 modelos não encontrou grupos internos ao mesmo modelo com material, transformação e representação dos atributos exatamente iguais. Portanto, concatenar primitivas sob essas condições não reduziria as chamadas atuais. Agrupar entre modelos exigirá preservar explicitamente as coordenadas locais dos acabamentos e as transformações de cada instância. Nenhum GLB ou fonte foi modificado. [Inventário somente de leitura](performance/compatible-batches-inventory/results.json).

## Agrupamento entre modelos: não ativado

O protótipo diagnóstico usa `BatchedMesh` apenas para modelos com uma instância, material compartilhado, atributos compatíveis e transformação de grupo identidade. Mantém as matrizes originais e adiciona o suporte à matriz de agrupamento nos acabamentos em coordenadas do mundo. Não altera o instanciamento da floresta. Os meshes originais ficam disponíveis para restauração; suas geometrias e materiais não são descartados.

A primeira versão excluía atributos intercalados e não formou lotes. A coleta `isolated-models-desktop` registrou zero alterações; seus números não representam desempenho de agrupamento. O protótipo foi corrigido para suportar esses atributos, com testes de equivalência exata dos componentes de posições e cores normalizadas. O benchmark agora exige que ao menos um lote seja formado antes de aceitar a medição.

A versão com atributos intercalados reuniu 161 partes em 19 lotes. Na vista geral, as chamadas passaram de 1.267 para 1.039; centro, 651 → 615; floresta, 674 → 640. As 24 comparações visuais foram idênticas, incluindo a atualização das sombras. Mesmo assim, o custo de CPU aumentou e o de GPU não melhorou consistentemente. [Primeira comparação válida](performance/isolated-models-interleaved/results.json).

Foi acrescentado um cache de seleção para os lotes imutáveis, invalidado quando mudam projeção, visão, transformação do lote ou câmera de sombra. Quatro testes verificam matrizes, componentes intercalados/normalizados, recuperação após sombras e restauração dos recursos originais. Na nova coleta, 24 comparações visuais permaneceram idênticas.

| Vista | GPU original → agrupada | CPU original → agrupada |
| --- | ---: | ---: |
| Geral | 62,21 → 62,18 ms | 5,60 → 5,85 ms |
| Centro | 26,92 → 27,25 ms | 4,25 → 5,05 ms |
| Floresta | 29,79 → 29,85 ms | 3,75 → 4,65 ms |

São medianas de duas amostras por modo, alternadas na mesma sessão. Não comparar os valores absolutos desta sessão com os da anterior para atribuir ganho ao cache. [Comparação com cache de seleção](performance/isolated-models-cached/results.json).

**Decisão:** não ativar esse agrupamento. Menos chamadas não compensaram os custos adicionais nesta GPU. Os três experimentos desta entrega continuam disponíveis somente para diagnóstico; não alteram o jogo normal. Nenhuma das quatro frentes principais restantes foi declarada concluída por esses testes. O trabalho seguinte concentra-se nos cálculos repetidos do material de folhas.
