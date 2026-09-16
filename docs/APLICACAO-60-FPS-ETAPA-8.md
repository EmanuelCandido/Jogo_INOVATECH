# Oitava entrega: memória dos limites de visibilidade

15 de setembro de 2026. A meta permanece 60 fps no máximo, com os modelos e a qualidade completos. Validação funcional concluída; aceite de desempenho suspenso para a auditoria solicitada pelo usuário.

## Implementação

Os limites das 34.005 instâncias eram guardados como 34.005 objetos `Sphere`, cada um com seu próprio `Vector3`. Agora cada lote usa um `Float64Array` com quatro números por instância: centro e raio. São 1.088.160 bytes de dados numéricos para os limites da cidade. Uma única esfera temporária por lote calcula os limites na inicialização; os 68.010 objetos individuais deixam de ficar residentes.

A precisão continua sendo a dos números JavaScript originais. Não há conversão para Float32, arredondamento, redução de raio ou margem de descarte. A interseção conserva a ordem das operações e a comparação estrita da Three instalada. Matrizes, cores, ordem das instâncias, modelos e lançadores de sombra permanecem iguais. A seleção espacial diagnóstica também lê o mesmo armazenamento; continua desligada na rota normal.

O controle de referência existe somente na rota opcional de benchmark. Ele reconstrói as esferas antigas a partir da geometria e das matrizes originais, sem usar os valores compactos como referência. Ao alternar o controle, restaura os buffers completos e força a próxima seleção. Nenhuma esfera desse controle é criada no jogo normal.

## Protocolo

`scripts/benchmark-exploration.mjs` inicia uma página com uma partida válida já configurada no máximo. O cache de rede dessa página é desativado. Uma página de preparação obtém a partida pelas regras do próprio jogo; ela pode aquecer o cache do driver, que não é controlado. Portanto, o teste não representa uma GPU com cache completamente frio.

A primeira exploração começa após o primeiro quadro interativo e a sombra de 4.096. Há aproximação e quatro arrastos reais, seguidos de afastamento. Depois de concluir as filas opcionais, o teste repete o percurso uma vez como referência aquecida e mais dez vezes. Todos os percursos mantêm animações, interface, resolução e parâmetros máximos. Esse trajeto não visita necessariamente todas as regiões da cidade nem cobre mudanças de situação.

O teste registra tarefas longas, tempos de quadro, CPU do trecho de renderização, GPU, estado da preparação, inventário e os contadores de memória do isolate pelo CDP. A coleta de lixo forçada ocorre entre percursos, na referência aquecida e após as repetições cinco e dez. O heap, os buffers externos e os recursos da Three são apresentados separadamente; não representam a memória total do processo nem a VRAM.

As coletas desktop usam canvas de 1.920 × 1.200; o perfil móvel emulado usa 1.170 × 2.532 e eventos reais de toque. Ambos executam na GPU Intel UHD do computador. Não há medição em celular físico nem verificação de quadros apresentados na tela.

## Validação de código

Passaram 56 testes em dez arquivos, incluindo cinco novos testes dos limites: preservação exata de doubles e independência da esfera temporária; tangência e valores vizinhos que Float32 arredondaria; transformações com reflexões, escalas e cisalhamento; equivalência com a Three em 128 câmeras de duas projeções; e lote vazio.

Os testes existentes continuam cobrindo matrizes, cores, ordem, retorno de objetos à câmera, uploads pendentes, restauração das sombras e equivalência da seleção espacial. A referência do teste de percurso passou a ser construída independentemente dos limites usados pela implementação.

TypeScript e build de produção passaram: `index-GiQp-WwG.js`, `World-CzjyXtPw.js` e `Benchmark-Dk6wFzHo.js`. Fontes Blender, modelos GLB e dados de colocação não foram alterados.

## Resultados

O controle na mesma sessão alternou seis vezes cada implementação após aquecimento. Em um percurso sintético de 240 posições, a mediana da seleção foi 250,55 ms com esferas e 200,65 ms com dados compactos, redução de 19,9%. As doze execuções fizeram 8.161.200 testes de esfera cada e produziram o mesmo checksum de contagens. Esse controle usa uma função diagnóstica para encaminhar a interseção à Three; não é uma comparação entre dois executáveis antigos, nem mede renderização, apresentação ou FPS.

As oito vistas passaram em três comparações cada: dados compactos, recálculo das sombras e retorno ao controle original. As 24 comparações tiveram zero pixels diferentes. As imagens são de animações congeladas, separadas dos percursos animados. Panorama e aproximações também foram inspecionados visualmente. [Controle de seleção e imagens](performance/packed-bounds-controls/results.json).

As quatro coletas de exploração terminaram sem erros, preservando modelos, instâncias, buffers fonte e parâmetros de máximo. Cada uma incluiu primeira exploração, referência aquecida e dez repetições, com 3,4 a 4,2 minutos de navegação efetivamente medidos. O observador de tarefas longas estava disponível e registrou zero tarefas acima de 50 ms nos intervalos medidos. Isso não significa ausência de quadros lentos: os percentis de quadro continuam elevados, e o trecho anterior à primeira interação não faz parte desses intervalos.

| Perfil | Heap após coleta, antes | Heap após coleta, compacto | Buffers externos, antes → compacto | Economia na soma desses dois contadores |
| --- | --- | --- | --- | --- |
| Desktop, referência aquecida | 38,44 MB | 34,83 MB | 46,43 → 47,50 MB | 2,54 MB |
| Desktop, após dez repetições | 38,95 MB | 35,33 MB | 46,42 → 47,50 MB | 2,54 MB |
| Móvel emulado, referência aquecida | 38,08 MB | 34,72 MB | 46,42 → 47,50 MB | 2,28 MB |
| Móvel emulado, após dez repetições | 38,03 MB | 35,01 MB | 46,42 → 47,50 MB | 1,94 MB |

Valores em MB decimais. A soma permite acompanhar a troca de objetos por buffers externos; não é a memória total do jogo. Na versão compacta, o heap cresceu 0,50 MB no desktop e 0,29 MB no móvel emulado entre a referência aquecida e a décima repetição. Os buffers externos permaneceram praticamente constantes. O desktop manteve 643 geometrias, quatro texturas e 62 programas; o perfil móvel manteve 633, duas e 59, respectivamente, após o aquecimento. As referências anteriores tinham os mesmos inventários por perfil. [Resumo reproduzível das quatro coletas](performance/packed-bounds-summary/results.json).

A fila ainda estava pendente na primeira exploração e terminou antes da referência aquecida, com 26 unidades de pré-carga e 731 unidades de shader. As duas versões já usam a fila incremental da etapa sete; essa comparação não isola o ganho dessa fila em relação ao aquecimento antigo de toda a cena.

Na comparação entre sessões, a mediana das dez repetições desktop passou de 20,04 para 18,35 fps, acompanhada de GPU de 42,70 para 47,43 ms. No móvel emulado, passou de 23,51 para 24,35 fps, com GPU de 35,73 para 35,61 ms. A variação oposta motivou um controle adicional na mesma sessão. Esses números não foram tratados como ganho de FPS da compactação nem a causa da diferença desktop foi presumida.

O primeiro controle alternado de desktop também mostrou uma limitação do protocolo antigo de entrada: cada um dos 120 eventos aguardava a resposta do navegador antes da pausa de 16 ms. O arrasto durou 12,6–14,6 segundos com a referência, contra 10,1–10,5 segundos com os limites compactos. Houve 207–240 intervalos de quadro no primeiro caso e 160–161 no segundo. Portanto, o trajeto espacial era o mesmo, mas sua duração não. As medianas de 16,48 e 15,46 fps desse controle não foram usadas para estabelecer o efeito da compactação. No teclado, cuja duração já era fixa, as medianas foram 18,37 e 18,51 fps. [Primeiro controle e seus intervalos](performance/packed-bounds-navigation-desktop/results.json).

O script ganhou a opção `--timed-input`: a posição do gesto passa a depender do tempo decorrido, com seis segundos por arrasto e quatro por pinça. A resposta do navegador pode variar o número de eventos entregues; o script registra quantidade e duração real. Para o controle de limites, também coleta lixo e estabiliza a cena entre repetições, fora da medição, evitando que as esferas temporárias descartadas pelo diagnóstico contaminem o percurso seguinte. O protocolo anterior continua disponível para reproduzir as coletas históricas.

O controle desktop com duração fixa terminou com quatro repetições por implementação, alternadas em ordem invertida. Os arrastos duraram 6,10–6,17 segundos em ambas. As medianas foram 16,40 → 16,54 fps no arrasto e 18,16 → 18,29 fps no teclado; GPU de 47,50 → 47,07 ms e 47,11 → 47,27 ms, respectivamente. O p95 de quadro passou de 141,00 para 145,05 ms no arrasto e de 63,95 para 66,05 ms no teclado. As pequenas diferenças não estabelecem um ganho de FPS; o custo de GPU permanece muito acima do orçamento. O controle não reproduziu a redução de 6,2% do contador observada no arrasto de duração variável. [Controle desktop com duração fixa](performance/packed-bounds-timed-desktop/summary.json).

O controle móvel emulado terminou com quatro repetições por implementação. No arrasto, a mediana passou de 22,05 para 20,71 fps, queda de 6,1%, apesar de GPU de 35,45 para 35,04 ms e CPU de 4,40 para 4,35 ms. Na pinça, passou de 29,69 para 30,03 fps. Essa divergência continua sem causa estabelecida: os eventos entregues e os tempos de quadro precisam ser examinados, e a candidata não está aprovada como melhoria de FPS. [Controle móvel com duração fixa](performance/packed-bounds-timed-mobile/summary.json).

Os testes de navegador finalizaram com dez aprovações e dois casos de teclado físico intencionalmente ignorados nos perfis móveis, sem falhas. Cobriram carregamento, gráficos e navegação na build identificada acima. Não validam automaticamente as alterações posteriores de interface. [Relatório funcional](performance/packed-bounds-e2e/results.json).

A repetição móvel longa que estava prevista não chegou a gerar resultado. O usuário pediu uma auditoria do conjunto antes de continuar. A economia de memória não deve ser apresentada como ganho de FPS; a prioridade passa a ser comparar os renderizadores anterior e atual em Chrome visível, na Intel UHD e na RTX 3050, em Full HD e máximo, com medições principais sem consultas de GPU.

As alterações permanecem locais, sem novo commit ou push. O checkpoint anterior à aplicação do plano já havia sido enviado.
