# Plano de transformação da cidade — futurismo sustentável

Status: aplicado em 6 de setembro de 2026, incluindo a revisão de polimento individual solicitada depois do planejamento. O plano original foi elaborado sobre o commit `9b79ba2`; os critérios abaixo ficam como registro da direção adotada. Veja a [implementação e validação](CIDADE-FUTURISTA.md) e a [galeria de modelos](CIDADE-FUTURISTA.html).

## 1. Resultado visual pretendido

A cidade deverá ter a linguagem da referência enviada: miniatura urbana ensolarada, edifícios com cantos arredondados, grandes superfícies de vidro azul, estruturas claras, terraços verdes, painéis solares e transporte coletivo moderno. A tecnologia deve ser reconhecível pela arquitetura e pelos equipamentos, mesmo com a câmera afastada.

A referência mantém casas, lojas, quadras, porto, floresta, praia e estruturas de madeira. Essa variedade orienta a transformação: modernizar cada função sem fazer todos os elementos parecerem o mesmo edifício.

Ordem de importância visual: **silhueta → proporção → materiais → vegetação integrada → acabamento pequeno**. Uma fachada antiga apenas recolorida ou com painéis adicionados não cumpre o objetivo.

Referência principal: imagem `codex-clipboard-e9bbde18-fcdb-4ae5-ae17-e93bedf16359.png` enviada nesta conversa. As referências anteriores continuam úteis para densidade, escala e acessos; esta imagem passa a orientar a arquitetura.

## 2. Diagnóstico do projeto atual

- O catálogo auditado contém 67 GLBs, 215.904 triângulos e 9.336.304 bytes. Essas contagens são dos modelos únicos, não do custo total de uma cena com instâncias.
- A distribuição atual tem 77 edifícios principais, com casas no primeiro plano e à esquerda, torres no centro, equipamentos cívicos, parque e porto. Essa organização já oferece uma base próxima à composição desejada.
- As quatro variantes de prédios ainda compartilham fachadas convencionais, janelas pequenas e volumes predominantemente retos. Hospital, prefeitura, fábrica e casas também precisam de mudanças de forma.
- O trem atual usa uma pequena ferrovia no solo, terminando no túnel. A linha elevada da referência exige infraestrutura própria: viaduto, pilares, transições e acessos de estação.
- Jardins e painéis adicionais nos telhados dependem de Alta/Ultra. Em `cityDetails.ts`, suas alturas são calculadas com números fixos dos edifícios atuais. Uma troca de modelo sem ajustar isso pode deixar equipamentos suspensos ou atravessando a cobertura.
- Os modelos GLB são hoje compartilhados entre os perfis. O controle de qualidade reduz principalmente resolução, sombras e densidade decorativa; ainda não há uma seleção geral de GLBs simplificados por perfil.
- A geração Blender permite reconstruir modelos selecionados, exportar fontes editáveis e otimizar os GLBs. A revisão existente já verifica portões, terreno, implantação, qualidade e situações narrativas.

## 3. Direção de arte

### Formas e materiais

1. Usar volumes principais com cantos arredondados visíveis e transições bem definidas. Priorizar cantos e coberturas; peças minúsculas não precisam receber subdivisões excessivas.
2. Criar fachadas com faixas horizontais claras, vidro azul contínuo, varandas recuadas e terraços escalonados. Alternar torres esbeltas, edifícios médios largos e volumes baixos.
3. Adotar branco quente e azul como base, com amarelo, coral e verde para diferenciar famílias e bairros. As cores abaixo são uma proposta inicial, a calibrar na iluminação real do jogo.

| Uso | Paleta proposta | Acabamento |
| --- | --- | --- |
| Estrutura e molduras | `#F4F6EE`, `#DCE8E4` | Superfícies claras, suaves, sem aspecto cromado |
| Vidro e energia solar | `#55B6DB`, `#278EBF`, `#245D90` | Vidro azul com divisões legíveis; painéis mais escuros |
| Jardins | `#31A56B`, `#82C65C` | Copas naturais e canteiros com espessura |
| Identidade dos edifícios | `#F1C45B`, `#F08761`, `#6DC6BD` | Cores localizadas nas fachadas e entradas |
| Sinalização tecnológica | `#77DDE5`, `#F1CF75` | Indicadores pequenos, legíveis durante o dia |

4. Integrar painéis à cobertura com suporte e inclinação coerentes, reservando espaço para jardins, equipamentos e manutenção.
5. Usar variação de rugosidade entre vidro, metal pintado, concreto e madeira. Validar primeiro materiais opacos com aparência de vidro; transparência real só onde melhorar a leitura e não gerar problemas de ordenação entre instâncias.
6. Manter iluminação diurna, sombras suaves e acabamento de maquete. Qualquer efeito luminoso deve complementar uma forma reconhecível.

### Vegetação e natureza

Preservar árvores e animais com aparência natural. Introduzir árvores floridas em rosa e palmeiras para reproduzir os contrastes da referência. Usar copas compactas em terraços e espécies maiores no solo; posicionar raízes, vasos e canteiros sobre superfícies reais.

Concentrar árvores floridas nas praças e equipamentos públicos, palmeiras na orla e copas verdes variadas nos bosques. Evitar distribuição uniforme de todas as espécies em todos os bairros.

## 4. Transformação do catálogo

Os grupos abaixo cobrem os 67 modelos existentes. Modelos de natureza e situações recebem o tratamento adequado à sua função; o personagem legado continua fora da narrativa atual.

| Família atual | Transformação planejada | Integração no mapa |
| --- | --- | --- |
| Prédios sage, cream, coral e pink | Quatro arquiteturas distintas: torre de vidro com cantos curvos; edifício escalonado com terraços; prédio misto com base comercial arredondada; residência com varandas contínuas | Alternar famílias e alturas por quadra, evitando sequências de cópias |
| Torre envidraçada | Marco central com volume arredondado, faixas claras, cobertura verde e símbolo ambiental discreto | Presença dominante controlada, sem esconder todo o centro ou marcadores |
| Casas creme e coral | Casas compactas com volumes claros, janelas maiores, marquise e painéis solares; combinar cobertura inclinada e terraço | Criar duas variantes adicionais para reduzir repetição no bairro residencial |
| Hospital | Alas arredondadas, faixas de vidro azul, cruzes legíveis, entrada de emergência e heliponto integrado à cobertura | Recalibrar dimensões dentro do lote e manter livre a situação de orientação/acessibilidade |
| Escola | Campus claro com marquises, vidros amplos, energia solar e jardins de cobertura | Entradas alinhadas ao passeio e às quadras; escola reconhecível à distância |
| Prefeitura | Pavilhão cívico com cúpula de vidro, colunas mais simples, faixas azuladas e jardins | Reposicionar encaixes de degrau/rampas conforme a nova porta |
| Fábrica e galpão | Volumes industriais arredondados, cobertura solar, ventilação, docas, reservatórios e módulos de controle ambiental | Preservar pátios de manobra e distinguir área ainda poluente da área com intervenção |
| Estufa | Estrutura leve com base limpa, ventilação e módulos de cultivo organizados | Manter transparência visual dos arcos e acesso ao cultivo |
| Café | Fachada de esquina curva, cobertura verde, painéis e toldos coloridos | Mesas, vitrines e entrada voltadas à circulação comercial |
| Posto | Estação de recarga com cobertura solar, carregadores, vagas e identificação | Substituir linguagem de bombas e preços por equipamentos de recarga; preservar circulação de veículos |
| Quatro carros | Carrocerias suaves, vidros contínuos, faróis estreitos e identidade elétrica; variar compacto, hatch e utilitário | Rodas, largura e comprimento compatíveis com as faixas e vagas |
| Ônibus | Frente arredondada, laterais envidraçadas, piso baixo e identidade visual azul/verde | Abrigos e portas com alturas e orientação compatíveis |
| Caminhão | Cabine elétrica arredondada, iluminação integrada e baú de logística | Manter docas, raios de manobra e proporção da carga |
| Trem | Composição azul/branca, cabine aerodinâmica e vagão intermediário próprio | Colocar na nova linha elevada; comprimento e articulação adequados às curvas |
| Dois contêineres, guindaste e cargueiro | Acabamento industrial moderno, identificação de carga, cabines atualizadas e equipamentos elétricos | Conservar o contraste de contêineres coloridos, guindastes amarelos e cais operacional |
| Veleiro e conjunto de praia | Refinar materiais, cabos, tecidos e cores | Preservar a aparência náutica e a escala humana da praia |
| Ponte viária e píer | Ponte com apoios e guarda-corpos mais leves; píer com madeira, ferragens claras e iluminação integrada | Conservar encaixes, vão central e ligação ao passeio |
| Banco, poste e semáforo | Banco de madeira com estrutura clara; poste LED delgado; semáforo com gabinete compacto | Revalidar orientação dos bancos caso o eixo frontal do modelo mude |
| Fonte, pergolado e playground | Fonte escultórica clara; pergolado com cobertura parcial solar; brinquedos de curvas suaves | Preservar áreas de uso, passagem e sombra |
| Campo e quadra | Modernizar postes, portões, proteção e sinalização; acrescentar placar e pequena cobertura solar de apoio | Manter campos, redes, cestas e acessos legíveis em todos os perfis |
| Farol e turbina | Acabamento mais limpo, iluminação e manutenção coerentes; remates suaves | Continuar reconhecíveis como marcos da orla e energia |
| Sete árvores, arbusto e rocha | Harmonizar suavidade e escala das copas, materiais e transições de solo | Somar espécies floridas e palmeiras; manter reservas de circulação |
| Abrigo de ônibus | Cobertura curva solar, painel de linhas, assento e vidro com faixas de visibilidade | Virado para a faixa de embarque, com espaço livre junto ao banco |
| Degrau, rampa e rampa provisória | Adaptar materiais e medidas à nova prefeitura | Preservar a leitura distinta de barreira, solução provisória e solução permanente |
| Lixo, lixo parcial e lixeira | Resíduos ainda reconhecíveis; estação de coleta com aberturas seletivas e identificação | Coleta modernizada apenas onde fizer sentido para o estado narrativo |
| Tratamento e emissário | Equipamento modular de filtragem com tubulação organizada; emissário ligado fisicamente à margem | Separar tratamento, duto e circulação, evitando sobreposição e tubo desconectado do rio |
| Condensadora e termômetro | Gabinete compacto, grelha e monitor de temperatura legível | Calor e desperdício continuam evidentes antes da intervenção |
| Placa e totem de assistência | Sistema unificado de sinalização clara e ponto de ajuda com interface simples | Informação em posições visíveis e fora dos corredores |
| Abrigo de animais e coelho | Abrigo contemporâneo com sombra, água e cercamento coerente; animal natural | Solução completa posiciona animais em área protegida com acesso livre |
| Pessoa em cadeira de rodas | Acabamento da cadeira e personagem compatível com a nova escala | Rodas apoiadas no piso; aproximação livre até a rampa |
| Toco de árvore | Acabamento natural e integração com solo | Evidência do desmatamento preservada |
| Salvador — legado | Registrar compatibilidade do catálogo; não inserir na campanha atual | A identidade do companheiro robô permanece separada da arquitetura |

## 5. Modelos adicionais prioritários

Reutilizar os IDs existentes para substituições equivalentes. Reservar novos IDs para funções ou silhuetas adicionais:

1. Duas casas complementares: casa com terraço verde e casa com cobertura inclinada solar.
2. Árvore florida rosa, palmeira e árvore compacta para terraços.
3. Carregador de veículos e módulo de cobertura solar reutilizável.
4. Kit ferroviário: cabine do trem, vagão intermediário, segmentos de tabuleiro, pilares, estação e acessos da estação.
5. Módulo industrial de tratamento/controle ambiental para as consequências das missões.

A quantidade final de arquivos será definida ao separar partes compartilhadas. Não criar um novo GLB por pequena cor ou acessório que possa ser instanciado.

## 6. Composição urbana

- **Centro:** torres curvas e escalonadas formam a faixa de maior altura; bases comerciais, jardins e passeios conectam os edifícios. Concentrar a maior transformação de silhueta aqui.
- **Bairros residenciais:** misturar as quatro casas propostas com rotação e variantes controladas. Recuos curtos, jardins compactos e coberturas variadas criam densidade sem objetos sobrepostos.
- **Hospital, escola e prefeitura:** manter sua posição como referências de orientação, modernizando os volumes e suas áreas externas.
- **Parque:** fonte, lago, passarela, pergolado e árvores floridas compõem uma área aberta contínua. Equipamentos tecnológicos aparecem em pontos funcionais, como iluminação e cobertura de sombra.
- **Porto:** distribuir galpões claros, recarga logística, contêineres, guindastes e energia eólica. As emissões associadas à missão continuam aparecendo no estado inicial.
- **Orla:** conservar praia, rochas, farol e píer; acrescentar palmeiras e mobiliário compatível com o calçadão.
- **Floresta e rio:** manter limite continental e água conectada ao litoral; controlar a transição de paisagismo urbano para mata densa.

### Linha elevada

Traçado preliminar: usar o corredor ferroviário a oeste e desenvolver uma ligação pelo fundo da cidade, próxima à área escolar e ao distrito industrial, como na imagem. Validar o percurso em uma maquete simples antes de definir coordenadas finais.

O projeto da linha deve resolver, em conjunto: entrada no túnel, mudança de altura, gabarito sobre ruas, pilares fora das faixas e calçadas, curvas compatíveis com os vagões, estação e conexão ao passeio. Pontas visíveis devem terminar em uma estação, túnel ou continuidade cenográfica coerente.

Evitar um viaduto atravessando o centro visual do parque ou encobrindo situações importantes. A presença dessa infraestrutura e de seus apoios será mantida também nos perfis leves.

## 7. Estratégia técnica de implementação

### Geração e materiais

- Criar uma camada de autoria futurista com componentes compartilhados: volume arredondado, faixa de vidro, terraço, jardim, marquise e cobertura solar.
- Aplicar os construtores futuristas como substituições explícitas no fluxo de `scripts/blender/build_city.py`. O acabamento antigo não deve ser aplicado automaticamente sobre uma geometria nova com dimensões diferentes.
- Consolidar a paleta após os módulos atuais, que hoje redefinem cores, e permitir rugosidade por família de material.
- Continuar gerando `.blend` editável, oclusão nas cores dos vértices e GLBs otimizados.

### Encaixes e implantação

- Definir metadados por modelo: frente, origem no piso, dimensões, porta de entrada, altura de cobertura e áreas reservadas a jardim/equipamento.
- Transformar esses encaixes para o mundo usando escala e rotação da instância. Evitar números de altura específicos espalhados por `cityDetails.ts`.
- Manter uma única origem para painéis e jardins: os elementos essenciais entram no modelo base; a camada de detalhes acrescenta apenas complementos, sem duplicá-los.
- Verificar limites reais dos modelos depois da exportação. Se a arquitetura exigir um lote maior, ajustar lote, calçada e conexões juntos, preservando pistas e áreas de uso.
- Aplicar o mesmo cuidado a portas da prefeitura, hospital, quadras, docas e estação. Atualizar câmeras e marcadores quando a altura ou o volume passar a encobrir a situação.

### Arquivos envolvidos na aplicação posterior

| Área | Arquivos principais |
| --- | --- |
| Autoria dos modelos e materiais | `scripts/blender/build_city.py`, novos construtores futuristas e módulos compartilhados |
| Registro, variantes e carregamento | `src/assets/registry.ts`, `src/components/Asset.tsx`, `src/components/city/AssetBatch.tsx` |
| Lotes, jardins e detalhes de cobertura | `src/config/districts.ts`, `src/config/cityDetails.ts`, `src/config/landscape.ts` |
| Trem, viaduto e túnel | `src/config/railway.ts`, `src/components/environment/CivicScenery.tsx`, novos componentes ferroviários |
| Circulação e equipamentos públicos | `src/config/publicSpaces.ts`, `src/config/infrastructure.ts`, `src/config/park.ts` |
| Situações e suas consequências | `src/config/situationVisuals.ts`, `src/components/city/SituationLayers.tsx` |
| Perfis e apresentação | `src/config/graphics.ts`, `src/app/World.tsx`, `src/config/referenceFrame.ts` |
| Auditoria e capturas | `tests/model-finish.test.ts`, `tests/city-layout.test.ts`, testes de navegador e scripts de revisão |

## 8. Qualidade gráfica e desempenho

A cidade deve continuar reconhecível como futurista em Muito baixa. Formas curvas essenciais, vidro azul, algumas faixas verdes e painéis principais pertencem ao modelo base. Flores individuais, parafusos, equipamentos menores e vegetação complementar pertencem aos níveis de detalhe.

| Perfil | Identidade obrigatória | Detalhe variável |
| --- | --- | --- |
| Muito baixa / Baixa | Silhuetas futuristas, funções dos prédios, coberturas principais, estação e viaduto completos | Menos segmentos nas curvas, vegetação e veículos; materiais simples; sombras conforme perfil |
| Média | Mesmas arquiteturas e acessos, com fachadas mais definidas | Varandas e jardins moderados; sombras econômicas |
| Alta | Fachadas, terraços, equipamentos e paisagismo completo | Curvas mais suaves, moradores e acabamento próximo |
| Ultra | Mesma composição urbana, com maior acabamento | Mais plantas, peças menores, detalhes de cobertura e sombras mais definidas |

Planejar variantes simplificadas para os modelos mais repetidos ou caros, principalmente casas, torres, árvores, quadras e estufa. Uma troca de variante precisa preservar origem, dimensões funcionais, encaixes e seleção das missões. Carregar somente as variantes necessárias, incluindo na pré-carga das situações.

Priorizar reaproveitamento de materiais e geometria. Evitar uma luz dinâmica por janela e efeitos que exijam renderizar a cena novamente para cada prédio. A aparência do vidro será calibrada com o custo da iluminação real, sem depender de reflexos caros para funcionar.

Antes de fixar limites definitivos, medir a versão atual e o primeiro quarteirão futurista no mesmo dispositivo, câmera e perfil: tempo de carregamento, bytes baixados, chamadas de desenho, triângulos por quadro e tempo de renderização durante pan/zoom. Metas iniciais de experiência: 60 FPS em desktop compatível e 30 FPS em celular compatível, sujeitas à medição em aparelhos reais. A emulação existente valida funcionamento, não garante esses números.

## 9. Coerência das situações narrativas

A referência serve como direção visual, mas a cidade do jogo ainda precisa apresentar problemas para o jogador resolver.

- A praça de calor mantém pouca sombra e equipamentos em uso no estado inicial; mais árvores e energia sustentável aparecem como consequência da solução.
- A região industrial mantém emissões identificáveis antes da intervenção. Reservar o equipamento de controle ao estado em que ele é instalado.
- O local de saneamento mantém descarga e contaminação visíveis antes da solução. Tubo, água e tratamento precisam estar conectados e fisicamente separados de calçadas.
- A prefeitura mantém a barreira inicial; a rampa não pode vir embutida no novo modelo base.
- O hospital deve preservar o percurso que recebe orientação tátil após a escolha correspondente.
- Veículos e abrigos podem ser modernos, mas a quantidade de carros, o congestionamento e a oferta de transporte coletivo precisam continuar distintos entre os estados.

Revisar os três estados das dez situações após a montagem. Alterações editoriais, se necessárias para alguma nova tecnologia, devem ser identificadas separadamente antes da aplicação.

## 10. Sequência de execução posterior

1. **Fixar a comparação:** guardar capturas atuais e a referência, usando câmera geral e recortes constantes; registrar desempenho inicial e inventário de encaixes.
2. **Construir um quarteirão piloto:** uma torre curva, um prédio escalonado, uma casa solar, ônibus, abrigo e paisagismo. Renderizar isoladamente e dentro do mapa em Alta e Muito baixa. Avaliar forma, escala e encaixes antes de propagar o estilo.
3. **Remodelar arquitetura:** concluir as famílias residenciais, centro, hospital, escola, prefeitura, comércio e indústria; substituir cobertura e encaixes antigos de cada família no mesmo lote de trabalho.
4. **Modernizar mobilidade:** carros, ônibus, caminhões, recarga e trem. Montar e validar a linha elevada e a estação com seus acessos.
5. **Completar espaços públicos:** mobiliário, praças, parque, esportes, porto, praia e espécies novas. Corrigir transições entre os conjuntos.
6. **Integrar situações e qualidade:** ajustar estados narrativos, variantes leves, carregamento e mudanças de perfil.
7. **Revisar e entregar:** comparação antes/depois no mesmo enquadramento, galeria individual frente/verso, auditoria de implantação e validação do jogo.

Cada etapa só deve avançar depois de a anterior apresentar modelos reconhecíveis, acessos coerentes e ausência de peças flutuantes. O quarteirão piloto funciona como referência visual para o restante da autoria.

## 11. Critérios de conclusão

- Na visão geral, o centro se identifica por volumes arredondados, vidro azul e terraços verdes; as casas mostram uma composição solar contemporânea.
- As quatro famílias de prédios têm silhuetas diferentes, além de diferenças de cor.
- Escola, hospital, prefeitura, estação, indústria e recarga são reconhecíveis sem depender de placas grandes ou da interface.
- A distribuição preserva os bairros e marcos da referência: casas à frente/esquerda, centro vertical, parque, equipamentos cívicos e porto ao fundo/direita.
- Telhados não têm painéis ou plantas duplicados, suspensos ou enterrados; nenhum modelo invade a circulação por causa da remodelagem.
- Campo, quadra, píer, estação e edifícios públicos têm entradas reais ligadas aos passeios.
- Viaduto tem apoios e terminações coerentes, com passagem livre sobre vias e sem pilares em áreas de uso.
- As dez situações mantêm suas consequências distintas; objetos futuristas não antecipam uma solução ainda não escolhida.
- Todos os perfis mantêm a mesma identidade arquitetônica e os elementos funcionais. A troca de qualidade não altera posições, cores, escolha ou estado narrativo.
- Build, testes de implantação, testes de campanha/navegação/qualidade e inspeção visual passam após as mudanças relevantes.
- A entrega inclui comparação com a referência e relatório das medições obtidas, distinguindo emulação e dispositivos físicos.

## Entrega da aplicação

Foram implementadas as famílias arquitetônicas, mobilidade elétrica, estação e ferrovia elevada, espécies vegetais e equipamentos solares. O catálogo contém 77 modelos e 44 variantes leves; os 32 modelos futuristas receberam uma revisão específica de superfícies, ferragens, junções e equipamentos. A galeria permite comparar frente, verso e versão leve de cada objeto. O relatório registra as medições e os limites da validação em emulação.
