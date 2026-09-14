# Cidade do vale — reconstrução pela referência

A composição usa a imagem isométrica enviada e, para o traçado, a vista superior de 1672 × 941. A cena anterior de quadras regulares foi substituída por uma cidade organizada ao redor de dois cursos de água. A interpretação é tridimensional e navegável; não é uma reprodução pixel a pixel da ilustração.

## Organização

- Oeste: campus circular, observatório e anel elevado de monotrilho, parque com estufa, casas solares, escola, quadra, playground e reciclagem.
- Centro: rio sinuoso, ciclovias, três pontes arqueadas, edifícios residenciais, estação com relógio e cobertura azul, hospital e estação solar.
- Nordeste: represa e reservatório, floresta, clareira de desmatamento, usina solar, torres de transmissão e indústria.
- Leste e orla: canal poluído, pátio de carga, bairro degradado, viaduto, peixaria, praia, píer, barcos e farol.

## Modelos

15 novos modelos com GLB de produção, fonte Blender e variante econômica: observatório, centro circular, estação central, cobertura ferroviária, represa, ponte arqueada, reciclagem, escavadeira, torre elétrica, prédio degradado, indústria, casa com telhas solares, escola, peixaria e painel solar de solo.

O catálogo anterior continua fornecendo os demais prédios, veículos, vegetação, mobiliário e equipamentos. As novas peças usam a paleta, arredondamento, oclusão e acabamento de superfície compartilhados pelo jogo.

## Revisão de coesão

Foram corrigidos sobreposições de lotes e pistas, apoios das pontes, alinhamento da fumaça com chaminés rotacionadas, vegetação no pátio de carga, equipamentos sobre vias, guarda-sóis na água, sobreposição da linha ferroviária com a avenida, espaçamento de vagões e acessos às fachadas atuais. As sombras também recebem sua primeira atualização quando o perfil gráfico recria a luz.

A navegação considera os quatro cantos do enquadramento. A água usa geometria contínua e transição na foz; a praia mantém o espraiamento animado. A limpeza do canal e do depósito e o reflorestamento respondem às soluções das situações.

## Verificação

### Revisão de circulação — 7 de setembro

As extremidades das ruas locais agora se conectam a coordenadas da rede. O pátio industrial possui um circuito ligado ao acesso principal, e a coleta de carga tem retorno. O ramal ferroviário foi afastado da pista industrial, recebeu batentes nos dois terminais e plataformas identificadas; o monotrilho tem uma parada acessível por escada. Travessias rodoviárias e ferroviárias usam tabuleiros elevados, apoios e guarda-corpos. Veículos e postes acompanham a altura das pistas. As passarelas são posicionadas fora da faixa das pontes rodoviárias, e a pintura das ciclovias respeita a prioridade do asfalto nos encontros em nível.

O centro de reciclagem foi reconstruído e exportado pelo Blender MCP local, com cobertura de coleta, identificação dos recipientes, portas e proteções de recebimento, juntas cerâmicas, drenagem e equipamentos de cobertura. A fonte reproduzível permanece em `scripts/blender/reference_landmarks.py`, com GLBs principal e econômico.

Os testes de implantação também verificam destinos das ruas, fechamento do monotrilho, terminais do ramal, separação entre trilhos e automóveis e folga das passarelas em relação às pistas.

- `tests/reference-map.test.ts`: assets de alta/baixa qualidade, coordenadas, separação de lotes, vias e canais, apoios das pontes, limites responsivos, posição das situações e equipamentos/chaminés.
- Testes existentes de regras, narrativa, materiais e desempenho continuam ativos. Testes antigos de implantação preservam a cobertura dos módulos legados; o teste acima verifica a composição realmente montada.
- Testes de navegador: navegação e missão, troca de todos os perfis gráficos e persistência das preferências em desktop, celular e tela pequena.
- `node scripts/review-reference.mjs`: captura seis enquadramentos e registra erros de página/WebGL em `docs/screenshots/river-city/errors.json`.
- `node scripts/capture-models.mjs reference --future`: prancha dos novos modelos.

As capturas diagnósticas ocultam a interface. As amostras curtas do script visual incluem preparação de shaders e não constituem uma promessa de FPS em todos os dispositivos.

## Arquivos principais

`src/config/referenceMap.ts`: traçado e implantação em coordenadas da referência.

`src/config/referenceDetails.ts`: moradores, margens, estruturas, lixo e fumaça.

`src/components/environment/ReferenceCity.tsx` e `referenceGeometry.ts`: geometria renderizada e integração com as situações.

`scripts/blender/reference_landmarks.py`: fontes dos novos modelos.
