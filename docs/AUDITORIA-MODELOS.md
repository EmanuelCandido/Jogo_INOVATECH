# Auditoria individual dos modelos — setembro de 2026

67 modelos GLB: 51 modelos anteriores revisados e 16 novos. 215.904 triângulos e 9,34 MB no catálogo otimizado. Todos possuem oclusão gravada nas cores dos vértices.

Além dos GLBs, foram corrigidos o terreno próximo às ruas, o túnel, as cercas dos pátios, as bases e orientações dos bancos, a passarela do lago e a ligação do píer à orla. A mudança de qualidade agora reaplica matrizes e cores dos detalhes instanciados, corrigindo volumes brancos e peças deslocadas.

As imagens são renderizações dos GLBs exportados. O catálogo registra também o modelo legado de Salvador, que não aparece na narrativa atual. Não é uma promessa de reprodução idêntica da referência: esta revisão trata de acabamento, reconhecimento e implantação.

[Galeria com filtros e ampliação](REVISAO-MODELOS.html) · [Dados da auditoria](model-audit-after.json)

## Verificação

- A geometria real dos GLBs é verificada: atributos, índices, oclusão e áreas livres nas entradas do campo, quadra e píer.
- Amostras das ruas e calçadas próximas ao túnel ficam fora da elevação do morro.
- Orientação dos bancos, conexão dos acessos esportivos e os três estados das dez situações são verificados em testes.
- A inspeção no navegador compara matrizes e cores das dez situações após cinco mudanças de qualidade; resultado em [runtime-check.json](screenshots/finish/runtime-check.json).
- O número de triângulos é por modelo do catálogo, não o total de triângulos desenhados em um quadro do jogo. A quantidade de instâncias e as configurações gráficas afetam o custo da cena.

## Construções

| Modelo | Acabamento | Implantação | Triângulos antes → agora |
| --- | --- | --- | --- |
| [Café de esquina](screenshots/finish/models/building.cafe.png) | Alças das xícaras, placa ABERTO e ventilação de serviço. | Mesas e circulação ficam no espaço comercial. | 1.812 → 2.628 |
| [Casa coral](screenshots/finish/models/building.house.coral.png) | Iluminação da porta, interfone, caixa de correio, apoios do beiral, numeração, capuzes dos postes e cerca posterior com passagem. | Mantém caminho frontal e jardim dentro do lote residencial. | 5.750 → 6.766 |
| [Casa creme](screenshots/finish/models/building.house.cream.png) | Iluminação da porta, interfone, caixa de correio, apoios do beiral, numeração, capuzes dos postes e cerca posterior com passagem. | Mantém caminho frontal e jardim dentro do lote residencial. | 5.750 → 6.766 |
| [Escola](screenshots/finish/models/building.school.png) | Puxadores duplos, índices do relógio, juntas de alvenaria e quadro de avisos. | Fachada voltada à rua; equipamentos esportivos têm acessos próprios. | 5.460 → 6.516 |
| [Estufa comunitária](screenshots/finish/models/building.greenhouse.png) | Travessas inferiores da porta, placa HORTA e identificação dos cultivos. | Conectada aos caminhos do bairro. | 15.132 → 15.684 |
| [Fábrica](screenshots/finish/models/building.factory.png) | Anéis de reforço nas chaminés, escada de manutenção, defensas e luminárias de doca. | No distrito industrial; áreas de carga separadas das calçadas. | 4.898 → 6.718 |
| [Galpão portuário](screenshots/finish/models/building.warehouse.png) | Docas numeradas, defensas, iluminação de carga e canaletas de drenagem. | Portões das cercas alinhados aos acessos dos caminhões. | 2.304 → 2.816 |
| [Hospital](screenshots/finish/models/building.hospital.png) | Montantes e faixas de visibilidade nas portas, luminárias, identificação URGÊNCIA e marcação do acesso de ambulância. | Entrada pública e faixa de acesso preservadas. | 10.028 → 10.564 |
| [Posto de combustível](screenshots/finish/models/building.fuel.png) | Luminárias sob a cobertura, teclados nas bombas e ferragem da porta. | Bombas e circulação de abastecimento no pátio. | 3.460 → 3.616 |
| [Prédio amarelo](screenshots/finish/models/building.cream.png) | Condutores com abraçadeiras, luminárias de entrada, interfone, caixas técnicas, juntas de fachada, varandas e identificação comercial. | Implantação compacta preservada; entradas voltadas às calçadas e dimensões verificadas nos lotes. | 8.660 → 9.764 |
| [Prédio azul](screenshots/finish/models/building.sage.png) | Condutores com abraçadeiras, luminárias de entrada, interfone, caixas técnicas, juntas de fachada, varandas e identificação comercial. | Implantação compacta preservada; entradas voltadas às calçadas e dimensões verificadas nos lotes. | 9.380 → 10.484 |
| [Prédio rosado](screenshots/finish/models/building.pink.png) | Condutores com abraçadeiras, luminárias de entrada, interfone, caixas técnicas, juntas de fachada, varandas e identificação comercial. | Implantação compacta preservada; entradas voltadas às calçadas e dimensões verificadas nos lotes. | 8.108 → 9.212 |
| [Prédio terracota](screenshots/finish/models/building.terracotta.png) | Condutores com abraçadeiras, luminárias de entrada, interfone, caixas técnicas, juntas de fachada, varandas e identificação comercial. | Implantação compacta preservada; entradas voltadas às calçadas e dimensões verificadas nos lotes. | 9.380 → 10.484 |
| [Prefeitura](screenshots/finish/models/building.civic.png) | Anéis nas colunas, lanternas no pórtico, brasão e nervuras metálicas na cúpula. | Entrada alinhada à situação de acessibilidade; degrau e rampas continuam estados diferentes. | 4.006 → 4.784 |
| [Torre envidraçada](screenshots/finish/models/building.office.png) | Puxadores, painéis opacos entre pavimentos e identificação na entrada. | Permanece no lote urbano sem invadir a pista. | 2.608 → 2.780 |

## Vegetação

| Modelo | Acabamento | Implantação | Triângulos antes → agora |
| --- | --- | --- | --- |
| [Arbusto florido](screenshots/finish/models/prop.shrub.png) | Caules lenhosos e miolos das flores. | Canteiros e jardins; removido das áreas reservadas à circulação. | 1.760 → 1.924 |
| [Árvore de copa alta](screenshots/finish/models/tree.maple.png) | Galhos, raiz e pequenos volumes foliares complementam a silhueta alongada. | Variação vertical em bosques e jardins. | 624 → 964 |
| [Árvore urbana](screenshots/finish/models/tree.default.png) | Raízes e ramos sob a copa; acabamento suave sem saliências artificiais. | Nas ruas e jardins, respeitando reservas de bancos e acessos. | 1.512 → 1.612 |
| [Bétula](screenshots/finish/models/tree.birch.png) | Ramificação visível e pequenas brotações, preservando o tronco claro. | Intercalada entre árvores largas para variar o bosque. | 656 → 996 |
| [Carvalho](screenshots/finish/models/tree.oak.png) | Ramificação, raízes e brotações discretas na copa larga. | Sobreposição de copas nos grupos florestais. | 624 → 964 |
| [Conífera densa](screenshots/finish/models/tree.fir.png) | Raízes e ramificação sob a copa, sem bolhas isoladas no contorno. | Maciços de coníferas com alturas variadas. | 268 → 468 |
| [Grupo de árvores jovens](screenshots/finish/models/tree.thicket.png) | Bases enraizadas e galhos; copas contínuas adequadas à composição em grupo. | Preenche transições e bordas da floresta. | 564 → 664 |
| [Pinheiro](screenshots/finish/models/tree.pine.png) | Raízes e galhos estreitos sob os níveis da copa. | Composição dos bosques e transições entre alturas. | 1.512 → 1.712 |
| [Rocha](screenshots/finish/models/prop.rock.png) | Variação de material nas faces para líquen e pequena lasca de erosão. | Rochas da orla reduzidas e afastadas da entrada do píer. | 40 → 60 |

## Transportes

| Modelo | Acabamento | Implantação | Triângulos antes → agora |
| --- | --- | --- | --- |
| [Caminhão de entregas](screenshots/finish/models/prop.truck.png) | Cantoneiras, dobradiças, lanternas, identificação, proteção lateral e plataforma traseira. | Docas e vãos de acesso dos pátios industriais. | 1.128 → 1.580 |
| [Carro amarelo](screenshots/finish/models/prop.car.gold.png) | Placas, limpadores, emendas das portas, indicadores laterais e antena. | Escala e orientação mantidas nas faixas viárias. | 986 → 1.230 |
| [Carro azul](screenshots/finish/models/prop.car.blue.png) | Placas, limpadores, emendas das portas, indicadores laterais e antena. | Escala e orientação mantidas nas faixas viárias. | 986 → 1.230 |
| [Carro branco](screenshots/finish/models/prop.car.white.png) | Placas, limpadores, emendas das portas, indicadores laterais e antena. | Escala e orientação mantidas nas faixas viárias. | 986 → 1.230 |
| [Carro vermelho](screenshots/finish/models/prop.car.coral.png) | Placas, limpadores, emendas das portas, indicadores laterais e antena. | Escala e orientação mantidas nas faixas viárias. | 986 → 1.230 |
| [Contêiner azul](screenshots/finish/models/prop.container.blue.png) | Encaixes de içamento nos cantos, travas e identificação de carga. | Pátios do porto e cargas do navio. | 940 → 1.530 |
| [Contêiner vermelho](screenshots/finish/models/prop.container.red.png) | Encaixes de içamento nos cantos, travas e identificação de carga. | Pátios do porto e cargas do navio. | 940 → 1.530 |
| [Guindaste portuário](screenshots/finish/models/prop.crane.png) | Guarda-corpos, roldanas de içamento e faixas de advertência. | Sobre a área operacional do cais. | 2.932 → 3.900 |
| [Navio cargueiro](screenshots/finish/models/prop.ship.png) | Boias salva-vidas, defensas e bandeira. | Ancorado junto ao porto. | 4.584 → 5.368 |
| [Ônibus urbano](screenshots/finish/models/prop.bus.png) | Identificação, placas, grelha do motor e soleiras de acesso. | Paradas junto às calçadas; abrigo próprio na situação de mobilidade. | 2.192 → 2.504 |
| [Vagão de passageiros](screenshots/finish/models/prop.train.png) | Numeração, placas, grelhas e foles nas conexões. | Traçado ajustado à entrada do túnel, dentro do morro. | 2.248 → 2.584 |
| [Veleiro](screenshots/finish/models/prop.sailboat.png) | Casco com borda, convés, bancos, escotilha, velas com volume, mastreação, cabos e leme. | Substitui os barcos triangulares simplificados na costa. | Novo → 438 |

## Espaços públicos

| Modelo | Acabamento | Implantação | Triângulos antes → agora |
| --- | --- | --- | --- |
| [Banco](screenshots/finish/models/prop.bench.png) | Pés ancorados, parafusos nas ripas e encosto, placa do fabricante. | Nove posições revistas com piso e conexão; orientação calculada para caminhos, jardim ou mar. | 444 → 784 |
| [Campo de futebol](screenshots/finish/models/prop.football.png) | Gramado em faixas, pista, linhas, áreas, círculo central, gols com redes, bandeirolas e cerca completa. | Portão de 1,1 unidade com patamar e caminho; cerca não termina em travessas flutuantes. | Novo → 10.028 |
| [Conjunto de praia](screenshots/finish/models/prop.beach.png) | Guarda-sol com gomos, nervuras e ponteira; espreguiçadeiras com armações e tecido; mesa. | Implantado sobre a areia, próximo aos acessos da orla. | Novo → 856 |
| [Farol](screenshots/finish/models/prop.lighthouse.png) | Juntas na base de alvenaria, puxador e identificação FAROL. | Marco costeiro com caminho de acesso. | 2.078 → 2.670 |
| [Fonte](screenshots/finish/models/prop.fountain.png) | Juntas segmentadas na bacia e grelha de drenagem. | Centro da praça pavimentada; sem duplicar bancos existentes. | 2.060 → 2.572 |
| [Pergolado](screenshots/finish/models/prop.pergola.png) | Base pavimentada, sapatas e ferragens, pilares, mãos-francesas, vigas, caibros, trepadeiras e bancos laterais. | Corredor central livre e caminho conectado ao parque. | Novo → 3.632 |
| [Píer](screenshots/finish/models/prop.pier.png) | Tábuas com fixações, vigas contínuas, travessas, estacas, contraventamentos, guarda-corpos, cabeços, escada, boia, luzes e plataforma final. | Entrada livre e conectada ao passeio; rochas afastadas do corredor. | Novo → 8.892 |
| [Playground](screenshots/finish/models/prop.playground.png) | Remates na caixa de areia, ferragens dos balanços, painel da torre e ancoragens. | Área de lazer com borda baixa e acesso a partir dos caminhos. | 1.052 → 1.520 |
| [Ponte viária](screenshots/finish/models/prop.bridge.png) | Juntas de dilatação, aparelhos de apoio e remates nos guarda-corpos. | Conexões viárias e faixa de água verificadas pela auditoria do mapa. | 1.248 → 2.416 |
| [Poste de iluminação](screenshots/finish/models/prop.lamp.png) | Escotilha de serviço, parafusos e fotocélula. | Instalado junto às vias e caminhos. | 176 → 256 |
| [Quadra de basquete](screenshots/finish/models/prop.court.png) | Modelo reconstruído: cercamento em quatro lados, postes com bases, abertura enquadrada, pintura, garrafão, tabelas, aros, redes e placa. | Portão com largura livre de 0,84 unidade; caminhos conectados à calçada sem avançar na rua. | 2.916 → 9.174 |
| [Semáforo](screenshots/finish/models/prop.traffic.png) | Portinhola técnica, fixações e abas nas lentes. | Mantém orientação nos cruzamentos. | 656 → 796 |
| [Turbina eólica](screenshots/finish/models/prop.turbine.png) | Ancoragem da fundação, escotilha de manutenção e ventilação da nacele. | Mantém distância entre torres e circulação. | 804 → 1.112 |

## Situações

| Modelo | Acabamento | Implantação | Triângulos antes → agora |
| --- | --- | --- | --- |
| [Abrigo de animais](screenshots/finish/models/prop.wildlife.png) | Casinha com cobertura, cerca com postes e travessas, passagem frontal, água, forração e placa ABRIGO. | Área de cuidado reconhecível, com entrada intencionalmente aberta. | Novo → 1.228 |
| [Abrigo de ônibus](screenshots/finish/models/prop.shelter.png) | Cobertura, montantes, vidro com faixas visíveis, banco, quadro de horários e identificação ÔNIBUS. | Posicionado na calçada da situação de transporte. | Novo → 720 |
| [Acúmulo de lixo](screenshots/finish/models/waste.pile.png) | Dobras, amarrações dos sacos, aro de lata e papelão. | Áreas de descarte das situações, sem substituir o problema por um volume branco. | 4.428 → 4.836 |
| [Coelho](screenshots/finish/models/prop.rabbit.png) | Corpo com patas, focinho, nariz, olhos, orelhas com interior rosado e cauda. | Substitui animais feitos apenas de esferas. | Novo → 1.120 |
| [Condensadora](screenshots/finish/models/prop.heatpump.png) | Gabinete com grelha, ventilador, anel, aberturas de ventilação e tubulação. | Equipamentos da situação de calor; melhoria parcial inclui um temporizador visível. | Novo → 776 |
| [Degrau](screenshots/finish/models/access.step.png) | Faixas de contraste e fixações no espelho. | Representa a barreira inicial na entrada da prefeitura. | 156 → 224 |
| [Emissário do rio](screenshots/finish/models/prop.outfall.png) | Tubo realmente oco, juntas anulares, tela de barras, paredes de contenção e base. | Abertura direcionada para o rio, sem face sólida bloqueando o tubo. | Novo → 1.244 |
| [Estação de tratamento](screenshots/finish/models/prop.treatment.png) | Tanques com tampas curvas e juntas, tubulação, válvulas, controle e identificação ÁGUA. | Implantada na margem na solução de saneamento. | Novo → 2.596 |
| [Lixeira de coleta](screenshots/finish/models/waste.bin.png) | Alça posterior, dobradiças, nervuras e identificação RECICLE. | Próxima às áreas de coleta e caminhos. | 380 → 808 |
| [Lixo remanescente](screenshots/finish/models/waste.partial.png) | Dobras, amarrações e pequenos resíduos identificáveis. | Quantidade reduzida comunica a melhoria parcial. | 1.432 → 1.760 |
| [Pessoa em cadeira de rodas](screenshots/finish/models/prop.wheelchair.png) | Rodas com raios e aros de propulsão, rodízios, estrutura, braços, apoios de pés e pessoa sentada. | Voltada à entrada da prefeitura, apoiada no piso. | Novo → 2.772 |
| [Placa informativa](screenshots/finish/models/prop.information.png) | Poste, fundação, moldura, símbolo de informação, linhas de texto e fixações. | Substitui placas sem identificação nas situações. | Novo → 240 |
| [Rampa permanente](screenshots/finish/models/access.ramp.png) | Detalhes antiderrapantes e proteções laterais complementam corrimãos e piso tátil. | Alinhada à porta; mantém a distinção da melhoria permanente. | 584 → 700 |
| [Rampa provisória](screenshots/finish/models/access.temporary.png) | Tratamento de piso e proteções laterais para leitura do acesso temporário. | Permanece visualmente diferente da solução permanente. | 384 → 500 |
| [Salvador — legado](screenshots/finish/models/hero.png) | Cadarços, zíper, botões e bolso da mochila. | Modelo revisado no catálogo; não é instanciado pela narrativa atual do companheiro. | 5.596 → 5.908 |
| [Termômetro urbano](screenshots/finish/models/prop.thermometer.png) | Pedestal, mostrador rebaixado, coluna vermelha, graduação e marcação 38 °C. | Explica visualmente o calor excessivo. | Novo → 620 |
| [Toco de árvore](screenshots/finish/models/prop.stump.png) | Raízes, sulcos de casca e anéis no corte de madeira. | Clareira irregular respeitando calçadas e vias. | Novo → 1.284 |
| [Totem de assistência](screenshots/finish/models/prop.assistance.png) | Identificação SOS, vídeo, alto-falante, botão, refletores e cobertura solar. | Representa o ponto de ajuda da solução de segurança. | Novo → 560 |

## Reproduzir a revisão

Com o servidor de desenvolvimento na porta 5173:

```sh
node scripts/audit-models.mjs
node scripts/capture-models.mjs
node scripts/capture-models.mjs --rear
node scripts/review-city-finish.mjs
node scripts/document-model-review.mjs
```

Fontes editáveis em `assets-source/*.blend`. A geração usa `scripts/blender/build_city.py`, `finish_catalog.py`, `public_spaces.py` e `situation_kit.py`. O comando `npm run assets:build` prefere a instalação local do Blender 5.2 e usa a cópia 4.5 apenas como alternativa.
