# Aplicação da reconstrução da circulação

Plano vigente: `PLANO-RECONSTRUCAO-CIRCULACAO.md`. Início: 7 de setembro de 2026.

Estado: em andamento. Este registro não representa conclusão do plano.

Última revisão: 10 de setembro. Corrigidos encaixes de apoios, transição visual do pavimento e guarda-corpos sobre acessos; evidências e limites estão nas seções finais. A tesselação compartilhada eliminou os erros de altura acima de 0,02 nos centros das faces de asfalto, mas ainda há inclinações transversais a corrigir. Permanecem também a revisão estrutural integral, todos os enquadramentos finais, estados/save, consolidação dos testes e comparação de desempenho. Os relatos anteriores abaixo são históricos, não uma lista de pendências que deva ser reiniciada do zero.

## Evidência inicial

- Blender MCP conectado; cena inicial inspecionada e fonte `station-lift-landing.blend` confirmada salva, sem alterações pendentes.
- Captura por setor adicionada a `scripts/review-reference.mjs --circulation --out <diretório>`. O arquivo `views.json` registra as câmeras para comparação posterior.
- Medição de base: `scripts/benchmark.mjs circulation-before --hardware --ambient`, com `BENCH_URL=http://127.0.0.1:5173`, `BENCH_SECONDS=10` e `BENCH_RUNS=3`. Resultados válidos somente quando o processo concluir e gravar `results.json` sem erros.
- Predicado de distância entre lote completo e corredor adicionado para detectar cruzamentos entre amostras e invasões pela largura da via. Ainda deve ser integrado à implantação e verificado pelos testes.

## Escopo que permanece obrigatório

- [ ] 1: quadra, reserva escolar, acesso e marcações nos dois LODs.
- [ ] 2: remover a volta externa e conectar a rede local ao viaduto.
- [ ] 3: substituir pátio de contêineres por lixão e integrar seus estados.
- [ ] 4: perfis locais, acesso industrial exclusivo, docas e estacionamento de caminhões.
- [ ] 5: união dos cruzamentos, recorte de calçadas e caminhos com largura completa.
- [ ] 6: acessos das casas no terreno e acessos verticais somente onde necessários.
- [ ] 7: estrutura, encontros e vão livre da ponte.
- [ ] 8/10: ampliar e reorganizar o encontro campus–rio.
- [ ] 9/11: eliminar arco inferior; ligar arco norte à estação e prolongar para oeste.
- [ ] Integrar limites, água, terreno, câmera, rede de caminhos e snapshot.
- [ ] Revisão visual por imagem, estados de missão, testes e desempenho final.

As marcações serão concluídas apenas após evidência geométrica e visual, não por quantidade de arquivos alterados ou pela aprovação de testes antigos.

## Avanço verificado — quadra e arco ferroviário norte

- Fonte da quadra reconstruída pelo Blender MCP, com `fieldturf`, `fieldstripe` e `fieldmark`: gramado suave separado do acabamento genérico de terrenos e linhas brancas com espessura de 0,055 no modelo (0,0935 na implantação). Fontes e exportações high/low atualizados; metadado de entrada adicionado.
- Contorno escolar refeito: `avenida-botanica` passa a desembocar na `rua-escola-sul` pelo lado oeste, e o circuito da reciclagem chega à rede pelo encontro sul. A quadra conserva sua escala e ocupa uma reserva própria orientada pelo mapa, na posição u=-46,75, v=-22,75.
- `corridorGap()` verifica todo o envelope contra a largura da rua, inclusive entre amostras. A reserva escolar exclui edifícios e vegetação; a entrada do campo participa da rede de pedestres.
- Snapshot regenerado: 60 edifícios, 5.686 árvores e 61 entradas conectadas. A contagem de entradas agora inclui a quadra. A conexão entre porta e borda do piso do próprio edifício ainda precisa da auditoria ampla de acessos prevista no plano.
- Removido o circuito inferior do trem. O arco norte continua para u=-175 a oeste e se une à linha central. A aproximação curva foi refeita com tangentes correspondentes para eliminar uma quina vista na primeira captura.
- Parada inferior do campus e batente do antigo terminal oeste removidos; uma parada do campus foi implantada no arco norte. Os trens usam uma sequência contínua de pontos das duas partes conectadas, com escala compartilhada.
- Caminho da parada reservado contra edifícios e árvores. Uma turbina que ficou próxima à ferrovia foi transferida para a área de floresta a noroeste; o envelope de todos os rotores agora é testado contra os trilhos.

### Validação desta etapa

- Base registrada em `docs/performance/circulation-before/results.json`, concluída sem erros, três passagens de dez segundos por setor. Capturas originais em `docs/screenshots/circulation-before`.
- 91 testes unitários passaram em 16 arquivos após as alterações na quadra e ferrovia. Depois do deslocamento final da turbina e da adição de sua regressão, os nove testes de ferrovia e continuidade passaram novamente. Isso totaliza 92 casos existentes, mas a suíte inteira ainda não foi repetida com o novo caso.
- TypeScript passou após a reconstrução ferroviária. Não foi executado ainda o build final nem a suíte de navegador de conclusão.
- Capturas intermediárias de todos os setores em `docs/screenshots/circulation-school-rail`, sem erros de página. Quadra e ferrovia revisadas visualmente, incluindo as duas variantes isoladas da quadra em `docs/screenshots/future/models/prop.football*.png`.
- A comparação de desempenho final permanece pendente; as estatísticas curtas do capturador não substituem o benchmark controlado.
- Capturas da última implantação em `docs/screenshots/circulation-school-rail-final`, com zero erros de página; a imagem ferroviária confirma a retirada da turbina junto ao trilho. TypeScript repetido nessa versão, aprovado.

### Próxima integração obrigatória

A geometria ainda usa o campo de alturas global das pontes; por isso permanecem ruas elevadas e elevadores residenciais. Calçadas e ciclovias ainda precisam da reconstrução por cruzamento. A ligação ao viaduto, o pátio de caminhões, o lixão, a expansão do setor campus–rio e a revisão de fundações ainda não foram aplicados. As plataformas e os caminhos da estação devem ser integrados aos novos perfis antes de considerar os itens 6 e 9/11 concluídos. Nenhuma dessas pendências é considerada resolvida pelos testes desta etapa.

## Avanço posterior — lixão e correção de renderização

- Removidos os contêineres, o pavimento de depósito e as escavadeiras estáticas sem função nesse setor. Removido também o antigo amontoado de caixas independente junto ao canal.
- `dumpSite.ts` define um lote único em u=99, v=52, com polígono, entrada e área de chegada. O corredor de serviço e o lote são excluídos da implantação dos edifícios e árvores.
- A âncora de `pollution_01` acompanha esse lote. Resíduos, recipientes e revegetação usam os mesmos três estados da missão, incluindo o carregamento do save. O piso muda de terra degradada para solo em intervenção e depois grama.
- Criado `industrial-waste.blend` via Blender MCP: concreto quebrado, tijolos, chapas, madeira, pneu e embalagens. Exportados `industrial-waste.glb` e `industrial-waste-low.glb`, com seis materiais compartilháveis, aproximadamente 115 KB e 81 KB. Script fonte em `scripts/blender/industrial_waste.py`.
- Testes de envelopes encontraram uma pilha e um recipiente invadindo a faixa de serviço; ambos foram reposicionados. Todos os modelos dos três estados passam no teste de contenção do lote, ruas, edifícios e acesso de serviço.
- A revisão da mudança de estado revelou um defeito de renderização: árvores e veículos desapareciam enquanto suas sombras e contagens de instâncias permaneciam. O Three podia pular o envio do buffer compactado no quadro seguinte à sombra e o modo sob demanda ficava ocioso. `InstanceCulling` agora solicita um quadro adicional quando compacta instâncias; a cena continua ociosa quando os dados estabilizam.
- `scripts/review-dump.mjs` verifica os três estados, recarrega a solução pelo save real e compara pixels de uma região de floresta que não deve mudar. O resultado atual registra fração de pixels alterados igual a zero nos estados temporário e resolvido, sem erros de página. Evidências em `docs/screenshots/circulation-dump`.
- Validação atual: **96 testes unitários aprovados em 17 arquivos**, TypeScript aprovado e revisão visual dos três estados e da persistência concluída. Build e E2E globais de conclusão continuam pendentes.

O item 3 avançou, mas ainda requer o acabamento do solo e da distribuição de resíduos em conjunto com a reorganização industrial. A entrada possui corredor livre; seu encontro definitivo, sinalização e manobra serão integrados ao pátio exclusivo de caminhões. Este é um registro histórico da etapa; o avanço posterior está descrito abaixo. O planejamento inteiro não está concluído.

## Integração posterior — perfis, indústria, pontes e estações (8 de setembro)

### Implantação e circulação

- `roadProfiles.ts` propaga as cotas ao longo dos trechos conectados e insere nós nos encontros reais, com limite de 8% nas rampas. A elevação deixou de se espalhar radialmente para ruas vizinhas.
- Removidas `orla` e `retorno-orla`; implantados `acesso-viaduto` e o ramal curto `acesso-praia`. O viaduto e a ligação costeira compartilham o encontro. A revisão intermediária mostra a chegada em T aberta, com tabuleiros e apoios.
- Indústria ampliada a leste, com quatro fábricas em terreno preparado, portaria, docas, vagas e acessos de funcionários. As rotas internas têm uso exclusivo de caminhões; paradas de ônibus foram excluídas dos ramais de serviço. As manobras completas e os encontros de cada doca ainda exigem validação final.
- Lixão reposicionado para **u=99, v=42**. Esta coordenada substitui a posição anterior u=99, v=52; a âncora da missão acompanha o lote. A revisão de persistência anterior não comprova automaticamente esta nova implantação e deve ser repetida.
- `streetLayout.ts` prepara união de asfalto e diferença das calçadas; o viaduto preserva superfície independente fora dos seus encontros declarados. A interpolação espacial dos pisos foi indexada para reduzir o custo de construção da geometria.
- Margens usam afastamento perpendicular, com ciclovia, passeio e faixa de mobiliário distintos. Recuadas ruas centrais e prolongado o trecho alto da ponte do campus. A auditoria por interseção de polígonos encontrou quatro passagens sob pontes, com piso superior mínimo entre 2,579 e 2,800 unidades; a avaliação desconta o tabuleiro e o piso ciclável.
- Fontes e GLBs de tabuleiro, pilar, capitel, fundação e contenção criados pelo Blender MCP e integrados com instanciamento. A checagem de apoios passou a consultar `structuralSupports`, substituindo a busca obsoleta por cilindros decorativos.

### Escola e estações

- Playground incluído em `publicLots`, com envelope completo e entrada na rede de pedestres. A reserva da quadra continua independente e preserva o alambrado.
- A busca por lotes rejeita casas sobre encostas sem terreno preparado. A casa 14 foi transferida para um lote plano próximo do bairro escolar quando a reserva das estações tornou sua posição anterior inviável.
- Criados pelo Blender MCP `station-stairs.blend` e `station-platform-canopy.blend`, com exportações high/low em `public/assets/models`. A escada possui dois lances, patamar intermediário, corrimãos e marcação dos degraus. Os encaixes inferior/superior são registrados nos metadados.
- `stationFacilities.ts` reserva escada e elevador completos antes dos edifícios; suas chegadas ficam no chão e integram a busca de caminhos. As coberturas acompanham as plataformas por módulos curtos, substituindo a cobertura fixa que não seguia o trilho.
- Corredores elevados ligam os acessos às plataformas. Os guarda-corpos ferroviários abrem no lado do embarque; paradas rodoviárias em rampas foram excluídas.
- Snapshot regenerado com **60 edifícios, 5.686 árvores e 68 entradas conectadas**: 60 edifícios, quadra, playground e seis acessos de estações.

### Evidência e achados da revisão

- Após as primeiras alterações viárias, 107 de 108 testes passaram; o teste restante terminou por timeout ao carregar os GLBs durante trabalho concorrente. Isso não equivale a uma aprovação global e requer nova execução controlada.
- Após a integração das estações: **10 testes passaram** em `station-access`, `school-reservation` e `map-continuity`. TypeScript passou antes dos ajustes posteriores de mobiliário e apoios.
- Capturas intermediárias em `docs/screenshots/circulation-station-access`, sem erros de página: estação central, campus–rio e ferrovia oeste. As estatísticas de aproximadamente um segundo dessas capturas não são evidência de desempenho final.
- Auditoria ampliada registrou 68 acessos sem invasão de água ou outros lotes pela largura de 1,4; nenhum degrau nos nós viários verificados. Contatos das peças de acessibilidade com o próprio prédio permanecem explicitamente identificados, não liberados por uma exceção geral.
- A mesma auditoria encontrou **14 interferências de bancos/postes com ciclovias e dois apoios próximos de vias**. Foram ajustadas as regras de realocação de mobiliário e exclusão de apoios. É necessário repetir a auditoria e as capturas para comprovar os ajustes.
- A captura do campus motivou incluir turbinas na reserva contra escadas, elevadores e corredores das estações. A captura da estação revelou aparentes artefatos de pavimento/veículos, ainda em investigação.

### Pendências para concluir o plano

1. Reexecutar a auditoria após os últimos ajustes e corrigir qualquer conflito restante, incluindo equipamentos, vegetação, guarda-corpos e apoios das plataformas.
2. Revisar visualmente os encaixes das escadas, guarda-corpos dos corredores, a praça da estação e o trajeto de cada porta até sua plataforma; confirmar os vãos acima das vias.
3. Investigar os artefatos aparentes de pavimento, a cobertura das calçadas e a concordância entre piso, veículos e trechos estruturais nas junções.
4. Finalizar manobras industriais, entrada/saída e espera de caminhões; acabamento de solo do lixão e repetição de todos os estados com persistência.
5. Verificar encontros/aterros de todas as pontes, perfis ferroviários e saída oeste contra a área inteira permitida à câmera.
6. Atualizar as travessias e rebaixos em todos os braços dos cruzamentos; verificar caminhos, incluindo largura, folgas e continuidade dos acessos de serviço.
7. Completar revisão equivalente às 11 imagens, incluindo perfis alto/baixo e telas estreitas, estados de missão, build, suíte unitária completa, E2E e benchmark comparável à base.

Nenhum item do checklist global foi marcado como concluído apenas por ter novos arquivos ou testes parciais aprovados.

### Revalidação dos obstáculos — 8 de setembro

- A auditoria ampliada foi repetida após realocar os bancos/postes e incluir turbinas na reserva dos acessos: **zero conflitos** nos caminhos por largura completa, mobiliário ribeirinho, 63 fundações verificadas e cotas dos nós. As três peças da missão de acessibilidade continuam identificadas como contato esperado com a estação.
- TypeScript passou com os ajustes acima. Os dez testes de estação, escola e continuidade passaram em execução autorizada posterior; o bloqueio transitório do serviço de aprovação não persistiu.
- `scripts/inspect-pavements.mjs` mediu os pisos da cena carregada por raios verticais no centro dos veículos. Nenhuma superfície foi encontrada entre 0,18 e 1,25 unidade acima da posição de implantação. A captura sem sombras mostra os veículos inteiros; essa medição pontual **não** comprova ausência de interferência nas laterais nem valida todos os recortes do asfalto.
- Evidência em `docs/pavement-inspection.json` e `docs/screenshots/circulation-station-access/pavement-no-shadows.png`. Permanecem recortes claros e transições a revisar nas junções, especialmente os encontros entre calçadas, contenções e tabuleiros.
- Acrescentadas regressões em `tests/circulation-obstacles.test.ts` para as interferências encontradas. O checklist global continua aberto até a revisão final completa.

### Assentamento dos tabuleiros nas junções

- A comparação da estação com e sem os módulos estruturais isolou a causa dos recortes claros: planos dos tabuleiros de cada aproximação apareciam acima do asfalto compartilhado; contenções também continuavam nas bocas das ruas.
- `roadStructures.ts` passou a assentar o topo completo dos módulos de junção abaixo do piso local, considerando rotação e inclinação, e a interromper contenções onde se conectam outras vias. Os módulos das travessias independentes continuam separados.
- Captura posterior `circulation-station-access/pavement-no-shadows.png` revisada com as estruturas visíveis: os recortes claros na junção da estação desapareceram. `pavement-without-structures.png` serve somente como diagnóstico; não é a configuração entregue no jogo.
- TypeScript aprovado após essa correção. Ainda é necessária a revisão equivalente dos demais cruzamentos, encontros estruturais e setores do plano; a captura de uma estação não comprova todos os itens.

### Docas e estados do lixão

- `truckManeuvers.ts` define curvas de ré com raio de 3 unidades e aproximação reta à doca. Cada uma das quatro fábricas usa a mesma trajetória para a sinalização do piso e para a verificação espacial.
- O teste `truck-maneuvers` passou: em todas as amostras da curva e aproximação, o envelope exportado do caminhão em escala 1 mantém folga das fachadas, da vaga ocupada e do caminho separado de funcionários. Isso verifica a manobra de um veículo; espera, prioridade e conflitos entre veículos simultâneos ainda precisam de revisão.
- O solo do lixão recebeu material próprio `soil`, com variações de terra compactada e granulação filtrada. O estado recuperado mantém grama. A distribuição e o acabamento geométrico do lote ainda podem precisar de ajustes na revisão final.
- `review-dump.mjs` concluído após as alterações: estados inicial, temporário e resolvido, recuperação preservada após recarregar o save, zero erros de página e zero alteração de pixels na região de floresta de controle. Capturas inicial e resolvida inspecionadas nesta etapa.
- Capturas industriais atuais em `docs/screenshots/circulation-industrial-review`. A suíte unitária completa foi iniciada com dois workers para evitar a contenção que causara timeout de carregamento dos modelos; seu resultado será registrado após o término.
- O capturador `review-reference.mjs` aceita agora `--quality`, `--width` e `--height`, registrando a configuração junto das imagens. Essa capacidade prepara a revisão exigida em baixo detalhe e telas estreitas; não significa que ela já tenha sido concluída.

### Piso completo das manobras e validação de produção

- A suíte completa terminou com **114 testes aprovados em 23 arquivos**, usando dois workers. O timeout anterior não se repetiu.
- Encontrada uma lacuna adicional nas docas: a manobra tinha folga dos obstáculos, mas a reserva pavimentada não representava toda a varredura do caminhão. Acrescentados envelopes com margem de 0,25 unidade, piso de giro contínuo e recorte correspondente das calçadas. Removida a duplicação do caminho industrial genérico; o acesso separado de funcionários continua desenhado.
- `industrialPaving.ts` usa uma envoltória convexa do giro para evitar centenas de bordas quase coincidentes. A primeira união dessas bordas produziu um erro da biblioteca geométrica; o erro foi reproduzido no teste e no navegador e corrigido antes de aceitar a alteração.
- Após a correção: os **dois testes de manobra passaram**, incluindo cobertura integral pelo pavimento e ausência de calçada no acesso de carga. A captura `docs/screenshots/circulation-industrial-paving/04-industrial-yard.png` foi inspecionada; o navegador terminou sem erros.
- O build de produção posterior passou e regenerou o snapshot com **60 edifícios, 5.686 árvores e 68 entradas**. O aviso de tamanho dos chunks permanece; o build aprovado não comprova o benchmark final.
- A suíte E2E de 18 casos foi iniciada contra esse build. O resultado deve ser registrado ao término, sem considerar execução em andamento como aprovação.

### Revisão dos estados industriais e término dos E2E

- Os **18 E2E passaram em 10,6 minutos**: desktop, Pixel 7 e viewport de 360 × 640. Incluem as dez missões no desktop, saves, resultados temporários/ineficazes, qualidade gráfica, arrasto, pinça, zoom e retorno da missão.
- A captura de `health_02` durante esses testes revelou duas árvores de intervenção sobre a vaga e o acesso de funcionários. Árvores, placa e o pequeno foco de poluição foram reposicionados nas laterais da fábrica; a frente permanece destinada à carga e à entrada. Essa correção visual ocorreu depois do build usado na suíte E2E.
- Após a realocação, TypeScript e os **três testes de docas** passaram, incluindo os assets dos estados inicial, temporário e resolvido contra vagas, manobras e passagem de funcionários. Snapshot regenerado, inventário preservado e build atualizado novamente.
- `review-future-situations.mjs health_02 --hardware` verificou os três estados e a troca para HIGH sem erros. Capturas `docs/screenshots/future/situations/health_02-solved.png` e `health_02-temporary.png` inspecionadas: não há mais árvores sobre a vaga nem sobre a faixa de funcionários.
- Auditoria espacial repetida após a realocação: **68 entradas conectadas**, zero conflitos nos caminhos, mobiliário ribeirinho, 63 apoios verificados e cotas dos cruzamentos. Permanecem somente os três contatos intencionais das peças de acessibilidade com a estação. A auditoria continua limitada aos envelopes e categorias que efetivamente mede.
- Próximos pontos da revisão global: continuidade dos guarda-corpos e acessos das estações; encontros/aterros e apoios completos das pontes; marcações de todos os braços de cruzamento; eliminar índices fixos restantes do tráfego do viaduto e das paradas; capturas equivalentes em LOW/telas estreitas e benchmark final comparável. O lixão ainda requer a revisão de acabamento e manobra prevista no plano.

### Distâncias de circulação e auditoria dos braços viários

- `routeFrame.ts` substitui índices fixos por distância física, tangente e inclinação local no tráfego do viaduto. As paradas complementares também passaram a usar distância, deixando de acessar o índice 40. A seleção dos destinos das paradas ainda deve ser revista; essa alteração resolve o posicionamento, não comprova cobertura de transporte público.
- Passaram 13 testes de implantação/obstáculos/amostragem. Depois foi acrescentada uma regressão que mede a altura e o afastamento lateral de cada veículo real do viaduto: os dez testes do arquivo `reference-map` passaram. Capturas da ligação costeira e estação em `circulation-distance-placement` inspecionadas, sem erros de navegador.
- `junctionCrossings.ts` gera faixas nos braços internos dos traçados, além das extremidades; rejeita a área onde a faixa invadiria outra via no mesmo nível. Os testes de quatro braços e T passaram. `circulationCrossings.ts` inclui os dois encontros declarados do viaduto.
- A auditoria `scripts/audit-junction-crossings.mjs` registra **78 travessias e 14 braços ainda não resolvidos** em `docs/junction-crossings.json`. São encontros muito próximos/traçados parcialmente sobrepostos na avenida central, margem central, avenida da estação/comunidade e bairro/anel escolar. Não foram classificados como concluídos nem ocultados por exceções; requerem revisão geométrica dos nós e de suas aproximações.
- Captura da estação com as novas faixas em `circulation-junction-crossings/06-station.png` inspecionada. As marcações estão mais completas. A continuidade dos rebaixos, guarda-corpos e as situações de tráfego sobre as travessias ainda precisam de revisão.
- TypeScript e build passaram após integrar os encontros do viaduto. A suíte E2E aprovada anteriormente não foi repetida para estas mudanças; permanece evidência da etapa anterior. Não foi medido o benchmark final.

### Remoção de caudas sobrepostas na comunidade e na escola

- Identificada a avenida da estação atravessando a rua da comunidade e continuando até uma segunda conexão. `trimRoadApproach.ts` encerra essa aproximação na primeira interseção, removendo a cauda duplicada. Os dois testes da operação passaram, assim como os testes de implantação/continuidade afetados.
- O conector `anel-escola` repetia parte da rua `bairro-escola` em sentido contrário, criando três pequenos encontros na mesma esquina. Removida essa porção, preservando a aproximação independente e a conexão real. O snapshot foi regenerado após cada mudança: **60 edifícios, 5.686 árvores e 68 acessos conectados**.
- A auditoria agora registra **80 travessias e quatro braços pendentes**, contra 14 anteriormente. Restam avenida central em (20,41;49,14), margem central em (-24;25) e os dois braços do encontro avenida da estação/comunidade em (47,23;-7,49). A redução resulta da remoção de trechos sobrepostos, não de exceções no auditor.
- Depois da correção escolar, passaram **18 testes** de reserva escolar, continuidade e implantação, além de TypeScript e build. Capturas em `circulation-community-approach/02-coast-link.png` e `circulation-school-approach/01-school.png` inspecionadas; ambas foram geradas sem erros de navegador. Quadra e playground permanecem fora do asfalto e a marcação do campo está legível nessa vista.
- Os quatro braços restantes, continuidade completa dos passeios/rebaixos, estações, apoios e benchmark continuam pendentes. A captura de escola não equivale à revisão de todos os setores em LOW e telas estreitas.

### Aproximações da margem, hospital e comunidade

- A rua `margem-central` passou a sair da avenida com uma aproximação distinta, deixando de acompanhá-la quase paralelamente. O início de `rua-do-hospital` foi unido ao nó (24;49), eliminando o pequeno trecho entre dois encontros próximos na avenida central.
- Normalizadas as coordenadas dos bordos viários em uma grade de 0,000001 unidade. Isso corrige a falha da união booleana causada por coordenadas coincidentes que diferiam apenas nos últimos dígitos de ponto flutuante.
- A aproximação da avenida à comunidade foi refeita como curva de chegada transversal e encerrada no primeiro encontro com a rua curva de destino. A primeira tentativa atravessava outro trecho da comunidade: a auditoria detectou essa regressão e a cauda foi removida antes da validação final.
- Snapshot regenerado: **60 edifícios, 5.686 árvores e 68 entradas**. `docs/junction-crossings.json` agora registra **82 travessias e zero braços pendentes** entre os nós e tipos de via cobertos pelo auditor. Acrescentada regressão desse resultado no mapa real.
- Após o último ajuste passaram **22 testes** de implantação, continuidade e superfícies; TypeScript e build também passaram. Os três testes de recorte/aproximação passaram na execução anterior. Capturas `circulation-final-approaches/02-coast-link.png` e `05-hospital.png` inspecionadas, sem erros no navegador.
- Este resultado encerra a falta de espaço dos braços identificados nessa auditoria, mas não comprova rebaixos, conexão de passeios, ausência de veículos sobre faixas, estruturas das estações ou benchmark. A revisão global e os demais critérios do plano permanecem abertos.

### Guarda-corpos do perímetro das estações

- Confirmada a conexão e inspecionada a cena pelo Blender MCP. O primeiro comando de exportação anterior não havia produzido o arquivo novo; nesta etapa a sessão foi restabelecida, o módulo Python recarregado e a exportação verificada. Fonte `assets-source/station-guardrail.blend`, GLB otimizado `public/assets/models/station-guardrail.glb`: **9.080 bytes, um material**.
- `stationPerimeters.ts` une os corredores de acesso à plataforma e distribui módulos no contorno resultante. Substituídos os guarda-corpos anteriores que cortavam 0,8 unidade de cada extremidade e deixavam lacunas nas curvas. A borda de embarque, a chegada da escada e a saída do elevador ficam abertas.
- Corrigido um erro de interpolação do segundo eixo durante a integração. O teste de perímetro verifica centros dos módulos sobre o contorno real e as aberturas; não comprova sozinho toda a largura livre dos passageiros nem todos os contatos entre módulos.
- **Três testes de acesso/perímetro passaram**, assim como TypeScript e build. Captura `circulation-station-perimeter/06-station.png` inspecionada sem erros no navegador; o corredor central tem guarda-corpo contínuo nas curvas visíveis. Permanecem a revisão completa das outras estações, encaixe com as escadas, praça térrea, apoios e comparação LOW/mobile.

### Pisos das plataformas e primeira revisão LOW/mobile

- O piso elevado passou a usar o mesmo polígono unido dos guarda-corpos, com face lateral de 0,28 unidade. Foram retiradas as fitas independentes das plataformas/corredores, que podiam ter bordos diferentes nos encontros e curvas.
- A primeira revisão LOW identificou atualização React durante renderização em assinantes de `useProgress`. `useLoadingSnapshot` entrega notificações após a renderização corrente e é utilizado por `GraphicsRuntime`, `ShaderWarmup` e `SceneReady`. A leitura direta antes de liberar a cena permanece. As duas primeiras capturas com avisos foram rejeitadas e repetidas após a correção dos três assinantes.
- Revisão LOW final de escola, estação, campus–rio e ferrovia oeste concluída sem erros. Capturas em `circulation-low-review` inspecionadas: linhas esportivas legíveis, circulação elevada distinguível sem sombras e arco ferroviário aberto. Não constituem prova das folgas de todos os apoios nem dos limites completos da câmera.
- Capturas LOW de escola, estação e campus em 390 × 844 concluídas sem erros em `circulation-mobile-review`. A opção `--fit-sector` enquadra o setor inteiro proporcionalmente à largura; é uma vista diagnóstica e **não valida os limites normais da câmera ou gestos móveis**. Captura da estação inspecionada.
- TypeScript e build passaram. Os **dois E2E de desktop** afetados passaram no build atual: troca de qualidade/persistência e save que aguarda os modelos antes de retornar à cidade (50,7 segundos). A suíte inteira de 18 casos continua sendo evidência da etapa anterior.
- Ainda faltam os demais setores e perfis, revisão das passagens térreas/apoios das estações, rebaixos, reserva do tráfego sobre travessias, lixão e benchmark controlado. Estatísticas de um segundo das capturas não medem desempenho final.

### Reserva de faixas contra o tráfego comum

- Integrada a reserva das travessias à geração de `referenceTraffic`. Veículos que ocupavam a faixa são procurados em posições livres da mesma rua e faixa de circulação, preservando modelo, escala e quantidade. A busca considera o polígono do veículo, distância de outros veículos, lotes e vias exclusivas de carga; falha explicitamente se não houver espaço.
- As travessias agora são calculadas em `referenceMap.ts` e reexportadas por `circulationCrossings.ts`, permitindo usar os mesmos polígonos na geração e na renderização, sem dependência circular.
- Snapshot regenerado: 245 veículos comuns, 60 edifícios, 5.686 árvores e 68 acessos. Nenhum veículo comum invade as faixas auditadas com margem de 0,4 unidade.
- TypeScript, quatro testes de reservas/cruzamentos, 12 testes de implantação real e build passaram. O build mantém o aviso de chunks grandes.
- As dependências locais estavam incompletas; foram restauradas para executar as verificações. Não houve alteração intencional das versões declaradas do projeto.
- Esta verificação ainda não inclui os veículos complementares do viaduto e das missões, nem substitui a revisão visual final. Permanecem as demais pendências registradas acima.

### Tráfego complementar e estados da missão

- O viaduto mantém todos os veículos e usa busca por distância na mesma faixa para liberar as travessias e os veículos comuns. A cota e a inclinação são recalculadas na posição final.
- Os estados inicial, temporário e resolvido de `pollution_02` usam posições em distância na avenida, preservando seus modelos e quantidades. A conversão para o grupo local da missão mantém a orientação e a altura; a fumaça acompanha o deslocamento do carro correspondente.
- A primeira verificação encontrou folga insuficiente entre dois veículos originais da missão. `reserveTraffic` passou a considerar também pares originalmente próximos, além de veículos sobre faixas. O teste foi mantido com a mesma margem.
- 17 testes passaram: 14 de implantação real e três da reserva. Incluem faixas livres, preservação dos veículos por estado e ausência de conflitos entre missão, tráfego comum e viaduto. Snapshot regenerado e TypeScript aprovado.
- Capturas `circulation-traffic-review/06-station.png` e `02-viaduct-junction.png` revisadas, sem erros no navegador. Não representam revisão visual de cada estado da missão nem medição controlada de FPS.
- Permanecem a revisão completa dos acessos/apoios, rebaixos, lixão, limites da câmera, demais setores/perfis e benchmark final previstos no plano.

### Ligação térrea da praça da estação central

- A auditoria dos caminhos confirmou que a entrada do edifício e os dois acessos verticais terminavam em calçadas independentes. Acrescentados dois percursos internos, do caminho frontal aos caminhos da escada e do elevador, contornando o edifício.
- `groundConnection.ts` verifica a largura de 1,4 unidade por segmento e testa as bordas contra terreno/ruas. O encurtamento do percurso só é aceito quando a faixa completa permanece livre. A geração ocorre na autoria; o navegador usa o snapshot.
- Os novos caminhos entram na reserva usada pela distribuição da vegetação. Mantidos 60 edifícios e 5.686 árvores. O snapshot agora registra 70 links: os 68 acessos anteriores e duas conexões internas adicionais, não dois novos equipamentos.
- Cinco testes de caminhos/acessos passaram; a ligação real entre os pontos dos três acessos e a folga diante dos lotes são verificadas. TypeScript e build passaram. Evitada também a geração de fita de comprimento zero no fim dos links internos.
- Captura `circulation-station-ground/06-station.png` inspecionada sem erros no navegador. Os caminhos dos dois lados da estação ficam legíveis e a entrada frontal está desobstruída. A validação completa das outras estações, apoios, rebaixos e demais pendências do plano permanece necessária.

### Regressão encontrada na revisão completa: margem central

- A suíte completa executou 134 testes: 133 passaram e um detectou a rua `margem-central` sobre a ciclovia na região de (-27,6; 23,2). A mudança anterior desse traçado havia escapado às verificações parciais de cruzamentos viários.
- Recuados o nó compartilhado com `avenida-estacao` e a curva seguinte para dentro do bairro. A rua continua térrea e conectada; não foi adicionada outra ponte ou elevação para compensar a invasão.
- Regenerado o snapshot com os mesmos 60 edifícios e 5.686 árvores. A primeira comparação de snapshot ocorreu antes do fim da geração e foi rejeitada; repetida após a conclusão, passou.
- Os 24 testes afetados (corredores ribeirinhos, implantação e continuidade) passaram, além de TypeScript e build. Isso não equivale a uma nova execução integral dos 134 casos após o recuo.
- Captura `circulation-river-setback/river.png` inspecionada: a rua recuada mantém faixa livre até a ciclovia, sem alterar seu nível; navegador sem erros. A captura não serve como benchmark.
- Blender MCP reconectado e cena inspecionada para os próximos ajustes de modelos. Nenhum modelo foi alterado nesta etapa.

### Apoios das plataformas incluídos na reserva espacial

- A auditoria inicial encontrou 64 apoios cadastrados sem conflitos, mas não incluía os pilares finos gerados separadamente nas plataformas. Esses pilares foram substituídos pela implantação dos módulos estruturais existentes, com fundação, pilar e travessa.
- A plataforma central projeta-se sobre a avenida; por isso a busca apenas sob seu eixo não encontrou dois apoios válidos. Acrescentada busca lateral para as plataformas, com travessa até o tabuleiro e afastamento mínimo entre apoios da mesma plataforma. Mantidos os testes de quantidade e folga; as duas tentativas insuficientes foram rejeitadas.
- Todas as três plataformas possuem pelo menos dois apoios próprios e fundações fora dos caminhos térreos. Quatro testes de estações passaram, TypeScript e build também. A auditoria atual registra 69 apoios, zero conflitos cadastrados com vias/caminhos, 70 links alcançáveis e nenhum conflito de mobiliário nas ciclovias.
- Captura `circulation-platform-supports/06-station.png` inspecionada sem erros no navegador. Ainda é necessária a revisão dos contatos entre apoios de rotas distintas e do volume completo das travessas laterais; os testes atuais verificam principalmente as fundações e não comprovam esses contatos superiores.
- A alteração reutiliza os modelos estruturais existentes, sem criar ou editar geometria de modelos. Permanecem as demais pendências do plano, incluindo rebaixos, lixão, revisão completa de estruturas e benchmark.

### Folga entre componentes estruturais das plataformas

- Cada apoio agora registra seus três componentes (fundação, pilar e travessa). A implantação das plataformas rejeita pares de componentes de apoios distintos cujo intervalo vertical e polígono em planta se sobreponham.
- Mantida a exigência de dois apoios distintos por plataforma. Os seis testes de estações passaram, incluindo folga contra apoios vizinhos e edifícios/acessos, além da conexão térrea da praça. Os componentes testados usam rotação apenas no eixo vertical; a função de interseção não deve ser tratada como teste genérico de modelos inclinados.
- TypeScript e build passaram. Captura `circulation-support-clearance/06-station.png` inspecionada sem erros de navegador. Os novos apoios usam os modelos existentes; nenhuma geometria de modelo foi modificada.
- Continuam pendentes as demais verificações do plano: rebaixos e travessias acessíveis, acabamento do lixão, revisão ampla de cotas/estruturas/câmera, estados de missão, perfis gráficos e desempenho controlado.

### Transições de cota nas travessias

- Criado `crossingApproaches.ts`: as áreas de chegada das faixas são recortadas das calçadas existentes e recebem uma transição de 0,023 unidade entre passeio e asfalto, respeitando a altura da rua ou do viaduto. Como o passeio atual está abaixo do asfalto, a transição sobe suavemente; não foi inventado um meio-fio alto para depois rebaixá-lo.
- Os primeiros testes detectaram 16,43 unidades quadradas de áreas duplicadas entre transições próximas e erro de distância em curva fechada da rua escolar. Corrigidos com união das áreas e cálculo pela direção local da travessia.
- Dois testes passaram: preservação da área total de calçada sem superfícies duplicadas e cotas das aproximações nos dois lados das faixas. TypeScript e build passaram.
- Capturas finais de hospital e ligação ao viaduto em `circulation-crossing-approaches` concluídas sem erros. A subdivisão foi ajustada de 0,16 para 0,35 unidade, reduzindo cerca de 61 mil triângulos na captura em relação à primeira tentativa. Isso não substitui o benchmark controlado.
- A alteração trata a transição de piso. A revisão final ainda deve conferir obstáculos nas chegadas, sinalização, limites da câmera, acabamento do lixão, missões, demais setores/perfis e desempenho conforme o plano.

### Ampliação da cobertura da auditoria do lixão

- A revisão de código encontrou que a auditoria geral de missões não incluía `dumpScenery`, embora essa camada renderize as pilhas e árvores complementares do lote. Incluída a união dos objetos principais com o cenário de cada estado, e ampliado o teste de envelopes do lixão para a mesma união.
- Corrigida a composição das rotações na auditoria: usa quaternion do grupo e do objeto, preservando a inclinação dos veículos em vez de somar apenas yaw.
- `node --check scripts/audit-map-plan.mjs` passou. A auditoria ampliada e o teste modificado ainda não foram executados; resultados anteriores não comprovam essa nova cobertura.
- A execução de `review-dump.mjs` foi rejeitada pela revisão automática de aprovação por limite de uso. Nenhuma captura nova foi iniciada nesta etapa. Permanecem pendentes a revisão visual dos estados/save e os demais trabalhos do plano.

### Estados completos do lixão revalidados

- A execução voltou a estar disponível. Os quatro testes ampliados de `dump-site` passaram; a auditoria geral incluindo `dumpScenery` não encontrou novos conflitos com lotes. Permanecem apenas os três contatos intencionais dos modelos da missão de acessibilidade com a estação.
- Revisão visual identificou fileiras artificiais de entulho no fundo do lote. Redistribuídas as 15 pilhas existentes em grupos irregulares, com variação de escala, preservando o acesso e sem editar os modelos 3D.
- Após a redistribuição, os quatro testes passaram novamente, assim como TypeScript e build. `review-dump.mjs` concluiu os três estados e a recuperação do estado resolvido após save/reload, sem erros de navegador e com diferença zero na região de floresta usada como controle.
- Capturas atuais em `circulation-dump`; estado inicial inspecionado após a alteração e estado resolvido inspecionado durante a primeira revisão desta etapa. O solo ainda tem contorno geométrico e faltam acabamento natural e marcas de circulação; esta etapa não conclui o polimento do lixão nem a manobra completa dos caminhões.

### Área de manobra do lixão

- Definido percurso de serviço com entrada pela portaria, giro de raio 3 e retorno pela mesma entrada no sentido oposto. Os arcos concordam em posição e tangente; a geometria é dado de reserva, não animação do caminhão.
- Reposicionados os grupos que ocupavam o giro, preservando a quantidade de pilhas e árvores de cada estado. A reserva considera o caminhão exportado em escala 1, com balanços dianteiro e traseiro.
- Cinco testes do lixão passaram. Verificam o percurso contra a união do cenário complementar e objetos principais de todos os estados, margem de 0,25 unidade, terra firme, prédios e pertencimento ao lote ou entrada reservada.
- TypeScript e build passaram. Revisão dos três estados e save/reload repetida com sucesso, sem erros e sem alterar a floresta de controle. Captura inicial atual inspecionada.
- Ainda faltam o acabamento do solo e marcas visuais de circulação; a ligação do percurso interno à circulação pública e sua prioridade deverão integrar a revisão final. O teste não representa simulação física de direção nem prova contínua entre todas as amostras.

### Acabamento do solo e revisão de evidências — 9 de setembro

- O material do lixão suaviza o contorno com variação irregular e acrescenta desgaste e marcas de pneus seguindo a reserva interna. O estado resolvido usa grama sem essas marcas. Não há novas malhas; isso não cria relevo físico no solo.
- A revisão salva em `docs/screenshots/circulation-dump/results.json` confirma os três estados, recuperação da resolução após reload, nenhum erro de navegador e nenhuma mudança na região de floresta usada como controle.
- TypeScript passou. A suíte completa terminou com 138 de 140 testes aprovados: dois testes de leitura de GLBs excederam cinco segundos. O arquivo afetado, `future-city.test.ts`, passou isoladamente com cinco testes em 1,68 segundo. Isso indica sensibilidade à carga concorrente; não equivale a uma suíte integral aprovada.
- O planejamento foi atualizado para distinguir o diagnóstico histórico das pendências atuais. Permanecem necessárias a revisão de conexões externas, estruturas, câmera, sinalização, navegador e desempenho antes da conclusão.

### Saída ferroviária e validação integral — 9 de setembro

- Acrescentada verificação por frustum real da câmera para o trecho terminal oeste, incluindo altura dos trilhos e espaço para uma composição de cinco vagões. Abrange cinco formatos de tela, extremos e centro do pan, quatro níveis de zoom e câmeras de todas as missões. O teste passou. Não verifica a trajetória intermediária das animações entre câmeras.
- Suíte integral executada com `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 30 arquivos e 141 testes aprovados, em 276,26 segundos. Mantido o limite de tempo original dos testes; a concorrência menor evita a contenção observada na execução anterior.
- `npm run build` passou, com 60 edifícios, 5.686 árvores e 70 conexões de pedestres no snapshot. Permanece o aviso existente sobre tamanho dos chunks.
- Auditoria espacial repetida: nenhum caminho inacessível, conflito de caminho, mobiliário em faixa ribeirinha, conflito dos 69 apoios ou diferença de altura nos encontros verificados. Os três contatos da missão da estação continuam registrados individualmente.
- A exceção de contatos foi restringida à missão `accessibility_01`, ao lote `estacao-central`, à peça específica de cada estado e ao volume local da entrada (x ±0,95; y 0–0,6; z −1,65–0,1). Outras rampas ou peças deslocadas não recebem essa dispensa.
- A revisão completa de navegador foi iniciada no build atualizado; seu resultado será registrado após o término. A comparação de desempenho permanece pendente.
- A rodada completa de navegador terminou: **18 testes aprovados em 11,8 minutos**, nos projetos desktop, mobile e small, usando `ECO_HARDWARE=1`. Inclui narrativa completa, intervenções temporárias, reavaliação, recursos insuficientes, save/reload, qualidade e navegação por mouse/toque/teclado.
- O benchmark comparativo foi iniciado separadamente, após o encerramento dos testes, em `http://127.0.0.1:4174`, com 3 execuções de 10 segundos por setor e backend D3D11. O resultado ainda não foi avaliado.

### Superfícies indexadas e desempenho

- `mergeSurfaceGeometry` preserva os índices existentes ao unir superfícies; entradas sem índices recebem índices sequenciais. Não remove triângulos nem usa soldagem aproximada. Dois testes comprovam igualdade exata de posições, normais, UVs e ordem dos triângulos, incluindo índices acima de 65535. Build e cinco testes das superfícies passaram.
- Benchmark completo após a reconstrução (`circulation-after`) apresentou regressões de GPU frente à base. A versão indexada (`circulation-indexed`) reduziu as medianas entre 2,6% e 11,9% mantendo chamadas e triângulos de cada setor.
- Medianas de GPU da versão indexada: visão geral 54,60 ms (+5,5% sobre a base), centro 28,61 (+0,3%), floresta 33,98 (+8,8%), indústria 26,14 (+3,9%), praia 17,61 (+4,0%) e rio 29,65 (+0,2%). Visão geral e floresta ainda exigem investigação; a meta de desempenho não está encerrada.
- Comparação das capturas dos dois benchmarks: quatro setores pixel a pixel idênticos; floresta e rio diferiram em apenas dois pixels cada (0,000195% da imagem). A causa desses pixels não foi determinada; os atributos geométricos são preservados pelos testes.
- Revisão HIGH do build indexado capturada em `circulation-final-high`, sem erros de navegador. Entrada do lixão e encontro campus–rio inspecionados; encontrada quina brusca no acesso do lixão, em correção.

### Curva de entrada do lixão

- Substituída a quina entre a entrada e a portaria por curva quadrática, com chegada horizontal concordante com o percurso interno. Reserva de vegetação e snapshot regenerados sem reduzir as contagens de edifícios, árvores ou conexões.
- Novo teste amostra o acesso a cada 0,15 unidade, nos dois sentidos, com o envelope completo do caminhão. Verifica terra firme, pertencimento ao acesso/rua/lote e folga de 0,25 dos edifícios e objetos de todos os estados. Não simula ainda a manobra entre a faixa longitudinal da rua e a boca do acesso.
- Build passou; 12 testes de continuidade e lixão passaram. Captura HIGH inspecionada em `circulation-dump-entry/03-dump-relocated.png`, sem erros de navegador, confirmando a remoção da quina.
- A regeneração altera a distribuição determinística de vegetação e tráfego, portanto as medições anteriores de desempenho documentam a versão indexada anterior a esta curva. A comparação final deverá ser repetida depois de finalizar a implantação.

### Conversões entre a rua de serviço e o lixão

- A auditoria ampliada encontrou o caminhão fora do piso durante uma conversão. Criadas quatro trajetórias de entrada/saída, com tangentes das faixas reais e chegada ao acesso. O raio de três unidades foi verificado; aproximações curtas não passaram e foram substituídas por aproximações de 14 unidades na rua e oito no acesso, com tangentes independentes escolhidas pela curvatura.
- Pavimentada a reserva dos envelopes completos dos caminhões, com margem de 0,30. A mesma área é subtraída da calçada e reservada contra edifícios e vegetação. Postes que incidiam na área são realocados ao longo da via e verificados com folga de 0,25.
- Oito testes do lixão e três de manobras industriais passaram. Cobrem raio amostrado, pavimento, terra firme, afastamento de edifícios, postes e percurso interno nos três estados. Não são simulação física contínua nem prova de prioridade de tráfego ou de vão livre sob o viaduto.
- Build passou com 60 edifícios, 5.686 árvores e 70 conexões. Captura HIGH em `circulation-dump-turns/03-dump-relocated.png` inspecionada, sem erros de navegador. A área de manobra aparece como piso de concreto contínuo à rua e ao acesso; sua sinalização e a distribuição final dos postes ainda devem integrar o polimento do setor.

### Vão livre e preferência na saída do lixão

- Acrescentada auditoria das quatro conversões contra todos os elementos de `roadStructures`, transformando os oito cantos dos envelopes dos modelos, inclusive peças inclinadas. As amostras passaram com folga superior de 0,30 e afastamento lateral de 0,25. Esta evidência cobre as conversões do lixão, não todas as vias elevadas do mapa.
- Adicionada marcação de preferência no pavimento da faixa de saída, anterior à área de manobra compartilhada. A via `acesso-carga` mantém prioridade. A cena continua estática; a sinalização não representa controle dinâmico de trânsito.
- Dez testes do lixão passaram, incluindo posição da marcação no acesso e volume sob estruturas. Build passou mantendo 60 edifícios, 5.686 árvores e 70 conexões.
- Captura HIGH em `circulation-dump-priority/03-dump-relocated.png` inspecionada: triângulo e linha descontínua visíveis na faixa de saída. Nenhum erro de navegador. Verificação LOW em andamento.
- Captura LOW concluída e inspecionada em `circulation-dump-priority-low/03-dump-relocated.png`: a marcação permanece visível sem sombras. Nenhum erro de navegador. As estatísticas breves da captura não são usadas como benchmark.

### Cotas ferroviárias e preparo das manobras

- Acrescentada verificação ferroviária com amostras longitudinais de até 0,25 unidade e três posições transversais. Considera espessura real do tabuleiro, terreno e alturas dos modelos de ônibus/caminhão nas travessias rodoviárias, com folga de 0,30. Cinco testes ferroviários passaram. A cota uniforme atual passa nessas restrições; isso não prova que seja a menor cota necessária em cada trecho nem cobre todas as cabeceiras e encontros estruturais.
- Removida do carregamento normal do navegador a busca combinatória das tangentes das quatro conversões do lixão. O snapshot agora guarda oito valores em `dumpTurnHandles`; o navegador reproduz e verifica as mesmas curvas com esses valores. A autoria continua recalculando as tangentes.
- Build passou. Dezesseis testes de continuidade e lixão passaram, incluindo igualdade exata entre curvas calculadas na autoria e reconstruídas a partir das tangentes salvas. Nenhuma redução de geometria ou densidade. Não foi atribuída melhora de FPS a esta alteração de carregamento.

### Volumes estruturais e copas nas pontes — validação pendente

- A auditoria `traffic-structures.test.ts` passou para os veículos comuns, do viaduto e dos três estados da missão de trânsito. Usa caixas orientadas com rotação e escala, corrigindo explicitamente a transformação dos centros deslocados da origem. Isso verifica interseção de envelopes, não a folga contínua de todas as rotas possíveis.
- Capturas LOW de escola, indústria e ponte foram inspecionadas em `circulation-low-validation`. As linhas do campo permanecem legíveis, mas foram encontradas manchas de copas atravessando o tabuleiro da ponte.
- A reserva de `referenceTrees` passou a considerar a copa e a altura dos trechos elevados. Árvores conflitantes são redistribuídas com a mesma espécie e escala; o build preservou 5.686 árvores. A primeira auditoria ainda encontrou quatro interseções envolvendo duas árvores nas aproximações baixas; o filtro de altura foi corrigido depois desse resultado.
- A captura intermediária `circulation-crown-clearance/07-bridge.png` ainda mostra duas manchas verdes no asfalto. A origem complementar `riversideAssets` foi então incluída na realocação e no teste. Essa última alteração NÃO foi validada em execução nem em captura.
- O último build concluído antecede a correção de `riversideAssets`. A tentativa de executar o teste ampliado foi rejeitada pela revisão automática por limite de uso, com indicação de nova tentativa às 10h57. Não há teste em execução aguardando resultado.
- Próximos passos desta correção: executar `tests/traffic-structures.test.ts`; corrigir quaisquer conflitos restantes; regenerar e compilar; repetir a captura da ponte em LOW/HIGH; verificar continuidade e preservação do inventário. Não considerar resolvida a passagem de copas até essas evidências existirem.

### Correção das copas validada

- O bloqueio temporário de execução foi liberado. `traffic-structures.test.ts` passou com dois testes: árvores da floresta e da margem contra os tabuleiros elevados, e tráfego comum/viaduto/estados da missão contra estruturas. Envelopes orientados conservadores são usados; esta verificação não substitui todas as reservas de passagem entre amostras.
- Build atualizado concluído, preservando 60 edifícios, 5.686 árvores de `referenceTrees` e 70 conexões de pedestres. A versão inclui a realocação de `riversideAssets`, ausente no build anterior.
- Capturas da ponte em `circulation-crowns-final-low/07-bridge.png` e `circulation-crowns-final-high/07-bridge.png` inspecionadas. As duas manchas verdes no asfalto não aparecem mais; não houve erros de navegador. Os modelos foram reposicionados, sem edição dos GLBs.
- Nove testes de continuidade e obstáculos passaram após a regeneração. O snapshot confere com a autoria; os testes de caminhos e mobiliário afetados continuam aprovados.
- A correção localizada das copas está validada. Permanecem as demais verificações estruturais, revisão dos outros setores e comparação final de desempenho; não declarar a aplicação integral concluída com base nestes testes localizados.

### Câmera do jogador e volumes ribeirinhos — 9 de setembro

- `Benchmark.playerCamera` e `review-reference --player-camera` aplicam os limites de zoom e deslocamento usados pela navegação, com alvo no chão. As coordenadas efetivas ficam em `applied-views.json`. São capturas da cena com a interface oculta, não testes de gestos ou da interface mobile.
- Inspecionadas individualmente quatro capturas HIGH em 390 × 844: hospital, estação, encontro campus–rio e ligação ao viaduto (`circulation-mobile-player-high`). O reservatório ainda apresenta uma margem excessivamente angular no enquadramento do campus; corrigir esse acabamento e revisar novamente. Esta rodada não encerra todos os setores nem a revisão LOW.
- `river-structure-volumes.test.ts` verifica cada segmento completo do piso renderizado de passeios e ciclovias, incluindo suas junções nas curvas, contra todas as peças de `roadStructures`. Usa caixas orientadas conservadoras com 1,90 unidade de altura livre (1,60 de ocupação e 0,30 de folga). Passou em 70,12 s; relatório persistido em `docs/validation/river-structure-volumes.json`. Não cobre todos os acessos interiores dos lotes ou a sustentação das cabeceiras.
- Os identificadores da execução integral anterior e da primeira auditoria isolada deixaram de existir. O cache do Vitest registra arquivos aprovados, mas a saída final integral não foi recuperada. Não usar esse cache como substituto de um novo relatório completo da versão final.
- Acrescentada preferência na chegada do ramal `acesso-carga` à portaria: o fluxo `ponte-industrial`–`patio-industrial` é prioritário. Marcação na faixa de chegada, seis unidades antes do nó, com altura derivada do pavimento. Teste e build em execução; revisão visual ainda pendente. A sinalização descreve a organização da cena estática, sem controle dinâmico dos veículos.

### Visibilidade da preferência industrial

- A primeira captura próxima HIGH revelou que as copas escondiam a marcação, embora sua implantação no asfalto passasse no teste. A geração do mapa passou a reservar também a projeção da sinalização pela câmera isométrica, usando os oito cantos dos envelopes das árvores. Árvores conflitantes são reposicionadas com as mesmas espécies e escalas, respeitando as reservas existentes.
- A geometria da marcação e sua reserva usam `industrialYieldGeometry`, evitando manter posições independentes. O teste de visibilidade usa a projeção de uma câmera ortográfica real sobre os modelos, independentemente do cálculo de projeção usado pela autoria.
- Quatro testes de prioridade industrial e conflitos de árvores/veículos com estruturas passaram em 98,87 s. Relatório em `docs/validation/industrial-priority.json`. Build posterior passou com 60 edifícios, 5.686 árvores e 70 conexões. Permanece o aviso existente de tamanho dos chunks.
- Captura próxima HIGH inspecionada em `circulation-gate-visible-high/04-gate-priority.png`: triângulo e linha descontínua totalmente visíveis, com a faixa e a junção livres. LOW e continuidade do snapshot ainda em verificação. Capturas são usadas para revisão visual, sem atribuir às amostras breves qualquer conclusão de FPS.
- Captura próxima LOW inspecionada em `circulation-gate-visible-low/04-gate-priority.png`: a mesma marcação permanece legível sem sombras. As duas rodadas encerraram sem erros de navegador. A versão inicial `circulation-gate-high` documenta a oclusão corrigida; a versão `circulation-gate-visible-high` é a comparação posterior.
- Nove testes de continuidade e obstáculos passaram em 91,40 s, com relatório em `docs/validation/gate-layout-continuity.json`. Incluem igualdade entre autoria e snapshot e preservação dos corredores após a redistribuição.
- Esta etapa encerra a sinalização de preferência da junção industrial e a visibilidade dessa marcação. Permanecem pendentes os demais encontros/sinalização, a revisão completa de cabeceiras e aterros, acabamento do reservatório encontrado no mobile, todos os enquadramentos finais e estados de missão, suíte integral/navegador e nova comparação de desempenho. Nenhuma dessas pendências foi dispensada pelos testes locais.

### Encaixe das plataformas nos apoios

- A auditoria da montagem encontrou uma folga de 0,14 unidade entre a laje da plataforma e o aparelho de apoio da travessa. O teste anterior à correção falhou nessa condição (`docs/validation/structure-assembly-before.json`), enquanto a ligação fundação–fuste–travessa passou.
- A origem era a utilização da mesma cota para o tabuleiro viário com vigas e a laje de passageiros, cuja espessura é 0,28. A espessura da plataforma agora é compartilhada entre a renderização da borda e o posicionamento do apoio. A travessa sobe até encostar na face inferior da laje; o fuste é alongado até a base da travessa. Piso, acessos e fundações mantêm suas cotas.
- Foram reutilizados os modelos existentes, sem edição de GLBs. O Blender MCP foi consultado e estava desconectado; isso não impediu a correção da implantação. A captura `platform-bearing-before/06-platform-supports.png` registra a compilação anterior, identificada por `index-CjNSdMe0.js`.
- Os dois testes de montagem e os seis testes de acesso às estações já passaram na execução atual. Restam os resultados de vãos/tráfego, build e comparação visual da versão corrigida antes de encerrar esta correção.
- A rodada terminou com 11 testes aprovados em 168,49 s (`docs/validation/structure-assembly-after.json`). Build passou, preservando 60 edifícios, 5.686 árvores e 70 conexões. Capturas próximas HIGH e LOW em `platform-bearing-after-high` e `platform-bearing-after-low` inspecionadas, sem erros de navegador: o encaixe do apoio central com a borda da plataforma está fechado. A revisão localizada não comprova todos os encontros e aterros das pontes.

### Margem do reservatório

- O contorno angular encontrado na revisão mobile foi substituído por curvas quadráticas concordantes nas margens naturais. Os dois encontros com a barragem permanecem em `[-42,84]` e `[-30,84]`, e a face da barragem continua reta. A mudança é na implantação do terreno e da água, sem alteração de modelos GLB.
- A margem se liga à altura real da água (6,33), voltando suavemente à encosta em uma faixa de 3,5 unidades. A preparação dos encontros com a barragem é preservada. Água e recorte da terra compartilham o mesmo contorno.
- Os dois testes iniciais de contorno e altura passaram; build passou preservando 60 edifícios, 5.686 árvores e 70 conexões. Acrescentada verificação por raycast da malha de terreno sobre o interior do lago, em execução junto com os testes de continuidade. A revisão visual e a validação ampliada ainda precisam terminar.
- A vista próxima revelou superfícies sobrepostas entre a inserção retangular do reservatório e o terreno principal. As regiões agora são unidas antes da triangulação, e o contorno da água é subtraído uma única vez. O raycast foi ampliado: pontos internos do lago não encontram terra; pontos externos da região encontram uma única camada.
- A primeira auditoria por malha excedeu o limite de cinco segundos. A medição separada localizou 16,6 s na construção do terreno, antes dos raycasts. O preparo passou a reutilizar alturas idênticas e descartar ruas fora do alcance máximo de sua influência. O teste de continuidade aprovou a igualdade do snapshot. A construção caiu para 2,1 s numa execução concorrente e 1,1 s numa execução isolada; isso é tempo de preparo local, não ganho de FPS medido.
- A iluminação das encostas passou a usar normais derivadas do campo de altura, evitando a influência desproporcional dos triângulos estreitos. Nove testes de margem/camada única e continuidade passaram em 73,64 s (`docs/validation/reservoir-bank-final.json`). As capturas `reservoir-smooth-high` mostraram melhora, mas ainda havia facetas de perto; foi então acrescentado refinamento localizado de arestas para 1 unidade nas encostas do reservatório, mantendo 2,8 no restante do terreno. Essa última etapa está em build/teste e precisa de revisão visual.
- `review-reference.mjs` agora registra também os scripts da compilação carregada em `configuration.json`, permitindo identificar a versão exata em futuras capturas. As capturas intermediárias de margem são evidências de diagnóstico, não aprovação final do acabamento.
- Refinamento compilado e validado: nove testes de malha do reservatório, superfícies viárias e volumes ribeirinhos passaram em 141,42 s (`docs/validation/reservoir-refinement.json`). Capturas próximas HIGH (`reservoir-refined-high`) e mobile com câmera do jogador (`reservoir-refined-mobile-high`) inspecionadas. A captura LOW foi inicialmente rejeitada pela revisão automática por limite de uso, mas a execução posterior foi liberada; `reservoir-refined-low/reservoir-bank.png` foi inspecionada, sem erros de navegador. A compilação dessas capturas é `index-CVKZ_CIp.js`.
- A correção do contorno, camada duplicada e ligação ao nível da água está aplicada. A malha refinada acrescenta geometria localizada; seu impacto de desempenho deverá entrar na comparação final, sem aproveitar os números de preparo como prova de FPS.

### Retenção e preferência nos cruzamentos — em aplicação

- As travessias agora registram a direção do braço em relação ao nó. Adicionadas linhas de retenção na faixa de chegada e triângulos de preferência nos ramais secundários; as vias principais seguem uma hierarquia explícita. A marcação acompanha a curva e a cota da própria via.
- As novas áreas são reservadas contra tráfego comum, viaduto e estados da missão de trânsito. O primeiro teste encontrou um veículo sem posição livre com o reposicionamento sequencial atual. A execução está diagnosticando o trecho; esta etapa ainda não está compilada nem validada e não deve ser considerada concluída.

### Sinalização, tráfego e entrada norte do bairro escolar

- O reposicionamento passou a tentar uma redistribuição limitada dos veículos vizinhos quando a busca direta não encontra vaga. Cada candidato continua derivado da rota e faixa originais. As tentativas que falham são revertidas; nenhum veículo é descartado para liberar uma marcação. Os testes incluem deslocamento em cadeia, espaço insuficiente sem mutação da origem e candidato numérico igual a zero.
- A retenção é colocada na faixa que chega ao cruzamento. As vias secundárias recebem triângulos de preferência, conforme a hierarquia declarada. A distância é ajustada pela geometria completa das pinturas e das faixas próximas, pois um afastamento fixo entre centros não liberava as pontas externas nas curvas. Braços sem espaço geram erro de autoria, em vez de omitir a sinalização.
- Corrigida também a orientação do triângulo na saída do lixão. A rodada `junction-priority-final.json` passou com 32 testes, incluindo os estados da missão de trânsito e a circulação do lixão. Essa rodada antecede o ajuste do traçado escolar descrito abaixo.
- A primeira revisão HIGH encontrou uma sobra da entrada norte de `bairro-escola`: a ligação à Avenida Botânica era seguida de uma pequena volta que criava outro encontro. A correção recorta somente os primeiros 20 metros usados para preparar a entrada, conservando as ligações do restante do bairro. Foram eliminadas duas travessias redundantes; restam 80 aproximações, sem sobreposição entre suas faixas. Não foi removida a rua que atende o bairro.
- `school-junction-final.json`: 24 testes aprovados após a correção, abrangendo marcações, rede viária, estados de trânsito, rebaixos e superfícies de calçadas. `school-junction-continuity.json`: 12 testes aprovados, incluindo preservação da conexão norte única e do percurso restante, igualdade entre autoria e snapshot, e volumes de tráfego contra estruturas.
- Build `index-CN5Yu8St.js` aprovado, com 60 edifícios, 5.686 árvores e 70 conexões de pedestres. O aviso existente de tamanho dos chunks permanece. Foram inspecionadas capturas HIGH dos três encontros próximos, hospital, campus–rio, ligação ao viaduto, lixão e portaria. As vistas LOW dos três encontros, hospital, campus–rio e viaduto também foram inspecionadas. As duas rodadas de captura terminaram sem erros de navegador (`junction-priority-final-high` / `junction-priority-final-low`). São vistas de inspeção; não substituem a revisão completa com a câmera normal do jogador nem medições de FPS.
- Na revisão LOW apareceu outra inconsistência: bicicletas e caiaques continuavam visíveis quando seus ocupantes eram removidos pelo perfil gráfico. Pessoa e equipamento agora pertencem ao mesmo grupo de exibição, incluindo o remo. A geometria dos modelos foi preservada; a seleção de qualidade é feita por grupo completo. Build `index-Bxlst6xF.js` aprovado. As quatro capturas de ponte e campus–rio em `visitors-grouped-high` e `visitors-grouped-low` foram inspecionadas, sem erros de navegador: os equipamentos visíveis têm seus ocupantes. O snapshot não mudou nesta correção de exibição. As amostras breves dessas capturas não são evidência de desempenho.
- Permanecem os critérios gerais do plano: revisão completa de encontros/aterros e do perfil ferroviário, todos os enquadramentos com câmera do jogador em desktop/mobile, estados e save da versão final, suíte integral, cenários de navegador e comparação de desempenho. Os resultados locais acima não encerram essas pendências.

### Contato real entre vigas e apoios — 10 de setembro

- A inspeção dos triângulos exportados de `prop.roadDeck` encontrou três travessas penetrando as vigas nos cruzamentos rebaixados: duas em `bairro-central` e uma em `rua-escola-sul`. O pavimento havia obrigado a baixar módulos de tabuleiro, mas a montagem dos apoios usava a cota anterior.
- `roadStructures.ts` agora conserva o deslocamento efetivo de cada módulo e aplica o mesmo ajuste à travessa e ao comprimento do fuste. Não houve edição de GLBs ou fontes Blender nesta etapa.
- `inspect-structure-bearing.mjs` usa malhas GLB reais e amostras interiores nos dois aparelhos de apoio. Os 69 conjuntos têm contato nas amostras, sem fundações flutuantes nos pontos de terra verificados (`structure-bearing-mesh.json`). O teste exige contato nos dois aparelhos de cada apoio viário/ferroviário; o contato das plataformas usa sua espessura compartilhada. Isto verifica montagem e folga, não cálculo de resistência estrutural.
- A suíte integral iniciada antes da correção encerrou com 166 testes aprovados e uma falha nesse teste novo (`circulation-suite-final.json`). A repetição na versão corrigida passou com seis testes de montagem e volumes (`structure-bearing-final.json`). A captura LOW `structure-bearing-after-low` foi inspecionada, assim como a HIGH anterior; ambas usam `index-ziWoybGw.js`. Não registrar aquela suíte integral como inteiramente aprovada.
- O diagnóstico adicional de distância a apoios considera apenas pilares pertencentes à própria rota. Valores sem apoio próprio não provam ausência de estrutura: encontros em aterro, contenções, apoios compartilhados, escadas e núcleos das estações precisam da classificação e revisão completa ainda pendente.

### Pavimento contínuo e abertura dos guarda-corpos

- A revisão LOW revelou manchas triangulares no cruzamento de `bairro-central` com `rua-escola-sul`. O amostrador trocava diretamente para a altura da linha de rua mais próxima, criando degraus na bissetriz entre aproximações. `roadHeightSampler` interpola alturas apenas na região comum dos corredores pavimentados, conserva as alturas nas linhas centrais e separa a amostragem do viaduto. Um caso adicional garante que uma rua estreita, fora de seu corredor, não controle o piso de uma rua mais larga.
- As superfícies subdivididas de asfalto/calçada passam a trocar diagonais internas para melhorar faces estreitas e a compartilhar vértices. Contornos e buracos são conservados; não se aplica esta mudança ao terreno geral. As pinturas viárias agora usam o mesmo campo de altura do pavimento. O experimento posterior de subdivisão por erro de altura gerou geometria excessiva e foi removido antes de compilar; não faz parte do aplicativo.
- `roadGuardrails.ts` recorta os guarda-corpos pela posição real da borda, considerando ruas próximas no mesmo nível e acessos de pedestres. O filtro anterior verificava só um ponto da linha central e podia conservar barras atravessando a abertura. Trechos remanescentes recebem postes nas extremidades e apoios intermediários com espaçamento máximo de 1,5. A busca dos recortes é fina, mas retas e curvas são simplificadas com tolerância de 0,01 antes de criar as barras.
- O teste dos guarda-corpos percorre cada segmento completo a cada 0,1 e verifica folga das ruas e dos acessos; não se limita aos centros dos postes. `road-floor-guardrail-final.json`: 18 testes aprovados, incluindo continuidade/snapshot, marcações e triangulação. `road-floor-integration.json`: 11 testes aprovados, incluindo encaixes, volumes ribeirinhos, calçadas, reservatório e combinação de geometrias. Após o caso adicional de corredores de larguras diferentes, `road-floor-unit-final.json` passou com oito testes locais.
- Build `index-CmJ8ZiRc.js` aprovado. Três capturas LOW em `road-guardrails-final-low` e quatro HIGH em `road-floor-guardrails-final-high` foram inspecionadas: ponte escolar, encontro campus–rio, cruzamento elevado próximo e, em HIGH, curva perto da estação. As manchas desaparecem nas vistas próximas e os guarda-corpos deixam as aberturas livres. Nenhum erro de navegador nessas capturas. São câmeras de inspeção; a rodada completa de câmera normal desktop/mobile ainda falta.
- A auditoria mais estrita da superfície **ainda encontrou 83 faces cujo centro difere mais de 0,02 da altura amostrada**, com máximo de 0,12561 perto de `[-5,53]` (`road-floor-height-errors.json`). O diagnóstico de inclinações também conserva faces estreitas de borda. A limpeza experimental de vértices quase colineares não resolveu o erro e não foi aplicada. A melhora visual não encerra esta verificação: revisar a tesselação de forma conformante, sem frestas entre faces nem crescimento excessivo de geometria, e repetir as medições e capturas afetadas.

### Navegador e evidências por execução

- A rodada de 18 cenários em desktop, mobile e tela pequena, na compilação `index-CmJ8ZiRc.js`, terminou com 17 aprovados. O cenário completo de missões foi interrompido ao gravar `docs/screenshots/situation-accessibility_02-solved.png`, com erro de sistema de arquivos `UNKNOWN`; o relatório não aponta uma falha de decisão nessa etapa. Não contar o teste interrompido como aprovado (`circulation-browser-final.json`).
- As capturas dos testes de narrativa, missões e configurações agora usam `testInfo.outputPath`, evitando sobrescrever os mesmos arquivos históricos a cada execução. `ECO_BASE_URL` permite testar a compilação já aberta, sem rebuild implícito pelo Playwright. A repetição do cenário interrompido ainda precisa ser concluída.
- Os resultados de desempenho anteriores não medem estas alterações. A comparação final deve ser executada depois de concluir o pavimento, sem testes ou outros trabalhos pesados simultâneos, mantendo os seis setores, três amostras e as configurações da base.

### Retomada da malha compartilhada e execução para o usuário

- `npm run build` completo passou, preservando 60 edifícios, 5.686 árvores e 70 conexões, sem entradas desconectadas. Compilação `index-CDO3K4MC.js`. O cenário desktop das dez missões passou na repetição, com salvamento/restauração e capturas em pasta própria (`circulation-browser-missions-retry.json`, 1 teste em 97,1 s). Os outros 17 cenários da rodada anterior passaram em `index-CmJ8ZiRc.js`; não apresentar a combinação como uma nova rodada integral sobre a mesma compilação.
- A próxima alteração de superfície está **no código, ainda sem build ou testes de integração**: `tessellateSurface` subdivide cada aresta compartilhada uma única vez e reaproveita o ponto nas duas faces, com refinamento localizado pela diferença de altura. A medição do piso de asfalto inteiro passou de 83 para zero centros de face com erro acima de 0,02. Isso não encerra a verificação: inclinações transversais ainda são medidas separadamente.
- O primeiro diagnóstico dessa tesselação expôs uma crista entre aproximações em ângulo. `buildRoadProfiles` recebeu restrições adicionais de altura apenas entre pontos de corredores pavimentados que se encontram, sem ligar ruas paralelas separadas. A medição seguinte continua com zero erros de altura nos centros, mas registra 513 faces com inclinação acima de 0,16. Esta é uma alteração global das cotas: validar as reservas, acessos, apoios, vãos, pinturas e inventário antes de regenerar o snapshot e compilar. O relatório `road-floor-anomalies.json` indica os pontos a investigar; não tratar a redução da contagem como aprovação de cada face.
- Em resposta ao pedido de executar o jogo, o preview em `http://127.0.0.1:4174/` foi verificado com HTTP 200 e sua abertura foi solicitada no painel do Codex. Ele serve a compilação `index-CDO3K4MC.js`, anterior às duas alterações de tesselação/perfis ainda em validação. Manter essa versão disponível durante a inspeção do usuário; a execução não representa conclusão do plano.

### Acessos restabelecidos, curvas contínuas e inspeção pela câmera do jogador

- A restrição transversal experimental descontava a distância entre duas ruas. Caminhos alternando entre elas se tornavam atalhos artificiais para propagar elevação: quatro entradas ficaram inacessíveis; a limitação ao vizinho mais próximo ainda deixou duas. Corrigido o custo para a distância física. A autoria voltou a produzir 70 conexões e nenhuma entrada inacessível (`ground-entrances-current.json`). O teste novo de aproximações paralelas amostradas em posições alternadas impede reintroduzir esse encurtamento da rampa.
- O amostrador agora suaviza também a troca entre segmentos de uma mesma rua curva. Antes, duas projeções equidistantes dentro da curva podiam ter cotas distintas. As contribuições são ponderadas pelo comprimento dos segmentos; a interpolação entre ruas se restringe a corredores que realmente se encontram. O peso se extingue além do bordo pavimentado para evitar valores dependentes da direção no canto externo do cruzamento.
- `road-floor-bends-unit.json`: 13 testes locais aprovados. `road-floor-bends-integration.json`: 23 testes aprovados de mapa, obstáculos, tráfego, montagem e guarda-corpos. O build completo passou com 60 edifícios, 5.686 árvores e 70 conexões: `index-CzLv0MCV.js`. Essa é a compilação atualmente servida pelo preview.
- A malha de asfalto medida tem 33.450 triângulos e 18.740 vértices. Nenhum centro de face ultrapassou o erro de 0,02; o máximo foi 0,008385. O preparo medido isoladamente pelo diagnóstico levou cerca de 2,62 s, sem equivalência com FPS (`road-floor-metrics.json`). Ainda restam 915 faces com inclinação acima de 0,16 e máximo aproximado de 0,318 perto de `[-6,91;55,78]`. Outra concentração ocorre em `[-1,96;51,09]`, entre Avenida Central e acesso ao campus. **A continuidade de altura está corrigida; a inclinação transversal ainda não está aprovada.**
- A nova inspeção dos apoios, anterior à realocação industrial abaixo, encontrou 69 conjuntos, sem falha nas amostras de contato ou fundações flutuantes. A lista de vãos sem apoio próprio ainda precisa da classificação de encontros, contenções e apoios compartilhados; não corresponde a uma auditoria estrutural integral.
- Foram geradas e inspecionadas todas as 40 capturas (dez vistas por configuração, agrupando 8/10 e 9/11): `circulation-grounded-player-high`, `circulation-grounded-player-desktop-low`, `circulation-grounded-player-mobile-high` e `circulation-grounded-player-mobile-low`. Desktop 1672 × 941, mobile 390 × 844, perfis HIGH/LOW, todas com os limites reais da câmera. `configuration.json` identifica `index-CzLv0MCV.js`; `applied-views.json` registra o enquadramento efetivo após o limite de zoom. Todos os `errors.json` estão vazios. A interface foi ocultada para a inspeção do mapa; essas imagens não substituem os testes de gestos/interface ou estados de missão.
- A quadra está separada das ruas e as linhas continuam legíveis no enquadramento em que o campo é reconhecível. Costa, hospital, estação, passagens ribeirinhas e arco superior oeste estão presentes nas quatro configurações. Os dois problemas concretos descobertos nessa rodada são registrados abaixo; portanto, as capturas não constituem aprovação geral do plano.

### Copas nas áreas de carga e hipótese visual do reservatório (revista abaixo)

- A captura HIGH das fábricas mostrou vegetação ocupando o pátio diante das docas. `inspect-industrial-vegetation.mjs` confirmou 25 conflitos entre os envelopes das copas e as áreas de carga/caminhos de funcionários (`industrial-vegetation-before.json`). A reserva inicial considerava principalmente o tronco e podia ser violada pela redistribuição posterior das árvores afastadas das pontes.
- `crownConflict` agora inclui a área completa dos quatro pátios e os caminhos de funcionários, com folga de 0,3. As árvores afetadas são reposicionadas pelo mesmo algoritmo, conservando espécie, escala e população. `industrial-vegetation-integration.json`: oito testes aprovados, incluindo a ausência desses conflitos nas quatro fábricas, total de 5.686 árvores, prioridade da portaria, reservas e estruturas. **Falta regenerar o snapshot, compilar e repetir as capturas industriais com essa correção.** As 40 imagens citadas acima precedem essa mudança.
- A comparação mobile detectou outro caso pendente: `circulation-grounded-player-mobile-low/08-10-campus-crossing.png` mostra o reservatório com aparência de terra, enquanto a mesma vista HIGH mostra a água. As câmeras registradas são idênticas. Na vista anterior `07-bridge`, parte da água permanece visível em LOW. Não há erro de console registrado. Reproduzir a sequência HIGH → LOW e as duas câmeras isoladamente, conferir frustum, materiais e interseções reais com o terreno antes de alterar a geometria ou o shader. Não tratar o teste vertical de ausência de terra no lago como prova de renderização equivalente entre os perfis.
- A tentativa de medir uma ponderação linear de distância entre ruas foi rejeitada pela revisão automática por limite de uso da conta. A execução não ocorreu. A alteração experimental de uma linha foi retirada, mantendo o amostrador correspondente à compilação e aos testes acima. Nenhum resultado foi atribuído a essa tentativa. O bloqueio impede novas execuções por esse canal enquanto persistir; inspeção de arquivos e imagens existentes foi concluída normalmente.
- Permanecem todos os critérios do plano: corrigir a inclinação transversal e o reservatório em LOW, integrar a vegetação industrial, finalizar a revisão estrutural, verificar estados/save e interface, executar suíte integral/auditoria/navegador sobre a mesma versão final e medir os seis setores em condições equivalentes à base.

### Revalidação do reservatório e integração das copas — 10 de setembro

- A hipótese de reservatório ausente em LOW acima foi **refutada**, não corrigida por uma mudança de shader. A captura histórica e a reprodução têm o mesmo pixel azul `[37,159,181]` em `(218,41)`; a interpretação visual anterior estava errada. As três vistas da reprodução isolada foram inspecionadas. `reservoir-navigation-reproduction/report.json` registra a sequência LOW → HIGH → LOW, nove capturas e 27 amostras projetadas sobre a água, todas azuis, sem erros de navegador, no build `index-BXRLG4I9.js`.
- A rejeição automática por limite de uso foi revalidada; as execuções seguintes foram autorizadas e concluídas, sem consumir reset. Não há bloqueio de execução atual.
- A vegetação industrial foi integrada: build `index-BXRLG4I9.js` aprovado, com 60 edifícios, 5.686 árvores e 70 conexões naquele snapshot. `industrial-vegetation.json` não encontrou conflitos. As três capturas HIGH de pátio, portaria e lixão em `industrial-crowns-clear-high` foram inspecionadas; as áreas de carga ficaram livres das copas. As alterações de piso posteriores ainda exigem novo build e revisão das configurações restantes.
- A execução solicitada pelo usuário foi conferida com HTTP 200 em `http://127.0.0.1:4174/`, e o cenário 3D com a interface da missão de poluição estava carregado no navegador. Isso confirma a execução dessa compilação, não a conclusão do plano.

### Transição de piso e implantação da torre — em validação

- As restrições transversais agora consideram todos os pares de amostras nos corredores sobrepostos, usando a distância física integral. O custo não é descontado. Isso evita diferenças excessivas nas seções oblíquas sem criar os atalhos artificiais de propagação de altura do experimento anterior.
- A transição entre ruas usa peso inversamente proporcional à distância, com atenuação quadrática e margem de dois metros. O peso e sua derivada se anulam no limite de influência; a chegada de uma terceira rua não cria a crista produzida pelo corte anterior. A tolerância adaptativa de altura na tesselação passou a 0,004.
- Diagnóstico atual do asfalto: 37.226 triângulos, 20.745 vértices, zero faces acima do limiar diagnóstico de inclinação 0,16, zero centros com erro superior a 0,02 e erro máximo de 0,004268 (`road-floor-metrics.json`). O limiar de diagnóstico não substitui as metas longitudinais de 8% nem a revisão dos vãos. `road-floor-smooth-unit.json`: 13 testes aprovados. O tempo de preparo desse diagnóstico concorrente não é uma medição de FPS.
- A torre 8 continuava sem acesso na tentativa de implantação `[22,18]`: a busca de lote a deslocava para `[13,294;-3,018]`, num quarteirão cercado por aproximações elevadas. Sua implantação passou a partir de `[44,39]`, perto do setor hospitalar. A busca integral de acessos está em execução; não considerar as 70 conexões do build anterior como evidência desta alteração.
- Permanecem os critérios integrais do plano: acessos e inventário atuais, montagem/aterros/vãos, revisão dos 11 recortes e estados nos quatro perfis de tela/qualidade, suíte integral, auditoria, 18 cenários de navegador na mesma compilação e comparação de desempenho em seis setores.

### Piso suavizado, acessos e revisão das quatro configurações

- A implantação da torre 8 em `[44,39]` foi integrada. O pequeno lote cercado pelas rampas centrais foi reservado como área sem edificação: somente deslocar a torre fazia a casa 21 ocupar o mesmo ponto inacessível. A casa voltou a um lote atendido, e o preparo voltou a produzir 60 edifícios, 5.686 árvores e 70 conexões. A reserva conserva a escala e a quantidade dos edifícios.
- As 40 capturas em `circulation-smooth-player-desktop-high`, `desktop-low`, `mobile-high` e `mobile-low` foram inspecionadas (dez setores por configuração, agrupando 8/10 e 9/11). São da compilação `index-BY4GWvJt.js`, com câmera do jogador e interface oculta; os quatro relatórios não registram erros de navegador. As cinco últimas imagens mobile LOW foram efetivamente revistas na retomada, depois de uma saída de ferramenta truncada. Campo, acessos, margens, separação das redes e ferrovia permanecem legíveis. A água do reservatório também aparece em LOW.
- Quatro vistas HIGH próximas em `circulation-smooth-junctions-high` foram revistas. O diagnóstico `structure-bearing-mesh.json` registrou 70 apoios, sem ausência de contato nem fundações flutuantes nas amostras. A classificação dos trechos em contenção, cabeceiras e apoios compartilhados ainda é necessária; o relatório de distância ao apoio próprio não aprova esses casos por si só.
- A suíte integral anterior registrou 176 de 179 testes aprovados (`circulation-smooth-full-suite.json`). Duas leituras completas de geometria excederam o limite de cinco segundos; esses dois testes receberam 30 segundos, preservando suas verificações. O terceiro caso encontrou um caminhão sobre a pintura de preferência da portaria: a redistribuição de tráfego agora reserva essa pintura em todas as posições candidatas. Os dez testes dos três arquivos passaram na repetição (`circulation-smooth-failure-fixes.json`). Não contar essa combinação como uma suíte integral aprovada.
- A versão seguinte `index-BYPiwpbL.js` foi encontrada no `dist` e carregou o cenário e a interface em `http://127.0.0.1:4174/`. O identificador do processo antigo de build já não existia; sua saída final não foi recuperada. Uma nova compilação completa está sendo executada para obter evidência terminal, junto da suíte integral atual.
- Acrescentadas ao diagnóstico opcional câmeras superior/lateral e leitura dos estados renderizados. O script `review-circulation-states.mjs` usa contextos isolados e a compilação servida, sem importar módulos de desenvolvimento no navegador ou tocar na partida aberta pelo usuário. As capturas de estados e a rodada de navegador ainda precisam terminar e ser revisadas.
