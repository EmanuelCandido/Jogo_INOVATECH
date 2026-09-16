# Quarta entrega: medição e seleção espacial

## Quantas frentes faltam

Restam quatro frentes principais do plano: agrupamento, visibilidade por regiões, carregamento/memória e validação sustentada em aparelhos físicos. Medição e materiais ainda têm pendências. Os números dos relatórios de entrega não equivalem às sete frentes concluídas; quatro frentes restantes não são uma promessa de atingir 60 fps após quatro alterações.

## Perfil do renderer atual

O perfil por material agora acompanha a entrada única de quadro e inclui profundidade e cor. Antes, desligava a passagem de profundidade. Dois testes verificam a contagem de três quadros completos, seis passagens, descarte de consultas inválidas e restauração dos métodos. Esses testes e os nove de profundidade passaram antes do bloqueio posterior.

O novo perfil foi executado em quatro vistas, sem erros, com a profundidade ligada. Pinturas, folhas e pavimentos continuam entre os maiores custos. A passagem de profundidade representa cerca de um quarto do tempo somado pelas consultas. As consultas por desenho adicionam custo: usar esse perfil para localizar trabalho, não para certificar FPS. [Dados do perfil](performance/depth-material-profile/results.json).

## Experimento descartado

Foi testado desabilitar a escrita de profundidade na passagem de cor dos materiais já cobertos. As 24 comparações visuais em oito vistas foram idênticas, mas o custo de GPU não melhorou consistentemente: vista geral de aproximadamente 62,0 para 63,0 ms; centro de 26,9 para 26,7 ms; floresta de 29,6 para 29,7 ms. O experimento foi retirado dos fontes. [Medições e pixels](performance/depth-readonly-desktop/results.json).

## Candidata de visibilidade

`SpatialVisibility` organiza os limites completos das instâncias em regiões. Regiões fora da câmera são descartadas juntas; regiões inteiramente dentro são aceitas juntas. Nas bordas, continua usando o mesmo teste individual de esfera. Uma margem conservadora evita tomar decisões de região em casos tangentes.

As posições, modelos, cores e ordem de desenho continuam nos buffers originais. O índice altera apenas os indicadores de visibilidade. Lotes pequenos seguem com o caminho linear. A restauração completa dos lançadores de sombra permanece no caminho existente.

A candidata permanece **desativada por padrão**, e seu índice só é construído quando ativado pela API diagnóstica `ecoBenchmark.spatialVisibility(true)`. Os testes passaram e cobrem 160 câmeras com duas projeções, esferas tangentes, limites grandes, matrizes, cores, ordem, transformações de grupo e recuperação das sombras. A decisão de não ativar está baseada nos percursos completos abaixo.

Também foi ajustado o indicador existente para usar a média dos intervalos, em vez de converter apenas o p50 em FPS. Isso não implementa ainda a janela contínua prevista no plano e não mede apresentação de quadros.

## Retomada em 15 de setembro

A revisão automática havia bloqueado TypeScript, testes focados e build por limite de uso. Após o usuário informar a liberação, o comando foi retomado: TypeScript, Vite e os 26 testes focados passaram. Os três testes novos de seleção espacial foram executados com sucesso.

Na cidade real, quatro repetições alternadas do percurso sintético de 240 câmeras passaram com o mesmo checksum de contagens. O tempo mediano de seleção caiu de 190,3 para 170,85 ms no percurso inteiro (aproximadamente 10,2%). Os testes individuais caíram de 8.161.200 para 2.946.820 (63,9%); a hierarquia acrescentou 404.098 testes de região. Isso equivale a cerca de 0,793 → 0,712 ms de seleção por passo nesta máquina. [Dados de CPU](performance/spatial-selection-cpu/results.json).

Essa medição inclui seleção, comparação e cópia de matrizes, mas não desenha quadros. A construção inicial do índice ficou fora da janela. Portanto, demonstra menor custo de seleção após preparação e não equivale a ganho de FPS nem certificação de apresentação. As contagens iguais são verificadas adicionalmente pelos testes que comparam matrizes, cores e ordem de cada instância.

A primeira comparação desktop em duas sessões passou nas verificações de máximo, mas não demonstrou ganho de fluidez. O arrasto passou de 18,92 para 17,09 quadros/s, com GPU de 43,70 → 47,44 ms e CPU de 5,5 → 6,0 ms. O p95 dos intervalos passou de 131,7 para 127,8 ms. Os testes individuais de esfera caíram de aproximadamente 4,08 para 1,57 milhão por arrasto. Essa divergência entre a microavaliação de CPU e o percurso completo exige comparação alternada dentro da mesma sessão; a candidata continua desligada no jogo. [Resumo desktop](performance/spatial-desktop-regions/summary.json).

Das quatro capturas após navegar, duas ficaram idênticas; a floresta teve quatro pixels diferentes (máximo de quatro em um canal), e o rio, dois (máximo de um). Não são apresentadas como idênticas. A comparação na mesma cena cobre oito vistas e atualização das sombras para investigar essa diferença sem misturar sessões. [Capturas após navegação](performance/spatial-desktop-regions/image-comparison.json).

Para repetir os modos separadamente: `--depth-prepass --linear-visibility` contra `--depth-prepass`. Para alternar na mesma sessão, usar `--depth-prepass --compare-visibility` com `BENCH_RUNS=4` (linear, espacial, espacial, linear). Acrescentar `--mobile` para emulação móvel. O benchmark registra o modo de cada amostra. A comparação visual na mesma cena usa `node scripts/verify-depth-prepass.mjs NOME --spatial --captures-only`.

As alterações continuam locais, sem novo commit ou push. A build comparativa contém a candidata espacial desativada no jogo, a correção do indicador e o perfil completo; o experimento de escrita de profundidade foi retirado.

## Comparações na mesma sessão

As oito vistas desktop ficaram idênticas pixel a pixel ao alternar seleção linear/espacial, recalcular sombras e retornar ao original: 24 comparações, sem erros, com 77 modelos e 34.005 instâncias de origem. [Comparação na mesma cena](performance/spatial-eight-views/results.json). Isso não transforma as capturas entre sessões anteriores em imagens idênticas; os resultados são registrados separadamente.

Na emulação móvel, quatro percursos alternados (dois por modo) mantiveram as configurações máximas e exatamente os mesmos bytes de upload por gesto. No arrasto, a CPU p50 passou de 4,60 para 4,35 ms; GPU de 35,43 para 35,24 ms; taxa de 22,75 para 22,38/s; intervalo p95 de 155,05 para 145,40 ms. Na pinça, CPU de 4,45 para 4,10 ms; GPU de 29,34 para 28,54 ms; taxa de 29,41 para 29,77/s; p95 de 110,55 para 104,35 ms. [Comparação móvel alternada](performance/spatial-mobile-paired/summary.json).

O custo de seleção e o número de testes diminuíram, mas essas amostras ainda não mostram ganho relevante de FPS. Não se atribui aumento de fluidez sustentada a uma variação pequena. A GPU continua acima do orçamento de 16,67 ms e a meta de 60 fps permanece pendente.

O controle desktop na mesma sessão também não demonstrou melhora. No arrasto, a taxa passou de 17,30 para 16,27/s, CPU de 5,40 para 5,75 ms e GPU de 47,54 para 47,52 ms. O p95 permaneceu em aproximadamente 142,2 ms. No teclado, a taxa ficou em 18,12 → 18,05/s. Todos os arrastos usaram os mesmos 13.899.228 bytes de upload, com as verificações de máximo aprovadas. [Comparação desktop alternada](performance/spatial-desktop-paired/summary.json).

**Decisão:** conservar o caminho linear no jogo. A hierarquia passou na equivalência visual e reduz os testes individuais, mas não demonstrou ganho consistente de navegação que justifique sua ativação. O índice não é construído nem consultado na execução normal. O tempo de seleção isolado não deve ser apresentado como aumento de FPS.

## Próxima prioridade

Foi feito um inventário somente de leitura dos 77 modelos completos carregados. Das 584 primitivas, 568 têm conjuntos distintos de atributos/índices. Compartilhar as cópias exatamente iguais economizaria no máximo 77.996 bytes dos 13.750.806 bytes contabilizados (cerca de 0,57%). Isso não inclui toda a memória de GPU e não demonstra redução de chamadas; a simples deduplicação de geometria não será priorizada. [Inventário de geometrias](performance/geometry-reuse-inventory/results.json).

O próximo trabalho deve concentrar-se nos materiais visíveis e no agrupamento de geometrias diferentes com materiais compatíveis, medindo CPU/GPU e preservando as coordenadas dos acabamentos. Permanecem as quatro frentes principais do plano e os ajustes de materiais/medição; nenhuma foi declarada concluída apenas por estes experimentos.

## Estado final desta avaliação

O bloqueio de uso foi resolvido. TypeScript e os 26 testes focados passaram novamente após incluir transformações de grupo na comparação de instâncias. A build comparativa validada é `index-D3OzJYLR.js`, `World-BfVBomp3.js` e `Benchmark-ylNb8Mjy.js`.

Os três testes de navegador de `tests/e2e/graphics.spec.ts` também passaram (desktop, móvel e tela pequena, em 1,8 minuto). Eles verificam troca de qualidade durante a partida, preservação do estado e restauração das preferências. Essa execução não representa a suíte completa, teste em celular físico ou comprovação de 60 fps.

Foram mantidos o cálculo do indicador por média dos intervalos e o perfil de GPU do quadro completo. A seleção espacial fica disponível apenas para diagnóstico, desativada no jogo. Nenhum modelo, geometria de origem, resolução, densidade, efeito ou parâmetro de qualidade foi alterado nesta avaliação. Não houve novo commit ou push.
