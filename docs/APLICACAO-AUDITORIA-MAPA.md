# Aplicação da auditoria espacial

7 de setembro de 2026. Referência: `PLANO-AUDITORIA-MAPA.md`.

## Alterações implementadas

- Cotas compartilhadas nas ruas; aproximações calculadas em distância real, com inclinação máxima de 10%. O viaduto começa na cota 2,35 da ligação e sobe a até 8%. A ferrovia passou a um tabuleiro contínuo de 5,40, sem as antigas rampas de 26%. A cobertura acompanha a nova cota.
- Cortes de terreno ao longo dos acessos industriais, com transição em talude. A altura do terreno deixa de encobrir o eixo da pista.
- Exclusão de apoios dos corredores rodoviários; interrupção dos guarda-corpos nos encontros. As superfícies das ruas locais usam o mesmo campo de alturas também nos bordos. Linhas centrais não atravessam cruzamentos; faixas são posicionadas por distância da extremidade.
- Ciclovias mantêm todos os segmentos; encontros com vias baixas recebem aproximações graduais. Postes ribeirinhos passam à faixa externa. A filtragem de mobiliário considera ruas e footprints dos edifícios.
- Rede de pedestres calculada com obstáculos, sem os antigos atalhos retos. Todas as 60 entradas chegam a uma calçada. São usados caminhos de 1,40 de largura, rampas com limite interno de 8% ou ligação vertical quando o desnível exige. Árvores respeitam as novas passagens.
- Validação dos lotes inclui bordas e espaço diante das entradas. Cruzamentos entre arestas contam como colisão mesmo sem vértices sobrepostos. Segmentos degenerados têm distância válida.
- Plataformas de 22 metros acompanham a curva dos trilhos. Na travessia do rio, a plataforma é elevada e o acesso público permanece em terra. Elevadores substituem as escadas que ultrapassavam a rua; pilares sobre a água descem abaixo do nível do rio.
- Dois módulos originais de elevador produzidos via Blender MCP: shaft vertical e patamar com portas, botoeira, soleira tátil, cobertura e painel solar. O shaft adapta a altura; portas e cobertura preservam a escala. Fontes em `assets-source/station-lift-*.blend`; GLBs otimizados em `public/assets/models`.
- Reservas dos estados de `nature_02` e `health_02` impedem edifícios e vegetação de ocupar seus equipamentos. A auditoria distingue encaixes intencionais das rampas.
- A situação de congestionamento usa curva, faixa, cota e orientação da avenida; o trecho exclui tráfego duplicado. Veículos do viaduto recebem inclinação longitudinal.
- Reflorestamento altera solo, substitui tocos e retira escavadeiras do desmatamento. Visitantes usam os caminhos atuais, e jardineiras são orientadas pelos edifícios.
- Polígonos de terra compartilhados pela implantação e pela renderização. Interpolação dos rios tem clamps seguros; a largura do reservatório é gradual. Areia afunila nas pontas; o canal dispersa sua cor junto à foz.
- Contêineres organizados em fileiras com corredores de serviço e pilhas apoiadas pela altura medida do modelo. O pátio tem superfície delimitada.
- Câmeras das missões consideram a altura da âncora. O painel da jornada inicia recolhido, mantendo seu botão de abertura e seleção alternativa das situações.
- `ShadowCache` consulta a referência da luz, sem percorrer a cena a cada frame. `predev` e `prebuild` geram um snapshot validado: o navegador não executa novamente a busca de lotes, caminhos e árvores.
- Mantidos 60 edifícios e 5.686 árvores. Árvores retiradas dos corredores foram redistribuídas, sem usar sua remoção como otimização.

## Verificação reproduzível

Resultado confirmado: 84 testes unitários aprovados em 13 arquivos; 18 testes de navegador aprovados nos perfis desktop, mobile e small. O build final passou. Após os últimos ajustes de apoios e espaçamento de veículos, a suíte unitária foi repetida integralmente; a verificação de navegação desktop também passou novamente no build final.

A auditoria registrou 60 entradas conectadas, nenhum caminho amostrado por água ou por outro edifício, nenhum conflito de pilares principais com pistas e nenhum conflito não intencional entre os GLBs das situações e os lotes. O encontro do viaduto tem cota 2,35 em ambos os lados. População preservada: 60 edifícios e 5.686 árvores.

- `npm test`: inclui `map-continuity.test.ts`, com colisões entre arestas, terreno/pista, cotas, acessos, plataformas e continuidade da água.
- `node scripts/audit-map-plan.mjs`: escreve medidas de perfis, rede de pedestres, móveis, apoios e situações em `map-audit-evidence.json`.
- `node scripts/generate-reference-layout.mjs`: recusa gerar o snapshot se houver entradas desconectadas.
- `node scripts/review-reference.mjs`: seis enquadramentos reais e registro de erros em `docs/screenshots/river-city`.
- `node scripts/capture-models.mjs access --future`: inspeção isolada dos módulos do elevador.
- `npx playwright test`: jornada, estados temporários, navegação, save e perfis gráficos nos tamanhos configurados.

## Desempenho e limites da evidência

A medição em `performance/map-continuity/results.json` registra uma passagem de 30 segundos por setor, com animações e aquecimento separado, no Intel UHD via ANGLE/D3D11. Foi feita durante esta aplicação, antes dos últimos ajustes de caminhos/plataformas e do snapshot; serve como medida intermediária, não como comparação controlada antes/depois do cache.

Embora o relógio de frames apresente medianas próximas de 16,7 ms, o temporizador de GPU registra aproximadamente 65 ms na visão geral e 18–36 ms nos setores. Esses resultados não comprovam 60 FPS estáveis em Ultra. Não houve medição em um celular físico.

A auditoria usa envelopes e amostragem geométrica, não simulação física nem certificação de acessibilidade. A ausência de conflitos nas categorias testadas não comprova ausência de qualquer colisão em todos os detalhes. Conexões verticais são representações de infraestrutura no jogo de observação; não foi acrescentada simulação de passageiros ou elevadores.

## Itens do plano que ainda exigem trabalho

- Os cruzamentos compartilham cotas e têm marcações/guarda-corpos recortados por proximidade, mas ainda são compostos por fitas sobrepostas; não foi implementada a união poligonal completa de cada cruzamento.
- A auditoria não cobre o volume de todos os detalhes procedurais, copas e passagens públicas entre cada equipamento de lazer. A rede automática validada cobre as 60 entradas dos edifícios.
- A meta de desempenho p95 próximo de 16,7 ms em Ultra não foi comprovada. Falta uma medição final isolada de outros testes e uma medição em celular físico.
- A inspeção dos modelos nesta aplicação concentrou-se nos acessos e plataformas afetados. Não representa uma nova revisão individual de todos os modelos do catálogo.

Portanto, esta aplicação corrige a base de circulação e vários problemas do plano, mas não deve ser declarada como conclusão integral de todos os seus critérios de aceite.

