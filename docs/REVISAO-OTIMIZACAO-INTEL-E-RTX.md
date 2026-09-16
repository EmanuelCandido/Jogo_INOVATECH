# Revisão da otimização: Intel UHD, RTX 3050 e celulares

**Prioridade alterada pelo usuário em 16/09:** foco completo nos aparelhos fracos; RTX fica para o final. A candidata de escolha automática foi isolada em `?benchmark=1&renderPathTrial=1` e não está ativa na partida normal. A integrada mantém a passagem de profundidade do Ultra. A próxima frente passa a ser o custo de GPU na Intel UHD descrito no item 2, antes de retomar o item 1.

**Retomada em 16/09 após a publicação permanente:** [diagnóstico atualizado](DIAGNOSTICO-INTEL-APOS-PUBLICACAO.md) concluiu a primeira entrada com trace, cerca de 60 segundos de navegação sem consultas de GPU e perfis separados por material. A GPU continua dominante; o cálculo das folhas é a próxima hipótese isolada em avaliação. A versão pública está em https://emanuelcandido.github.io/Jogo_INOVATECH/.

15 de setembro de 2026. Esta revisão substitui a sequência de implementação do plano anterior. Motivação: queda de FPS relatada no Chrome, em Full HD, num i5 de 13ª geração com RTX 3050, e melhora ao aproximar a câmera. A Intel UHD integrada é um alvo obrigatório, por solicitação do usuário.

## Decisão

Interromper a sequência de micro-otimizações como caminho presumido para 60 fps. Primeiro corrigir a escolha da passagem de profundidade e medir o gargalo restante na integrada. Menos objetos JavaScript, uploads ou chamadas não contam como ganho de FPS sem melhora do quadro completo.

O requisito continua sendo o máximo real do jogo: Ultra, escala de 150%, sombras de 4.096, todos os modelos e instâncias, materiais, animações e densidades. Nenhuma proposta desta revisão usa redução de resolução, modelos leves, remoção de detalhes ou redução da frequência das animações.

## O que foi feito e o que os dados sustentam

| Entrega anterior | Situação verificada | Decisão atual |
| --- | --- | --- |
| 1: uploads seletivos, entrada e indicador | Menos cópias/uploads; movimento de teclado por tempo; média de FPS corrigida. Pouco ganho de FPS nos ensaios antigos. | Manter as correções funcionais; não somar economia de CPU como FPS ganho. |
| 2: materiais | Cálculos cujo peso já era zero foram evitados, com comparação visual. Ganho pequeno de GPU. | Manter; benefício insuficiente para explicar 60 fps na integrada. |
| 3: passagem de profundidade | Ganho anterior na Intel, custo adicional de CPU e geometria. Ativada para todo Ultra sem comparação anterior na RTX. A auditoria reproduziu regressão na RTX. | Reabrir o aceite. A ativação incondicional precisa ser substituída por uma escolha validada. |
| 4: seleção espacial | Menos trabalho em um teste isolado, sem ganho consistente na navegação completa. | Experimento desligado; sem nova expansão. |
| 5: ordenação, faces e agrupamento | Nenhuma variante mostrou benefício suficiente com imagem preservada. | Experimentos desligados. |
| 6: tabelas numéricas das folhas | Imagem preservada, mas maior custo de GPU. | Experimentos desligados. |
| 7: preparação incremental | Fila funcional e preparação adiada durante gestos; testes funcionais e visuais passaram. Ainda não há comparação causal suficiente da primeira exploração. | Manter a organização, medir separadamente a entrada no jogo. |
| 8: limites em Float64Array | Economia de aproximadamente 2–2,5 MB em heap + buffers medidos, imagem equivalente. Controle móvel de arrasto teve queda de 6,1% sem causa estabelecida; desktop quase empatou. | Aceite de desempenho suspenso; não anunciar ganho de FPS. |

As entregas são registros de trabalho, não oito etapas aprovadas rumo à meta. O checkpoint anterior foi commitado e enviado. As mudanças de otimização posteriores continuam locais. Fontes Blender e modelos usados pelo jogo não foram alterados nesta revisão.

## Problemas no protocolo anterior

- A máquina possui RTX 3050 e Intel UHD. Os testes anteriores de otimização usavam a Intel UHD. Isso não demonstra qual GPU o Chrome da partida relatada pelo usuário estava usando.
- Na sonda atual, tanto o Chromium de testes quanto o Chrome instalado escolheram Intel por padrão. Pedir `powerPreference: 'high-performance'` sozinho também retornou Intel. A execução isolada com a opção de teste do Chromium `--force-high-performance-gpu` retornou a RTX. Nenhuma preferência do Windows ou do navegador do usuário foi modificada. [Sonda das duas GPUs](performance/gpu-adapter-audit/results.json).
- O contador antigo usava o inverso da mediana dos intervalos; o atual usa a média real dos intervalos. Os números não são diretamente intercambiáveis. Além disso, o indicador continua sendo uma amostra curta após interação, e não um monitor contínuo da partida. Isso não invalida a percepção de lentidão relatada.
- Os percursos antigos esperavam cada evento do navegador e depois uma pausa fixa. As versões terminavam a mesma rota em tempos diferentes. O controle posterior por duração fixa corrigiu essa comparação, mas não resolveu a divergência móvel da etapa 8.
- Consultas de GPU e perfis por material são diagnósticos, com sobrecarga própria. As novas medições principais de FPS não fazem consultas de GPU.
- Em Full HD, o máximo de 150% produz canvas de **2.880 × 1.620** neste DPR. Os ensaios desktop anteriores frequentemente usavam canvas de 1.920 × 1.200. Não é a mesma carga.

A especificação trata `powerPreference` como uma preferência que pode ser ignorada, não como garantia de seleção da placa. [WebGL](https://registry.khronos.org/webgl/specs/latest/1.0/). A opção usada para isolar a RTX é definida no código do Chromium. [GPU switches](https://chromium.googlesource.com/chromium/src/+/master/gpu/config/gpu_switches.cc).

## Comparação nova

Duas builds isoladas, mantendo a mesma interface e conteúdo atuais nas duas. A referência recupera somente os 12 arquivos das otimizações existentes no checkpoint `4b7528348a8f0dde283c848a433d1bea4db41e51`. Portanto, ela representa o renderizador anterior com a interface atual, e não o executável histórico inteiro. As duas usam o mesmo medidor e a mesma entrada final de renderização.

O script verifica 77 URLs de modelos, 34.005 instâncias de origem, configurações máximas, canvas, câmera estável e ausência de página oculta. Na versão atual, alterna uma e duas passagens na mesma sessão, invertendo a ordem na segunda repetição. Cada amostra principal dura oito segundos, sem consultas de GPU; os tempos de GPU são coletados separadamente em cinco segundos. Interface visível na página e animações ligadas.

A primeira coleta em janela reproduziu a diferença na vista geral da RTX: aproximadamente 99 fps com uma passagem e 86 com duas. Em seguida houve entrada externa, alteração da câmera e fechamento da janela. A tentativa retomada também recebeu entrada; essas execuções incompletas não entram na tabela consolidada. A coleta completa usa Chrome sem janela, nas GPUs reais explicitamente verificadas. Não há certificação de quadros apresentados na tela, telefone físico ou dez minutos sustentados.

Medianas entre duas amostras principais por condição, em quadros/s calculados pelos intervalos de renderização:

| GPU / vista | Referência anterior | Atual, uma passagem | Atual, duas passagens (padrão Ultra) |
| --- | ---: | ---: | ---: |
| RTX 3050, panorama | 104,5 | 110,3 | 96,2 |
| RTX 3050, zoom | 120,0 | 120,0 | 120,0 |
| Intel UHD, panorama | 6,7 | 6,7 | 9,3 |
| Intel UHD, zoom | 9,6 | 9,6 | 15,1 |

Na mesma sessão da RTX, a passagem extra reduziu a taxa do panorama em **12,8%** frente à passagem única atual. Comparado ao renderizador anterior, o padrão atual ficou **8,0% abaixo**; essa segunda comparação usa sessões distintas. No zoom, a cadência ficou perto do limite de 120/s observado, mas o custo adicional continuou: GPU diagnóstica de 5,38 para 6,07 ms e CPU mediana de 2,25 para 3,85 ms.

Na Intel, a mesma passagem extra aumentou a taxa do panorama em **39,3%** frente à passagem única atual. Contudo, a GPU diagnóstica ainda consumiu **98,61 ms** no panorama e **58,24 ms** no zoom, muito acima de 16,67 ms. CPU mediana do panorama passou de 3,95 para 7,65 ms. A meta de 60 requer aproximadamente 6,5 vezes a taxa atual do panorama deste ensaio; reduzir mais alguns objetos JavaScript não demonstra como atingir essa diferença.

No panorama, a passagem única desenhou 682 chamadas e 5.575.312 triângulos; a dupla, 1.354 chamadas e 11.141.704 triângulos. Esse é trabalho enviado à GPU, não aumento do conteúdo do mundo. Todos os controles de câmera, qualidade, inventário e erros passaram nas 36 amostras das duas GPUs. Os tempos de GPU possuem 27–601 consultas válidas por amostra diagnóstica; não são usados como FPS principal. Estado térmico, bateria/perfil energético e cache do driver não foram controlados, por isso o resultado causal mais forte é a alternância dos caminhos dentro da mesma sessão.

[Consolidação e percentis](performance/renderer-audit-summary/results.json), [coleta RTX](performance/renderer-audit-rtx-headless/results.json), [coleta Intel](performance/renderer-audit-intel-headless/results.json).

**Conclusão:** a regressão na RTX existe no teste e tem causa isolada. Isso não prova que explica toda a lentidão percebida na partida do usuário, cuja GPU ativa e primeira entrada não foram observadas. Na Intel, houve melhora, mas os dados não sustentam que simplesmente continuar as etapas antigas levará a 60 fps no máximo. O plano seguinte trata esses dois problemas separadamente, com decisões condicionadas a medições.

## Plano substituto e critérios de passagem

### 1. Corrigir a seleção do caminho de desenho

Objetivo: recuperar o desempenho da RTX preservando o benefício que a Intel demonstrar. Desligar a passagem extra em todos os dispositivos não é uma correção aceitável se prejudicar a integrada.

Comparar uma seleção baseada em medição breve e estável dos dois caminhos, sem alterar qualidade, com o custo de manter uma passagem. Não decidir apenas pela marca da GPU: drivers, CPU, resolução e enquadramento também importam. A comparação deve ocorrer sem gesto, transição, página oculta ou atualização de sombras; descartar compilação inicial e interromper imediatamente diante de interação. Em empate ou dados insuficientes, não presumir vantagem de fazer trabalho extra. Medir também o custo de inicialização dessa escolha e prever saída segura quando consultas de GPU não estiverem disponíveis.

Aceite: comparação alternada no mesmo equipamento, panorama e aproximações, mais arrasto e tecla mantida. A seleção deve conservar o melhor resultado observado sem regressão material na outra GPU, com imagem equivalente, sombras corretas e qualidade máxima. Um teste que melhora o desktop e piora a integrada volta à investigação. Esta política ainda não está implementada; a ativação atual continua vinculada ao Ultra.

### 2. Atacar o custo dominante da Intel UHD

Após a correção acima, capturar um trace do quadro completo na primeira entrada e num percurso aquecido de 60 segundos. Separar CPU de entrada/React/visibilidade/submissão, GPU e apresentação. Identificar se os picos vêm de preparação, composição ou renderização. Medir materiais e geometria em ensaio diagnóstico separado, com a passagem efetivamente escolhida.

Priorizar uma única hipótese por comparação: cálculos comprovadamente redundantes de superfícies/vegetação, custo do terreno e pavimentos, ou desenho de superfícies inteiramente encobertas. O ranking antigo de materiais é uma pista, não uma soma do custo real nem uma autorização para retirar efeitos. Não retomar cache de folhas, agrupamento ou índice espacial sem evidência nova que explique por que a próxima variante venceria os controles que já falharam.

Aceite inicial: ganho repetido de pelo menos 5% no tempo do quadro completo em quatro pares de trajetos de duração fixa, ordem invertida; p95 e p99 sem piora recorrente; mesma imagem e inventário; controle adicional sem cronômetro de GPU. Diferenças menores ficam inconclusivas, sujeitas à variação medida. Uma regressão recorrente de 5% suspende o aceite. Economia de memória pode ser registrada separadamente, nunca como prova de 60 fps.

### 3. Validar movimento, entrada no jogo e aparelhos físicos

Repetir o percurso panorama → centro → mata → indústria → rio → praia → situação → retorno, incluindo arrasto, roda, tecla e pinça. Separar primeiro acesso, primeira exploração e estado aquecido; não excluir carregamento e depois anunciar melhora da entrada no jogo.

Obrigatórios: Intel UHD real, RTX real e celulares físicos de referência. Emulação móvel valida eventos e layout, sem representar a GPU, temperatura ou memória de um telefone. Executar dez minutos por aparelho e verificar apresentação, intervalos p50/p95/p99, tarefas longas, estabilidade de memória e equivalência visual, sempre no máximo.

Aceite de 60 fps: quadros novos apresentados de forma regular, orçamento nominal de 16,67 ms e ausência de travamentos recorrentes escondidos pela média. Uma cena parada a mais de 60 ou um teste headless não certifica movimentação suave. Se o aparelho não passar, registrar seu resultado real. Não existe evidência atual para garantir 60 fps no máximo em todo PC básico ou celular.

## Alteração aplicada nesta revisão

O painel de desempenho passa a mostrar a GPU informada pelo contexto WebGL do navegador, usando a extensão de identificação quando disponível e o identificador padrão como fallback. A leitura já existia para detectar renderização por software; agora também fica acessível ao usuário em **Configurações → Mostrar desempenho**. Não é uma lista de placas instaladas nem uma seleção automática de GPU. A escolha de qualidade salva é preservada.

## Reprodução

1. `node scripts/prepare-renderer-audit.mjs` cria as duas cópias em `.tools/renderer-audit`, sem substituir a build de produção. Guardar o manifesto e os arquivos JavaScript identificados no relatório.
2. `node scripts/serve-renderer-audit.mjs` serve somente em localhost, portas 4181 e 4182.
3. Executar sequencialmente `node scripts/audit-renderer.mjs rtx --headless` e `node scripts/audit-renderer.mjs intel --headless`, sem outro benchmark, build ou jogo concorrendo pela máquina.
4. `node scripts/summarize-renderer-audit.mjs` verifica completude, qualidade, inventário e câmera e consolida os resultados. As duas passagens são medidas como um quadro inteiro.

Recriar a auditoria em outro estado do repositório produz outro controle: comparar sempre os manifestos. O servidor deve ser encerrado ao terminar. Para uma medição em janela, retirar `--headless` e não interagir com ela durante a coleta; o verificador rejeita mudança da câmera.
