# Auditoria do mapa e plano de correção

Aplicação registrada em [APLICACAO-AUDITORIA-MAPA.md](APLICACAO-AUDITORIA-MAPA.md). O diagnóstico abaixo descreve o estado anterior às correções.

Data: 7 de setembro de 2026. Escopo: mapa atualmente montado por `ReferenceCity`, modelos nele usados, circulação, relevo, água, situações, navegação e custo de renderização. Esta etapa não modifica o jogo: produz diagnóstico e planejamento.

## Conclusão

O mapa tem uma composição reconhecível e a rede de ruas locais está conectada em planta, mas ainda não constitui uma circulação coerente em três dimensões. A principal causa é construir pistas, alturas, calçadas, acessos, mobiliário e situações com regras independentes. Corrigir apenas posições individuais continuará produzindo regressões.

A próxima aplicação deve primeiro estabelecer uma descrição única dos terrenos e corredores de circulação. Depois, reconstruir encontros e acessos a partir dela; só então reposicionar modelos e terminar o polimento. Preservar a composição, a variedade e a densidade, redistribuindo elementos quando necessário.

## Evidências e limites da análise

- Inspeção do código ativo, seis capturas atualizadas: visão geral, rio, campus, estação, indústria e costa.
- Auditoria reproduzível: `node scripts/audit-map-plan.mjs`. Resultado em `map-audit-evidence.json`.
- Inventário atual: 60 edifícios, 5.686 árvores na lista principal, 164 placements na lista de assets, 3.764 componentes de detalhes e 1.674 componentes de visitantes. As listas têm funções distintas; os 164 placements incluem edifícios. Não somar tudo como modelos únicos.
- Referência de testes da etapa anterior: 78 testes unitários aprovados; 16 testes de navegador passaram na primeira execução e os 2 restantes passaram após recolher o painel pelo controle real da interface. Isso comprova os fluxos testados, não a ausência de problemas espaciais.
- As seis capturas desta auditoria terminaram sem erros de página/WebGL. Não foi repetida a suíte inteira nesta etapa, pois não houve alteração de produção.
- Medidas usam unidades do mundo, tratadas como metros pelos scripts de modelagem. Inclinação é desnível dividido pela distância horizontal. As metas abaixo são critérios internos de desenho do jogo, não uma certificação de engenharia.
- Testes por envelope em planta geram candidatos: contato de rampa com a base do edifício pode ser intencional. Confirmar volume, altura e função antes de remover um elemento.

## Problemas encontrados

Prioridades: P0 = quebra de continuidade ou espaço físico; P1 = circulação/funcionalidade/coerência; P2 = acabamento, legibilidade ou otimização.

| ID | Prioridade | Evidência e efeito | Correção proposta |
|---|---|---|---|
| A01 | P0 | Início do `viaduto-leste` em altura 0; rua de conexão em 2,35. Conexão em planta com degrau vertical. | Nó compartilhado com uma única cota, curva vertical de aproximação e tabuleiro contínuo. Testar ambos os bordos, além do eixo. |
| A02 | P0 | `acesso-industrial` e `patio-industrial` chegam a ter 8,15 unidades de relevo acima da pista. `routeHeight` ignora `terrainY`. | Traçar o acesso sobre o relevo ou abrir um corte/túnel explícito. Modelar taludes, encontros e drenagem. Não esconder a pista dentro da montanha. |
| A03 | P0 | Inclinações máximas amostradas: margem central 50,9%, ligação hospital 45,6%, bairro central 36,2%, viaduto 34,4%, trem 26%. | Substituir elevação por proximidade do rio por perfis longitudinais definidos por trecho. Reservar espaço para rampas; suavizar mudanças de inclinação. |
| A04 | P0 | A auditoria dos pilares encontra 20 pares estrutura/pista em planta. Dois são pilares do monotrilho, índices 54 e 72, sobre o `acesso-futuro`; a captura do campus mostra apoios na circulação. Outros pares podem estar sob tabuleiros na mesma cota e exigem classificação 3D. | Definir vãos pelas travessias e excluir pilares do volume livre de ruas, ciclovias e calçadas. Usar pórticos ou vigas com apoios laterais onde necessário. |
| A05 | P1 | 84 postes da lista ribeirinha têm centro a apenas 0,10 unidade do eixo nominal da ciclovia, cuja meia largura é 0,675. É uma contagem por corredor, não uma contagem de todos os postes do jogo. | Criar faixa de mobiliário externa; afastar postes usando a normal real do trajeto e verificar o envelope completo da base. |
| A06 | P0 | 8 edifícios não recebem o acesso automático porque a distância excede 15. Entre eles observatório, torre-jardins, laboratório circular e casas do campus. | Rede interna de pedestres conectada às entradas e ao transporte. Nenhum acesso pode simplesmente deixar de existir por exceder um limite arbitrário. |
| A07 | P0 | Outros 11 acessos são sinalizados por desnível, travessia da máscara de água ou passagem por lote. `torre-7` cruza `torre-3`; `casa-9` cruza `torre-1`; `casa-15` cruza `casa-14`. Acesso de `torre-0` chega a 71,4% de inclinação. | Resolver trajetos com obstáculos, partindo de sockets de porta e terminando na calçada, não no eixo do asfalto. Criar patamares e rotas alternativas. Validar a água contra a geometria real. |
| A08 | P1 | Pistas são fitas independentes sobrepostas; calçadas e linhas não são recortadas por uma geometria de cruzamento. Faixas de pedestres usam índices fixos 4 e 96. | Gerar áreas de cruzamento próprias, cortar bordas internas e guarda-corpos, desenhar faixas e linhas de retenção pelos braços do encontro. |
| A09 | P1 | Trechos de ciclovia são omitidos quando `blocked()` encontra rua baixa. Isso evita uma pintura sobre a outra, mas não define a ligação ciclável nem a prioridade. Calçadões continuam como fitas independentes. | Cada encontro deve ter tipo explícito: travessia sinalizada, passagem inferior ou desvio contínuo. A rede ciclável deve manter conectividade e largura livre. |
| A10 | P1 | `margem-central` fica elevada em todos os 101 pontos porque acompanha a água. A regra interpreta proximidade de margem como necessidade de ponte. | Separar avenida ribeirinha apoiada no terreno de ponte sobre o canal. Elevar somente vãos e aproximações designados. |
| A11 | P1 | Plataformas geradas medem 5,6; composição ferroviária nominal mede 19,22. A cobertura maior da estação central não resolve o tamanho dos terminais. | Dimensionar plataformas pelas portas e comprimento do trem. Alongar terminais e ajustar área de frenagem, batentes, embarque e cobertura. |
| A12 | P1 | Parada Campus do Futuro: altura 5,56, escada projetada de 8,34 e rua mais próxima a 1,50. Há risco de a escada ultrapassar a rua e o caminho retornar. Só escadas são previstas para plataformas altas. | Resolver circulação e implantação da estação juntas; reservar escada com patamares e elevador/rota acessível. Conferir a trajetória completa e o espaço junto à rua. |
| A13 | P1 | Plataformas elevadas descem ao chão antes de voltar a ruas elevadas: Jardim Botânico tem plataforma 2,023 e acesso viário 2,35; Distrito Industrial 0,885 e acesso 2,35. | Usar ligação direta na cota compatível quando possível; evitar descer para depois subir. Calcular acessibilidade de ponta a ponta. |
| A14 | P1 | Vagões acompanham altura mas não inclinação; veículos do viaduto também têm apenas yaw. Espaçamento de tráfego usa distância entre centros, não dimensões de carro/ônibus. | Aplicar orientação pelo perfil longitudinal e colocar veículos por faixa, comprimento e folga. Reservar cruzamentos e paradas. Tráfego estático é aceitável; simulação completa não é requisito desta correção. |
| A15 | P0 | Modelos de `nature_02` têm envelopes dentro de `comunidade-a-recuperar` nos três estados. Árvores e placa de `health_02` intersectam o envelope de `industria-0`. | Reservar lote da situação pela união dos envelopes de todos os estados; reposicionar a situação ou seu edifício hospedeiro e validar volumes reais. Contatos de rampas com seus prédios devem permanecer como encaixes permitidos. |
| A16 | P1 | `pollution_02` injeta veículos em uma reta local com altura fixa. Comentário diz que o tráfego de fundo é filtrado, mas `ReferenceCity` concatena as listas sem excluir essa região. | Situar congestionamento e solução na mesma rota/faixa do tráfego de fundo; excluir a ocupação de fundo no trecho da missão. Validar estados inicial, provisório e resolvido. |
| A17 | P1 | Reservas de edifícios não incluem todos os props e detalhes. Visitantes/jardineiras usam offsets fixos em u/v; o filtro final de móveis testa proximidade de edifícios, apesar de prometer verificar ruas. | Implantar por sockets e polígonos de uso; validar postes, bancos, árvores, pessoas, equipamentos e detalhes com altura e margem de segurança. |
| A18 | P1 | Praia termina em corte transversal reto; canal poluído aparece como faixa de cor delimitada na foz. Geometria da terra, máscara `onReferenceLand`, areia e água têm limites independentes. | Uma costa mestre para terra, água, areia e colocação de objetos; extremidades de areia afuniladas e transição de poluição por distância real à foz. |
| A19 | P1 | Barragem/reservatório, quedas e canal são definidos separadamente. `riverWidth` salta em 81/84; funções de rio/canal tratam valores acima do último nó como primeiro intervalo. | Perfil hidráulico contínuo; interpolação segura com clamps nas extremidades, largura gradual, níveis consistentes e conexão explícita da queda ao rio. O erro acima do último nó é latente; não foi observado em uma captura corrente. |
| A20 | P1 | Pátio de contêineres mantém fileiras repetidas; coleta e ruas foram ajustadas sem uma validação de corredores de manobra/portões. Captura mostra pouco espaço e transição pouco clara entre depósito, rua e carga. | Definir acesso de serviço, circulação, docas, área de manobra e limite do depósito; orientar portas dos contêineres para corredores. Confirmar sobreposições pelo envelope antes de mover. |
| A21 | P1 | A floresta substitui tocos quando a missão é resolvida, mas o solo de desmatamento e as escavadeiras permanecem estáticos. Recuperação visual fica parcial. | Modelar conjunto de estado do distrito: vegetação, solo, equipamentos e resíduos. Manter apenas o que a narrativa justificar após a solução. |
| A22 | P1 | Painel “Nossa Jornada” pode cobrir marcadores; testes passaram ao recolhê-lo. Câmara de missão usa alvo y=0,3 e posição y=10 mesmo para âncoras elevadas; clamp atual cobre vista geral/intro. | Layout de marcadores que respeite painéis; alternativa de seleção explícita no painel. Enquadrar missões pelo envelope e altura real e validar trajetos da câmera, não só destinos. |
| A23 | P2 | Captura Ultra: 677 chamadas e aproximadamente 5,15 milhões de triângulos; primeira amostra inclui pausa de 815 ms. `ShadowCache` percorre toda a cena a cada frame com sombras. | Medir CPU/GPU e carregamento separadamente; guardar referências às luzes, preparar materiais progressivamente e revisar agrupamento/LOD. Preservar densidade visível como restrição; não otimizar apagando regiões. |
| A24 | P2 | Escalas, planícies vazias, árvores repetidas e superfícies abruptas ainda variam entre distritos. Há parâmetros de detalhes que não filtram todas as listas estáticas. | Revisão visual por setor e perfil gráfico depois da geometria: materiais coerentes, transições de solo, variação orientada à função, LOD por entidade completa e objetos essenciais preservados. |

## Planejamento de aplicação

### Etapa 1 — Base espacial única e auditoria de volumes

1. Definir `TerrainSurface`, `WaterRegion`, `RouteNode`, `RouteEdge`, `Crossing`, `Lot`, `Entrance`, `Station`, `ReservedVolume` e identificadores estáveis.
2. Separar pontos de autoria da amostragem. Amostrar por distância/curvatura; parar de usar índice 40/56/99 como localização funcional.
3. Registrar cota, tangente, largura, uso, restrições e conexões para cada corredor. Compartilhar nós de verdade, em vez de apenas encostar splines.
4. Calcular footprints e envelopes verticais a partir dos modelos; tratar segmentos degenerados e colisões entre arestas, não apenas vértices/pontos amostrados.
5. Construir relatório de inválidos por ID, coordenadas e captura. Classificar contatos esperados (rampa/fachada, ponte/apoio) e colisões proibidas.

Entrega: dados de autoria preservando o desenho atual e auditoria que capture A01–A24. Sem redistribuir edifícios antes de conhecer os corredores definitivos.

### Etapa 2 — Relevo, cotas e rede rodoviária

1. Resolver A01 e A02 primeiro: encontro do viaduto e trechos industriais enterrados.
2. Projetar perfis longitudinais pelas distâncias reais. Meta inicial: ruas usuais até 10%, trechos excepcionais até 12%; ferrovia até 4%. Ajustar escala/traçado se necessário, documentando exceções intencionais.
3. Compartilhar cotas dos cruzamentos; impedir degraus maiores que 0,02 nos encontros de superfícies.
4. Criar cruzamentos como superfícies únicas; cortar faixas, calçadas e guarda-corpos internos.
5. Separar ponte, rua apoiada, viaduto e túnel. Definir espessura e altura livre em função dos veículos reais, com margem. Só criar apoios fora dos corredores protegidos.
6. Dar destino ao trecho regional que sai do enquadramento: continuação do terreno e da estrada ou portal claramente identificado, fora dos limites visíveis. Fechar circuitos locais com retornos funcionais.

Aceite: rede 3D conectada; nenhuma pista enterrada; nenhum pilar dentro do volume de passagem; inclinações dentro das metas; carros apoiados e orientados sobre a pista.

### Etapa 3 — Pedestres, bicicletas e entradas

1. Traçar corredor ribeirinho contínuo com três faixas distintas: pedestres, bicicletas e mobiliário.
2. Gerar offsets por normais e corrigir auto-interseções nas curvas. Resolver cada encontro com rua como um objeto de cruzamento.
3. Remover os 84 conflitos nominais de postes e testar cada objeto pela largura livre, incluindo folhagem e bancos.
4. Resolver os 8 acessos omitidos e os 11 problemáticos com rotas sobre áreas caminháveis. Usar o socket real de entrada e conexão à borda da calçada.
5. Criar circulação interna do campus, jardins, escola, indústria e reciclagem. Garantir acesso a quadras, playground, mirantes, farol e píer conforme a função de cada local.
6. Para caminhos acessíveis, meta interna de inclinação até 8%; adicionar patamares/desvios/elevador quando necessário. Manter pelo menos 1,2 unidade livre nos caminhos comuns, ajustando à escala dos personagens.

Aceite: cada entrada pública alcança a rede sem atravessar lote, água ou obstáculo; ciclovia sem interrupções não tratadas; corrimãos/cercas têm aberturas onde existe passagem.

### Etapa 4 — Ferrovias e estações

1. Manter a linha regional com terminais visíveis e o circuito do campus; especificar onde embarcar, desembarcar e trocar de modo.
2. Dimensionar plataformas pelo trem real, com folga. Reposicionar cobertura, batentes, placas e portas em conjunto.
3. Implantar plataformas e acessos dentro de uma reserva integral. Resolver A12/A13 sem escadas que atravessem pista ou caminhos que retornem por baixo do próprio acesso.
4. Adicionar alternativa acessível à estação elevada do campus; conferir folga do trem, plataforma e guarda-corpos.
5. Recalcular orientação dos vagões em inclinações, vão entre carros e posição dos apoios. Verificar encaixe da composição nas curvas.

Aceite: trem completo cabe no embarque; portas abrem para a plataforma; acessos alcançam o destino na cota correta; nenhum apoio ou cobertura invade gabarito do trem.

### Etapa 5 — Lotes, situações e continuidade narrativa

1. Reservar a união espacial dos estados inicial/provisório/resolvido antes de colocar edifícios e vegetação.
2. Corrigir `nature_02`, `health_02` e auditar todos os demais estados, incluindo os detalhes geométricos que não são GLBs.
3. Conectar congestionamento ao traçado da via, removendo tráfego duplicado na região da missão.
4. Definir matriz de mudanças por missão: o que aparece, desaparece, muda material e persiste. Garantir consistência após salvar, recarregar e trocar perfil.
5. Reflorestamento altera solo e equipamentos conforme a narrativa; tratar limpeza, emissões e bairro degradado sem prometer transformações que a decisão não realizou.
6. Derivar câmera e marcador dos envelopes atuais. Testar painel aberto/fechado e seleção pelo painel em desktop, tablet, celular e tela pequena.

Aceite: nenhuma situação invade prédios; todos os estados são legíveis; cena e narrativa concordam; nenhuma missão fica inacessível por enquadramento ou sobreposição da interface.

### Etapa 6 — Água, costa e acabamento dos modelos

1. Unificar polígonos de terra e água usados pelo render e pela implantação. Eliminar divergências da máscara aproximada.
2. Resolver reservatório → barragem → queda → rio → foz. Suavizar larguras e níveis; evitar terminações fora de contexto.
3. Reconstruir ponta da praia e espraiamento pela linha real de costa, afinando espuma e areia nas extremidades. A poluição deve se dispersar na foz, sem faixa retangular.
4. Revisar apoios do farol/píer, calado e posição dos barcos; conexão entre areia, passeio e acessos.
5. Polir individualmente modelos afetados: estações/plataformas, pontes/encontros, túneis, docas/contêineres e centro de reciclagem. Usar Blender MCP nos modelos; manter fonte reproduzível e versões de qualidade compatíveis.
6. Só depois variar vegetação, solo, janelas e superfícies. Preservar identidade futurista e densidade, evitando esconder defeitos estruturais com árvores.

Aceite: sem cortes abruptos ou superfícies flutuantes nos enquadramentos permitidos; materiais legíveis em aproximação e visão geral; modelo principal e econômico compartilham encaixes.

### Etapa 7 — Desempenho e regressão final

1. Perfil por distrito e estado, com aquecimento separado. Medir por pelo menos 30–60 segundos em dispositivos definidos: tempo de CPU/GPU, p50/p95/p99, chamadas, triângulos e memória.
2. Retirar travessia integral da cena no `ShadowCache`; atualizar referências quando a luz é recriada. Comparar antes/depois, sem invalidar sombras das soluções.
3. Pré-calcular implantação em build ou cache, reduzir trabalho síncrono de importação e preparar shaders sem uma pausa concentrada no primeiro enquadramento.
4. Aplicar instancing, materiais compartilhados, culling e LOD sem alterar a continuidade ou a quantidade aparente dos elementos essenciais. Perfis baixos podem simplificar geometria e efeitos; não apagar estações, acessos ou sinais da missão.
5. Meta a medir: p95 próximo de 16,7 ms no desktop de referência após aquecimento; perfil de fallback explicitamente medido no celular. Não prometer FPS universal a partir das capturas curtas atuais.
6. Executar testes de geometria, estados, navegação, salvamento, qualidade e perda/restauração de contexto; conferir imagens da cena inteira e detalhes.

## Cobertura mínima para considerar a aplicação concluída

| Camada | Validação obrigatória |
|---|---|
| Topologia | Uma rede rodoviária conectada em 3D; todos os extremos têm nó, terminal ou saída regional identificada. |
| Cotas | Continuidade de altura e tangente, limite de inclinação, folga dos tabuleiros, ausência de pista enterrada. |
| Colisões | Envelopes reais de edifícios, veículos, trens, pilares, móveis e todos os estados de missão. |
| Pedestres | Entrada → passeio → cruzamento → destino; nenhuma rota omitida, degrau surpresa ou obstáculo. |
| Ferrovia | Plataforma compatível com trem, acesso público, batentes e folgas na curva. |
| Água | Terra e máscara coerentes; origem/queda/foz contínuas; barcos e costa com apoio adequado. |
| Narrativa | Dez missões em todos os estados, recarga de save e opções temporárias; cenários coerentes com as escolhas. |
| Interface | Marcadores utilizáveis ou alternativa evidente, com painéis abertos e fechados, em todos os tamanhos suportados. |
| Gráficos | Todos os perfis, transições sem perda de modelos essenciais, sombras corretas e objetos completos. |
| Inspeção visual | Visão geral, seis distritos, terminais, entradas, extremos do mapa e transições de câmera; repetir após qualquer mudança de implantação. |

## Ordem e controle do trabalho

Dependência principal: base espacial → relevo/ruas → caminhos → estações → estados de missão → água/acabamento → desempenho e aceite final. A costa mestre precisa ser definida na base, embora seu acabamento seja posterior.

Aplicar em incrementos por setor, cada um com diagnóstico antes/depois e testes. Não considerar uma etapa concluída somente porque o build passou. Manter lista de pendências por ID e registrar contatos intencionais com justificativa. Revisar novamente setores vizinhos quando um corredor ou lote mudar.

Não incluir neste plano multiplayer, backend, física completa, novos objetivos narrativos ou redução indiscriminada da cidade. Não há correções de produção aplicadas nesta auditoria.
