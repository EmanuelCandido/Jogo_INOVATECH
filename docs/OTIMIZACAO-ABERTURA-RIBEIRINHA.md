# Preparação antecipada do mobiliário ribeirinho

16/09/2026. Candidata aprovada no comparativo da Intel UHD para reduzir o bloqueio da primeira abertura. Não representa ganho de FPS sustentado nem certificação em celular físico.

## Causa e alteração

O perfil de CPU mapeado para o código apontou aproximadamente 3,67 s na busca por posições seguras para bancos, postes e árvores ribeirinhas. Essa busca verifica ruas, construções, ciclovias e caminhos a cada abertura, embora seu resultado não dependa do jogador.

O script `generate-reference-layout.mjs`, já executado antes de `npm run build` e `npm run dev`, agora também gera `src/config/riverside-layout.json`. A build guarda os índices dos objetos e suas posições finais; o navegador mantém os modelos, rotações, escalas e demais propriedades originais. Os caminhos de autoria e testes continuam executando a busca completa e rejeitam um posicionamento sem espaço.

O arquivo tem 25.894 bytes, aproximadamente 8.502 bytes com gzip. A preparação continua sendo executada na build, eliminando sua repetição em cada aparelho. Alterações no mapa ou nos objetos exigem regenerar o arquivo pelo comando de build, sem edição manual do JSON.

## Correção de precisão durante a validação

A primeira candidata serializava também as rotações. Node e Chrome produziram uma diferença de 4,44 × 10⁻¹⁶ radiano em um ângulo. Embora a matriz do posicionamento em Float32 parecesse igual, as capturas encontraram diferenças. Essa candidata foi descartada antes de publicação.

A versão final preserva as rotações calculadas pelo navegador e reutiliza apenas o resultado da busca de posições. Todos os campos dos 334 objetos foram comparados com o controle calculado pelo mesmo Chrome: os oito acessos produziram o mesmo SHA-256 dos dados completos, sem tolerância numérica.

## Comparação

Chrome sem janela na Intel UHD real, viewport 1920 × 1080, DPR 1, Ultra com escala 150%, canvas 2880 × 1620, sombras 4096 e animações ligadas. Quatro pares alternam a ordem entre busca no navegador e cache, em contextos novos, com cache HTTP desativado. Não foi controlado o cache do driver, a temperatura ou o perfil de energia. Os dois modos usam a mesma build.

| Medida | Busca no navegador | Preparado na build |
| --- | ---: | ---: |
| Abertura até JOGAR habilitado, mediana | 13,80 s | 9,90 s |
| Soma de tarefas longas na abertura, mediana | 13,13 s | 9,14 s |
| FPS durante navegação, mediana | 9,74 | 9,72 |

A abertura melhorou **28,3%** pela comparação das medianas; os pares individuais melhoraram entre 27,3% e 29,4%. O tempo de quadro na navegação variou entre −1,05% e +0,78%, sem regressão material ou melhoria de FPS. O p95 permaneceu entre 116,9 e 120,0 ms. As amostras de navegação usam seis segundos de teclado por condição, sem consultas de GPU.

Os 77 modelos e 34.005 instâncias foram mantidos. As 12 comparações de imagem nas vistas panorama, rio, floresta e praia tiveram **zero pixels diferentes**, incluindo o controle repetido da versão original. Não houve erro de navegador. Animações foram pausadas somente nas capturas fixas, após as amostras de navegação.

TypeScript e build de produção aprovados. Também passaram os cinco testes de consistência do snapshot e de circulação (`riverside-preparation` e `circulation-obstacles`).

Dados: [resultados e resumo](performance/riverside-prepared-intel/results.json), [perfil de CPU anterior](performance/startup-cpu-intel/results.json). Reprodução: `scripts/verify-riverside-preparation.mjs`; o controle original usa `?benchmark=1&runtimeRiverside=1` na build diagnóstica.

## Limites e próxima frente

A meta de 60 fps no máximo ainda não foi atingida. A GPU continua sendo o principal gargalo da movimentação. A tentativa anterior de evitar tonalidade em máscaras vazias das folhas não trouxe ganho e permanece desligada.

Na abertura, o perfil também atribuiu aproximadamente 4,72 s à criação das superfícies, com 2,96 s dentro da tesselação. Essa é uma próxima hipótese de CPU, a ser comparada separadamente e com geometria idêntica. Economizar tempo nessa fase não deve ser anunciado como aumento de FPS durante o movimento. Os ensaios em celulares físicos continuam pendentes.
