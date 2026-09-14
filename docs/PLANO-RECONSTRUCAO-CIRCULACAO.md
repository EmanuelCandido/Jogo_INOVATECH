# Plano de reconstrução da circulação e implantação do mapa

Plano original: 7 de setembro de 2026. Revisão: 9 de setembro de 2026.

Este documento define o escopo e os critérios de aceite das 11 imagens. O diagnóstico abaixo registra a situação de origem; algumas correções já existem no projeto. O andamento e as evidências estão em `APLICACAO-RECONSTRUCAO-CIRCULACAO.md`. A implementação não está integralmente validada; não interpretar uma etapa descrita aqui como concluída.

Base: os 11 recortes enviados pelo usuário, suas descrições e a inspeção do código atual. As imagens 8 e 10 mostram o mesmo encontro por uma vista equivalente; serão tratadas como um único setor, com ambas registradas na revisão. A imagem 11 define a alteração ferroviária: conservar o arco superior marcado em vermelho, eliminar o inferior marcado em preto, conectar à linha central e continuar para a esquerda.

Este plano substitui as decisões anteriores de manter o anel ferroviário fechado, criar o pátio de contêineres nesse setor e compensar ruas indevidamente elevadas com elevadores residenciais. O estilo dos modelos, os bairros e os marcos da referência continuam sendo a base da composição.

## 1. Diagnóstico que orienta a reconstrução

Os problemas não são apenas de acabamento. Ruas, ciclovias, terrenos, plataformas e acessos ainda são gerados por regras diferentes, sem uma reserva comum do espaço que cada um ocupa.

| Evidência no código atual | Consequência | Mudança necessária |
|---|---|---|
| `roadSurfaceHeight()` espalha a elevação de cada travessia pela distância em planta. Um ponto de ponte pode influenciar aproximadamente 27,5 unidades ao redor. | Ruas vizinhas e acessos sobem mesmo sem atravessar água. | Perfil próprio por trecho, com terreno, início de rampa, encontro e ponte explicitamente definidos. |
| Cada rua gera sua própria fita de asfalto e uma fita mais larga de calçada. | Nos encontros, a calçada de uma rua atravessa o asfalto da outra. | Construir uma superfície única por cruzamento no mesmo nível e recortar as calçadas a partir dela. |
| A quadra é adicionada diretamente, fora da validação usada para os edifícios. | Seu alambrado pode ocupar a rua mesmo com os testes de lotes aprovados. | Reservar o equipamento completo, seus portões e acessos, incluindo-o na mesma auditoria espacial. |
| O gramado da quadra usa `lawn`, com acabamento genérico de grama; as linhas têm apenas 0,025 unidade no modelo. | A textura compete com linhas muito finas. Na escala 1,7 atual, a largura é aproximadamente 0,043 unidade. | Material de gramado esportivo suave e marcação branca com largura e contraste verificados na câmera do jogo. |
| As ciclovias usam deslocamentos horizontais da margem e podem herdar a elevação da rua. | A largura útil varia nas curvas e aparecem rampas/encontros confusos. | Derivar afastamentos da margem real e de sua normal; declarar cada travessia. |
| O cálculo de caminhos pode gerar um elevador quando não consegue vencer o desnível. | Um erro na altura da rua vira infraestrutura permanente diante de casas. | Corrigir rua, terreno e implantação antes de calcular o caminho; acesso vertical somente em equipamentos projetados para isso. |
| `monorail` é um circuito fechado, separado de `centralRail`; todas as ferrovias recebem altura 5,4. | O anel não corresponde ao desenho solicitado e as cotas não derivam da necessidade de cada setor. | Uma rota ferroviária contínua, com perfil próprio e estações reposicionadas ao longo dela. |
| Há um pátio regular de contêineres e um amontoado de lixo independente em outro ponto. | A ocupação contradiz a referência e não constitui um único lixão coerente. | Um lote de lixão com acesso de serviço e estados de missão consistentes. |

O relatório de origem registrava 84 testes unitários e 18 testes de navegador aprovados. Esses resultados cobrem aquela versão; não comprovam a correção visual das imagens. Na revisão de 9 de setembro, a suíte atual executou 140 testes: 138 passaram e dois testes de leitura de modelos excederam cinco segundos. Os cinco testes do arquivo afetado passaram na execução isolada. Ainda é necessária uma execução integral sem falhas e a revisão final de navegador, geometria e desempenho descrita abaixo.

### Pendências para fechar a aplicação atual

1. Verificar o perfil ferroviário, ainda com cota uniforme de 5,4, contra os vãos realmente necessários; comprovar que a saída oeste e o trem completo ficam além de todos os enquadramentos permitidos.
2. Completar a verificação das cabeceiras, aterros e volumes livres das estruturas, considerando o modelo completo dos veículos e ciclistas, e não apenas seus centros.
3. Conferir a ligação entre a manobra interna do lixão e a rua pública, além da prioridade de entrada/saída do complexo industrial. A reserva interna de manobra não demonstra essa ligação por si só.
4. Completar a revisão visual da sinalização e dos rebaixos em todos os setores e perfis. A aplicação atual já inclui retenção nas 80 aproximações públicas, preferência dos ramais, testes de curvas/faixas e correção da conexão escolar duplicada. Conferir os encontros de serviço restantes e a leitura pela câmera normal, sem tratar os testes locais como revisão integral.
5. Repetir os 11 enquadramentos equivalentes, os estados de missão e a câmera normal em desktop e tela estreita, nos perfis alto e baixo. Capturas de inspeção com enquadramento especial não substituem os limites da câmera do jogador.
6. Executar a suíte completa, os 18 cenários de navegador e a comparação de desempenho em seis setores, com três medições equivalentes por setor. Corrigir falhas e investigar regressões antes de concluir.

## 2. Espaço e regras comuns antes de reposicionar modelos

### 2.1 Ampliar os setores apertados

Preparar uma planta de implantação em coordenadas do mundo, mantendo a escala dos modelos. A ampliação será obtida afastando setores e prolongando corredores, sem esticar edifícios, veículos ou texturas.

- **Campus e rio:** afastar a borda construída do campus e a primeira quadra central para reservar a ligação ferroviária, uma ponte rodoviária e margens contínuas. Separar o encontro viário da chegada da ponte de pedestres.
- **Indústria:** ampliar a área em terra a leste/nordeste para caberem fábricas, pátio de caminhões e lixão como lotes distintos. Atualizar o terreno e, se necessário, deslocar o canal mantendo sua continuidade da montante à foz.
- **Escola:** aumentar o quarteirão escolar ou deslocar a rua de contorno para acomodar escola, quadra, playground e seus acessos completos.
- **Costa:** reservar a extensão necessária à rampa de ligação ao viaduto, com a praia e o mercado de peixes acessíveis por terra.

A dimensão final será determinada por envelopes medidos, e não por um percentual arbitrário do mapa. Para cada setor, registrar a largura total de pista, calçadas, ciclovia, faixa de mobiliário, lotes e afastamentos. Se essas faixas se interceptarem, ampliar a reserva antes da montagem dos modelos.

Exemplo já mensurável: a quadra atual ocupa aproximadamente **11,90 × 10,15 unidades** na escala 1,7, antes de acrescentar circulação externa e área de abertura do portão. A reserva deve partir desse tamanho completo, não apenas do retângulo verde.

Preservar a variedade e a densidade dos bairros. O snapshot atual contém 60 edifícios e 5.686 árvores; usar esses números como referência de inventário, redistribuindo elementos retirados dos corredores. A ampliação deve receber paisagismo coerente, sem grandes vazios artificiais. A contagem total de props muda legitimamente com a remoção dos contêineres, do arco ferroviário e dos elevadores desnecessários.

### 2.2 Fonte única para circulação

Separar os dados de implantação dos detalhes decorativos:

- **Nós:** encontros reais, entradas de lotes, estações e saídas regionais, com posição e cota compartilhadas.
- **Trechos:** largura, perfil de altura, tipo de uso, extremidades, sentido quando necessário e veículos permitidos.
- **Travessias:** local, duas rotas envolvidas, solução escolhida, volume livre e apoios permitidos.
- **Lotes:** polígono completo, cota de implantação, porta/portão e área de serviço; reservar a união dos estados das missões.
- **Corredores protegidos:** toda a largura e altura necessárias a carros, caminhões, ciclistas e pedestres, incluindo curvas.

As curvas devem ser amostradas por distância e curvatura. Paradas, marcações e conexões devem usar distância ao longo da rota e identificadores estáveis, substituindo dependências dos índices fixos `0`, `56`, `75` e `100`.

Nenhum novo trecho pode terminar sem uma função declarada: ligação com outra via, entrada de lote, retorno dimensionado, estação terminal ou continuação regional fora da área visível.

### 2.3 Regras de altura

1. Ruas locais acompanham o terreno preparado do bairro. Somente pontes, suas aproximações e o viaduto recebem elevação deliberada.
2. Cada ponte tem limites de início e fim; sua altura não se propaga para ruas próximas pela distância horizontal.
3. Conexões no mesmo nível compartilham a mesma seção e cota, inclusive nos bordos. Não basta igualar os pontos centrais.
4. Adotar, para este mapa, ruas locais preferencialmente até 5% de inclinação, rampas viárias até 8%, ferrovia até 4% e caminhos comuns preferencialmente até 5%. Rampas de pedestres excepcionais terão até 8%, com patamares e espaço próprios. São metas internas de desenho do jogo.
5. Dimensionar o espaço da aproximação por `comprimento mínimo = desnível / inclinação`, acrescentando as transições suaves. Uma ligação do chão à cota 4,5 exige pelo menos 56,25 unidades a 8%, antes dessas transições. Se faltar comprimento, ampliar ou reposicionar o acesso.
6. Medir o vão livre entre o piso inferior e a face inferior real do tabuleiro. Usar a altura dos modelos que passam por baixo, com folga; medir somente a diferença entre eixos não é suficiente.
7. Trechos em aterro precisam de talude ou contenção visível. Trechos sobre vãos precisam de estrutura. Nenhuma fita de asfalto pode ficar suspensa sem explicação construtiva.

## 3. Correções por imagem

### Imagem 1 — Quadra e marcação do campo

**Implantação**

- Criar um lote esportivo integrado à escola, incluindo piso externo, alambrado, redes, placar, portão e circulação.
- Reposicionar o conjunto ou a rua de contorno dentro do quarteirão ampliado. Preservar a escala da quadra.
- Direcionar o portão para a circulação escolar. O caminho de entrada deve chegar à calçada, sem abrir diretamente sobre uma faixa de veículos.
- Reservar separadamente o playground e impedir que sua realocação produza o mesmo problema.

**Modelo e material**

- Pelo Blender MCP, revisar `football-field.blend`: tornar as linhas laterais, áreas, centro e círculo consistentes; aumentar inicialmente a espessura visual para aproximadamente 0,08–0,10 unidade após a escala de implantação e ajustar pela captura real.
- Usar branco opaco, sem brilho excessivo; separar as marcações da grama para evitar cintilação por superfícies coincidentes.
- Criar um material específico de gramado esportivo, com variação discreta entre faixas e textura fina filtrada. Evitar herdar a textura forte aplicada indiscriminadamente a `lawn`.
- Conferir também o GLB simplificado: a marcação precisa sobreviver à troca de LOD.

**Aceite:** todo o lote esportivo fica fora da pista; nenhum veículo ou mobiliário ocupa alambrado/portão; entrada contínua; linhas distinguíveis na vista de inspeção e no zoom normal em que o campo é reconhecível.

### Imagem 2 — Rua externa duplicada e acesso ao viaduto

- Eliminar o percurso longo paralelo ao contorno da comunidade, hoje composto por `orla` e `retorno-orla`. Conservar a rua interna que atende os edifícios.
- Substituir a função da via eliminada por **um acesso ao viaduto sobre a água**, saindo do lado leste da rede local e chegando a um encontro projetado no `viaduto-leste`.
- Reservar a rampa antes de distribuir árvores e lotes. A chegada deve ter cota, largura, curvatura e sinalização compatíveis; não será uma curva que apenas encosta na borda do tabuleiro.
- A altura da nova ligação só aumenta no trecho de aproximação. O restante do bairro permanece no terreno.
- Atender mercado de peixes, praia e serviços por um ramal local curto, conectado à rua interna, sem recriar outra volta paralela. Manter a caminhada e a ciclovia da orla contínuas.
- Recalcular tráfego, faixas, postes e entradas: remover os placements da via antiga em vez de esconder apenas o asfalto.

**Aceite:** desaparece o desvio viário redundante; existe um percurso completo da rede local ao viaduto; o acesso permite entrada e saída conforme a sinalização; todos os imóveis e a praia continuam acessíveis; nenhuma rampa ocupa a faixa de areia ou bloqueia a ciclovia.

### Imagem 3 — Lixão no lugar dos contêineres

- Retirar as fileiras de contêineres, o pavimento retangular de depósito e o equipamento de movimentação que só fazia sentido nesse pátio.
- Unificar o lixo dessa região em um lote de lixão, próximo às fábricas e ao canal poluído conforme a referência. Reposicionar o amontoado existente para evitar duas áreas independentes sem relação.
- Construir solo irregular, marcas de passagem de caminhões e pilhas variadas de resíduos com os modelos existentes. Onde faltar uma peça adequada, criá-la no Blender MCP; variar orientação e distribuição sem sobreposição com a rua ou com o canal.
- Dar ao lixão um acesso de serviço próprio ligado à rede industrial. Reservar manobra e uma separação física da água, mantendo os elementos narrativos de poluição nos locais intencionais.
- Vincular lixo, solo e equipamentos aos estados de `pollution_01`: situação inicial, intervenção temporária e resolução devem transformar o mesmo lote. A solução não pode deixar lixo de fundo nem fazer reaparecer o depósito de contêineres.

**Aceite:** o local é reconhecível como lixão na visão geral e de perto; não restam contêineres ou piso de terminal nesse lote; caminhões têm acesso real; missão, câmera e área transformada coincidem em todos os estados e após carregar o save.

### Imagem 4 — Indústria no terreno e pátio exclusivo de caminhões

- Reprojetar `acesso-industrial`, `patio-industrial` e `acesso-carga` sobre terreno preparado. Manter elevada somente a travessia efetiva do canal e sua aproximação.
- Posicionar a entrada das fábricas em terra, fora da rampa da ponte. Uma portaria compartilhada pode atender o complexo; os ramais internos devem chegar individualmente às áreas de carga das fábricas.
- Criar pátio industrial exclusivo para caminhões, com espera após a portaria, vagas, circulação interna e espaço diante das docas. Dimensionar vagas e curvas pelo modelo de caminhão e sua área de manobra, sem diminuir o veículo para caber.
- Diferenciar via pública e via de serviço nos dados de tráfego. Carros de passeio e ônibus não devem ser distribuídos no estacionamento e nos corredores de carga.
- Oferecer passagem separada de pedestres entre portaria e acesso de funcionários. O caminho não atravessa vagas ou a área de ré dos caminhões.
- Reposicionar torres elétricas, árvores, fumaça e equipamentos para fora dos corredores. Toda fábrica precisa de porta ou doca voltada ao pátio, com orientação e dimensões confirmadas no Blender MCP quando houver alteração do modelo.

**Aceite:** cada fábrica tem uma entrada funcional; há estacionamento e manobra exclusivamente de caminhões; nenhuma vaga invade a via pública; pisos das fábricas e pátio têm transições naturais; apoios, taludes e equipamentos não bloqueiam a circulação.

### Imagem 5 — Calçadas atravessando ruas e áreas ocupadas

- Construir os cruzamentos pela união das áreas de asfalto **somente entre vias que se encontram no mesmo nível**. Uma ponte não deve ser unida à ciclovia que passa por baixo.
- Obter as calçadas pela área externa da rua, descontando asfalto, acessos de veículos, volumes dos modelos e passagens definidas. Remover bordas internas que hoje atravessam os encontros.
- Desenhar faixas de pedestres, rebaixos e linhas de retenção pela geometria de cada braço do cruzamento. Travessias serão elementos declarados, não pedaços de calçada cruzando o asfalto.
- Refazer os acessos com a largura inteira do caminho. Partir da porta/portão do modelo e terminar no bordo correto da calçada. Considerar muros, postes, árvores, quadras e estados de missão, além dos edifícios.
- Preservar as praças de acesso do hospital e da estação; portas e rampas devem terminar em áreas de circulação, sem faixas decorativas atravessando o lote.

**Aceite:** nenhuma calçada cobre asfalto fora das travessias projetadas; não há caminho entrando em outro prédio, equipamento ou água; meios-fios são contínuos onde devem existir e abertos nas entradas e travessias; todos os acessos mantêm largura útil.

### Imagem 6 — Estação, casas e elevadores desnecessários

- Rebaixar as ruas residenciais indevidamente elevadas, preparando o terreno dos lotes junto delas. Refazer entradas curtas e naturais, com pequenos patamares quando necessários.
- Remover os elevadores automáticos criados para compensar essas ruas. A geração de caminhos não poderá escolher um elevador como resposta padrão a uma implantação ruim.
- Diferenciar a ferrovia elevada que aparece na imagem da rua abaixo: manter a elevação ferroviária apenas onde definida pelo novo perfil e pelas travessias; ela não impõe a cota das casas nem do passeio.
- Reposicionar a estação central e sua plataforma em uma reserva própria, com embarque adequado ao trem. Concentrar os acessos verticais realmente necessários na estação, com escada e elevador integrados à praça de entrada.
- Posicionar as paradas pelo destino atendido e pela distância ao longo do novo trilho. Evitar plataformas em pontes apenas porque ali havia um índice de parada.

**Aceite:** casas têm acesso pelo chão; desaparece a sequência de elevadores residenciais; quem chega à estação encontra um acesso claramente ligado à plataforma; cobertura, estrutura, trem e embarque usam o mesmo traçado e perfil.

### Imagem 7 — Ponte com fundação e vão legíveis

- Delimitar a ponte rodoviária como uma estrutura própria, incluindo largura total, espessura de tabuleiro, vigas, encontros nas duas margens e ligação às rampas.
- Acrescentar fundações e contenções visíveis onde há aterro; sob os vãos, usar apoios coerentes e posicionados fora da ciclovia, da calçada e do canal de passagem.
- Manter a ciclovia contínua embaixo quando o vão necessário couber. Se o espaço vertical não couber, alongar a aproximação e ajustar a cota da ponte; não elevar a ciclovia para disfarçar a interseção.
- Separar a chegada da ponte de pedestres do cruzamento de carros. Reservar uma pequena área de chegada ligada ao passeio/ciclovia, sem desembarque direto na pista.
- Aplicar acabamento de concreto, juntas e diferenciação entre face lateral e pavimento. A leitura de elevação deve vir da geometria e dos apoios, permanecendo clara mesmo com sombras reduzidas.

**Aceite:** as duas margens sustentam a ponte de forma visível; o tabuleiro tem espessura; há vão livre para ciclistas; nenhum apoio está no percurso; a vista lateral mostra a separação e a vista superior permite entender as chegadas.

### Imagens 8 e 10 — Reconstrução do encontro campus–rio–centro

Esse setor exige redesenho conjunto, antes de qualquer reposicionamento de postes ou árvores.

1. Abrir espaço entre o campus, a margem e a primeira quadra central. Reservar a área ferroviária ao norte, seguindo a alteração das imagens 9/11.
2. Implantar uma única travessia rodoviária clara para ligar o campus à cidade. Separar sua aproximação da ponte ferroviária e da ponte de pedestres.
3. Recuar o encontro da avenida ribeirinha para terra firme, fora da cabeça da ponte. A chegada pode formar um T legível com a via local; retirar a diagonal que mistura o acesso rodoviário com o corredor ciclável da margem.
4. Manter os percursos das duas margens paralelos ao rio, com afastamento calculado pela margem real. Reservar largura de ciclovia, passeio e mobiliário em faixas distintas.
5. Fazer a ciclovia passar por baixo das pontes onde houver o vão projetado. Encontros restantes no mesmo nível precisam de travessia sinalizada, aproximação e prioridade explícitas. Nenhuma interseção pode ficar sem classificação.
6. Refazer terreno e contenções a partir desses corredores, eliminando cunhas de terra sobre ciclovias e margens estreitas demais. Manter o canal e a água contínuos.
7. Reimplantar casas, entradas, vegetação e visitantes somente depois de aprovadas as três redes: veículos, pedestres/ciclistas e ferrovia.

**Aceite:** é possível seguir visualmente e nos dados cada percurso de uma extremidade à outra; não há pista dentro da ciclovia, terreno sobre caminho, trilho sem vão sobre circulação nem encontro de pontes e ruas sem transição. Cada cruzamento tem uma função e uma solução física identificáveis.

### Imagens 9 e 11 — Ferrovia aberta para oeste

- Remover completamente o arco inferior marcado de preto: tabuleiro, trilhos, guarda-corpos, pilares, parada inferior, seus elevadores e trens vinculados ao trecho. Reocupar a área liberada com paisagismo e caminhos úteis do campus.
- Conservar e suavizar o arco superior marcado em vermelho. Na ponta leste, ligá-lo à linha da estação central com posição, tangente, largura e altura contínuas. Não criar um desvio que apenas encoste em outro trilho.
- Na ponta oeste, prolongar a linha para a esquerda por um corredor regional dentro da paisagem de floresta/montanha. O trilho deve continuar além de toda a área que a câmera pode mostrar; nenhuma extremidade pode aparecer durante pan ou zoom.
- Adotar uma rota contínua: **continuação regional oeste → arco norte do campus → estação central → destino industrial existente**, revisando o terminal leste para ter parada e término reconhecíveis. A área industrial de caminhões permanece separada da plataforma de passageiros.
- Reposicionar uma eventual parada do campus no arco conservado, próxima a um destino e em espaço reservado. Não manter a parada inferior nem duplicá-la apenas para preservar a quantidade anterior.
- Unificar a geometria percorrida pelos vagões com a geometria dos trilhos. Dimensionar curvas pela composição; checar acoplamentos e inclinação, inclusive na união entre as antigas rotas.
- Validar a saída oeste contra todos os enquadramentos permitidos, considerando a altura do trilho e o comprimento completo do trem. Se houver movimento ou reaparecimento de composições, ele ocorrerá inteiramente fora desse volume visível; no tráfego estático atual, nenhuma composição será cortada pelo fim da rota.

**Aceite:** não existe o anel inferior; o trajeto segue o desenho vermelho; é possível percorrer o trilho conectado da estação até além do limite oeste; não há degraus, quinas, apoios abandonados ou trens sobre a linha removida; o limite regional não fica visível ao jogador.

## 4. Ordem de aplicação e pontos de verificação

| Etapa | Trabalho | Condição para avançar |
|---|---|---|
| 1. Registrar a base | Guardar os enquadramentos equivalentes aos 11 recortes, inventário, perfis e medição de desempenho com configuração registrada. Criar identificação por setor. | Cada problema tem uma vista e elementos rastreáveis; não usar somente uma captura geral. |
| 2. Redesenhar a planta | Reservar lotes, ampliar os setores, remover arco inferior e via redundante dos dados, definir rede industrial e lixão. | Planta contínua, todos os destinos atendidos e nenhuma reserva incompatível em planta. |
| 3. Definir cotas | Preparar terreno, perfis, vãos, aproximações e nós compartilhados. | Nenhum degrau; inclinações e alturas livres medidas; ruas locais apoiadas no terreno. |
| 4. Construir superfícies | Unir cruzamentos, recortar calçadas, modelar pontes/contenções e refazer ciclovias. | Redes inteiras navegáveis na análise geométrica, com cada travessia declarada. |
| 5. Implantar os modelos | Recolocar escola/quadra, fábricas, casas, estações, equipamentos e lixo; produzir os ajustes 3D necessários. | Envelopes e entradas cabem nos lotes; pátios de caminhões e plataformas funcionam espacialmente. |
| 6. Refazer detalhes e estados | Gerar acessos, tráfego, mobiliário, vegetação e estados de missão a partir da implantação aprovada. | Nenhum elemento residual das rotas removidas; situações mantêm seus acessos e transformações. |
| 7. Integrar mapa ampliado | Atualizar limites, câmera, águas, fundos, busca de caminhos e snapshot. | Sem bordas expostas, trilhos cortados, missões fora do enquadramento ou dados antigos no navegador. |
| 8. Revisão final | Comparar cada imagem, executar testes e medir desempenho final. Corrigir os conflitos encontrados e repetir as verificações afetadas. | Todos os critérios da seção seguinte possuem evidência; pendências impedem declarar a reconstrução concluída. |

Não finalizar superfícies e decoração de um setor enquanto suas reservas e cotas ainda estiverem em conflito. Isso evita refazer os mesmos acessos a cada ajuste de rua.

## 5. Arquivos e integração previstos

| Área | Arquivos atuais a revisar |
|---|---|
| Traçados, lotes, alturas e âncoras | `src/config/referenceMap.ts`; separar os dados de corredores/lotes em módulos próprios se necessário para manter uma fonte única. |
| Geometria das ruas, calçadas, margens e plataformas | `src/components/environment/ReferenceCity.tsx`, `referenceGeometry.ts` e `src/config/spatial.ts`. |
| Apoios, mobiliário, lixo e tráfego complementar | `src/config/referenceDetails.ts` e `src/config/trafficSituation.ts`. |
| Rotas de pedestres e envelopes | `src/config/walkNetwork.ts`, `src/assets/modelLayout.ts`, `assets-source/model-attachments.json`. |
| Modelos e materiais | `scripts/blender/public_spaces.py`, scripts dos modelos afetados, `src/assets/surfaceFinish.ts`, registro e metadados de LOD. |
| Situações | `src/config/situationSites.ts`, `situationVisuals.ts`, `src/content/problems.ts` e referências de âncoras usadas pela cena. |
| Câmera e extensão do mapa | `src/game/mapNavigation.ts`, `CameraDirector.tsx`, `src/config/referenceFrame.ts`, estado da câmera e limites derivados. |
| Cache de implantação | `scripts/generate-reference-layout.mjs` e `src/config/reference-layout.json`; regenerar após a implantação final e validar a igualdade entre autoria e snapshot. |
| Verificação | `scripts/audit-map-plan.mjs`, `scripts/review-reference.mjs`, testes de continuidade, referência, navegação, missões e renderização. |

A grade de busca dos caminhos e os polígonos de terra/água têm limites próprios. Todos devem acompanhar a expansão; alterar apenas o limite da câmera não aumenta o mapa funcional. Atualizar também as posições de missões, cobertura das sombras, enquadramento inicial, áreas de culling e recuperação de uma câmera salva antes da ampliação.

Para alterações de modelos, seguir o `AGENTS.md`: confirmar a conexão do Blender MCP e inspecionar a cena antes de editar; salvar os fontes `.blend` em `assets-source` e exportar os GLBs usados pelo aplicativo para `public/assets/models`. Gerar novamente os envelopes, sockets e LODs afetados. A revisão deve verificar o modelo exportado dentro do jogo, além da cena do Blender.

## 6. Verificação exigida para concluir a aplicação

### 6.1 Testes espaciais e de continuidade

- **Conectividade:** todas as extremidades das ruas e trilhos correspondem a um destino declarado. A ferrovia oeste e o acesso novo ao viaduto pertencem às redes corretas, sem componentes soltos.
- **Cruzes e alturas:** registrar todas as interseções de corredores e classificar como encontro no mesmo nível ou passagem separada por altura. Medir piso, espessura do tabuleiro e vão livre; verificar nós e bordos com tolerância geométrica inicial de 0,02 unidade.
- **Ocupação completa:** checar polígonos e intervalos de altura de quadra, playground, edifícios, cercas, postes, apoios, vagas e estados das missões. Pontos centrais fora da rua não bastam.
- **Caminhos:** verificar a faixa completa do passeio, incluindo quinas, largura, porta de origem e chegada; rejeitar atalhos diagonais por obstáculos. Entradas devem chegar à rede pública, não apenas a uma calçada isolada.
- **Veículos:** validar comprimento, largura, curva de manobra e folga de caminhões; não aceitar ônibus/carros na área exclusiva. Nas vias removidas, a quantidade de placements vinculados deve ser zero.
- **Estruturas:** pilares e fundações ficam fora dos volumes de passagem. Cada ponte tem os dois encontros e sua aproximação; nenhum trecho elevado fica sem estrutura ou aterro identificado.
- **Estados:** a união dos espaços necessários aos estados inicial, temporário e resolvido cabe no lote. O lixão inteiro acompanha a missão e o save, sem resíduos decorativos independentes.
- **Câmera:** testar zoom mínimo/máximo, bordas, redimensionamento e câmeras de missão. O prolongamento oeste e as bordas do terreno continuam além da visão permitida.

Envelopes conservadores servem para localizar conflitos. Quando acusarem um encaixe potencialmente intencional, conferir a geometria e registrar o par específico e a região de contato permitida. Não liberar uma categoria inteira, como todas as rampas ou todas as plataformas sobre água, para silenciar o teste.

Atualizar testes que exigem o anel fechado ou as paradas em índices antigos, pois essa intenção foi substituída pelo usuário. Acrescentar regressões dos erros das imagens, especialmente quadra/rua, calçada/asfalto, elevadores automáticos e contêineres no lixão. Não considerar contagens de edifícios ou testes de conexão entre centros como prova de implantação correta.

### 6.2 Revisão visual

Repetir os enquadramentos dos 11 recortes, agrupando 8/10, e acrescentar uma vista superior e uma lateral dos encontros elevados. Verificar:

- quadra, escola e playground, com leitura das linhas;
- costa sem a volta duplicada e com chegada real ao viaduto;
- lixão e fábricas com seus acessos e estacionamento;
- cruzamentos do hospital, caminhos residenciais e estação;
- ponte rodoviária e passagem inferior da ciclovia;
- campus–rio sem sobreposições;
- percurso ferroviário completo e saída oeste invisível.

Inspecionar nos perfis alto e baixo, no desktop e em telas estreitas. Testar estados de missão que alteram os setores. Estruturas e trajetos devem continuar legíveis sem depender de sombra de alta qualidade; linhas da quadra e marcações não devem sumir ao trocar LOD.

### 6.3 Desempenho e comandos

Manter materiais compartilhados, instanciamento e culling por região. Construir uniões de superfícies e buscas de implantação uma vez, no preparo/snapshot, sem fazê-las a cada frame. Módulos repetidos de ponte e equipamentos devem reutilizar geometria. Preservar os detalhes úteis e redistribuir vegetação fora dos corredores.

Na aplicação, executar os testes espaciais durante as mudanças e, ao final, `npm test`, `npm run build`, a auditoria ampliada e `npm run test:e2e`. Usar `scripts/review-reference.mjs` atualizado para registrar os enquadramentos e executar a medição de desempenho nas mesmas condições da base.

Comparar tempo de CPU/GPU por frame, p95, chamadas de desenho, triângulos e tempo de preparo, após aquecimento, sem outros trabalhos pesados simultâneos. Uma regressão consistente superior a 5% na mediana de três medições equivalentes deve ser investigada e corrigida antes da entrega, sem reduzir a qualidade configurada para favorecer o resultado. O FPS disponível depende do equipamento; não declarar 60 FPS em Ultra sem medição que sustente isso.

## 7. Critério de entrega

A aplicação estará concluída quando cada item das imagens tiver: correção implementada, teste geométrico pertinente, captura equivalente revisada e registro do resultado. O relatório final deverá distinguir claramente o que foi corrigido de qualquer limitação ainda encontrada.

Resultado esperado: quadra dentro do lote; uma ligação útil ao viaduto; lixão no setor correto; indústria com acesso e estacionamento de caminhões; ruas locais apoiadas no terreno; caminhos sem invasões; pontes com estrutura legível; ciclovias contínuas; e uma ferrovia que acompanha o arco vermelho e segue para oeste, com destino e continuidade reais.
