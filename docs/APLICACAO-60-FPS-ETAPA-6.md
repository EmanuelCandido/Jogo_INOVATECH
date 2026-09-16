# Sexta entrega: cache numérico do material de folhas

15 de setembro de 2026. Avaliação concluída, com Ultra e escala de 150%. As duas variantes preservaram a imagem, mas não melhoraram o desempenho. Permanecem desligadas; a meta de 60 fps ainda não foi atingida.

## Hipótese

As folhas repetem o mesmo hash para coordenadas inteiras em seis avaliações por fragmento. A candidata calcula esses números uma vez na própria GPU e os guarda em uma tabela R32F de 128 × 128, com 65.536 bytes de valores. Uma consulta por texel recupera o valor; coordenadas fora da tabela continuam usando a expressão original.

Isso não substitui a pintura por uma textura de menor resolução. Forma, nervuras, filtros e as três projeções continuam calculados como antes. O experimento é ativado somente pela API diagnóstica `ecoBenchmark.leafHashes(true)` e afeta os oito materiais de folhas compartilhados da referência. Nenhum modelo ou parâmetro de qualidade foi alterado.

## Validação visual e ciclo de vida

A primeira comparação encontrou uma falha após recriar a tabela: o programa compilado pela Three conservava o sampler da textura liberada. A primeira ativação ficou idêntica; as seguintes alteraram o padrão. Essa versão foi rejeitada. [Coleta com a falha](performance/leaf-hashes-images/results.json).

A correção mantém o objeto do uniform estável por material e atualiza sua textura quando a tabela é recriada. Quatro testes, incluindo as duas variantes de formato, verificam restauração dos callbacks, estados do renderer e alvo anterior, falha durante preparação, descarte idempotente e a referência de um programa reutilizado sem nova chamada a `onBeforeCompile`.

Depois da correção, as oito vistas produziram 24 comparações idênticas pixel a pixel, incluindo atualização das sombras e retorno ao original. Os 77 modelos e 34.005 instâncias de origem foram preservados; nenhum erro de navegador foi registrado. [Comparação corrigida](performance/leaf-hashes-reuse-images/results.json).

A build dessa comparação é `index-Brk253sm.js`, `World-CGXpFH7l.js` e `Benchmark-D8NOnA0j.js`.

## Resultado da tabela de hashes

Com animações ligadas, a mediana das duas amostras por modo passou de 61,70 → 63,15 ms de GPU no panorama; 26,43 → 26,70 ms no centro; 29,34 → 30,17 ms na floresta. Consultar a tabela custou mais que recalcular somente o hash nesta GPU. [Tempos pareados](performance/leaf-hashes-timing/results.json).

## Tabela com quatro valores por folha

A segunda variante guarda também `cos(angle)`, `sin(angle)` e `sin(seed*31.)`, em RGBA32F: 262.144 bytes de valores. A mesma consulta recupera os quatro resultados; a expressão original continua sendo usada fora da tabela. O código mantém a multiplicação final no local de uso para preservar a ordem das operações.

As 24 comparações nas oito vistas também foram idênticas, incluindo recriação da tabela, atualização das sombras e retorno ao original. Os 77 modelos e 34.005 instâncias foram mantidos, sem erros de navegador. [Comparação visual](performance/leaf-cells-images/results.json). Build: `index-B343IdoS.js`, `World-pbGO468s.js` e `Benchmark-P4YoVjzK.js`.

Os tempos de GPU também não justificaram ativar essa variante: panorama, 69,45 → 73,77 ms; centro, 30,15 → 31,19 ms; floresta, 34,11 → 35,02 ms. A consulta à textura não trouxe economia no quadro completo. As coletas de tempo usam animações ligadas e duas amostras por modo em ordem alternada; as capturas fixas são coletadas separadamente. [Tempos pareados](performance/leaf-cells-timing/results.json).

**Decisão:** manter os cálculos originais das folhas no jogo. Os caches são apenas diagnósticos. Estas medições foram feitas na Intel UHD do desktop; não certificam desempenho em celulares físicos. A próxima frente trata a preparação de recursos durante a navegação.
