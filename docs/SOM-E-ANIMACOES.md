# Som, música e animações — 26/09/2026

## Áudio

- **Motor:** `src/audio/gameAudio.ts` (Web Audio). O contexto nasce no primeiro toque ou tecla, como os navegadores exigem, e é suspenso quando a aba fica oculta. Há um compressor no mestre, um barramento de efeitos e outro de música com filtro passa-baixa.
- **Ligação com o jogo:** `src/audio/useGameAudio.ts`. Os componentes não tocam sons diretamente: cliques em botões, abas, caixas e resumos tocam um toque por delegação (`data-sfx` escolhe outro som ou `none`), e os resultados vêm da store: moedas ganhas, compras, visual salvo, energia, lugares desbloqueados, foco em problema, avanço de diálogo e resultado das decisões (completa, provisória ou sem efeito).
- **Clima da música:** mapa com música e ambiente cheios; diálogos com a música mais baixa e abafada; loja e missões com som "de ambiente fechado" (passa-baixa); solução completa abaixa a trilha para a vinheta.
- **Configurações:** `musicVolume`, `sfxVolume` (0–100) e `muted` em `GameSettings`, normalizados em `normalizeGraphicsSettings`. O painel ganhou a seção Som; o cabeçalho, um botão de mudo.

### Arquivos

| Arquivo | Origem |
| --- | --- |
| `public/assets/audio/music/theme.mp3` | Trilha original de 80 s em loop (Fá maior, 96 BPM: marimba, kalimba, flauta, pad, baixo e percussão leve). |
| `public/assets/audio/music/ambience.mp3` | Ambiente da cidade de 48 s em loop: zumbido distante, brisa, carros passando, pássaros e campainha de bicicleta. |
| `public/assets/audio/music/jingle.mp3` | Vinheta de 4 s para soluções completas. |
| `public/assets/audio/sfx/*.mp3` | 23 efeitos da biblioteca UI SFX (pacotes `organic` e `rubber`), áudio CC0. |

A música é sintetizada, sem amostras, por `assets-source/audio/compose.js`. `npm run audio:render` renderiza no Chromium sem interface e codifica com ffmpeg (`FFMPEG` e `CHROMIUM` podem apontar para os executáveis). A cauda de reverberação é dobrada sobre o início para o loop não ter emenda; o motor compensa o atraso inicial do MP3 ao definir `loopStart`.

## Animações

- **Abertura:** a cidade em SVG embutido no HTML: prédios sobem em sequência, janelas acendem, painéis solares brilham, árvores brotam e balançam, turbinas giram, guindaste trabalha, nuvens e pássaros cruzam o céu, carro, ônibus e bicicleta andam na rua. A legenda alterna mensagens de preparação. Nada é baixado antes de a animação começar.
- **Missões:** o fundo abre em círculo a partir do atalho, o painel se desdobra em 3D, a medalha gira, as barras de progresso enchem e os cartões entram em sequência. Resgatar faz moedas voarem até o saldo; dar energia solta faíscas.
- **Loja:** uma persiana listrada "LOJA ABERTA" sobe, o holofote gira atrás do Impactus, que aterrissa, e os acessórios aparecem um a um. Comprar anima o cartão com faíscas; salvar o visual cerca o Impactus de faíscas.
- **Chegada (01/10/2026):** num jogo novo, depois do JOGAR e antes da primeira fala, Impactus chega voando: uma estrela no canto vira o robô, que passa perto da câmera, faz a volta e pousa na praça da estação central com clarão, onda de choque, poeira e faíscas; a câmera vai até lá girando um pouco, volta ao ângulo de sempre e o título "Capítulo 01 · A chegada" aparece. Depois ele salta para o retrato da primeira fala. "Pular abertura" (focado ao começar) ou Esc pulam; com movimento reduzido a história começa direto. Recomeçar a história toca de novo. Código: `src/game/arrival.ts` (tempos, câmera e trajeto, testados em `tests/arrival.test.ts`), `src/components/city/ArrivalScene.tsx` (relógio, câmera e efeitos no chão), `src/ui/cinematic/` (faixas, Impactus, rastro e título). Sons de vento e pouso são sintetizados em `gameAudio.whoosh`/`impact`.
- **Final (01/10/2026):** de volta ao mapa depois da última solução completa (as dez situações resolvidas), Impactus percebe que era o último problema e chama para uma volta. A câmera visita os dez lugares em ordem geográfica, com um salto curto entre eles; em cada um surge um balão de conferido com faíscas e uma legenda do que mudou, com pontos de progresso. Depois a cidade inteira aparece (numa tela estreita, a câmera pousa numa ponta e desliza até a outra) com fogos, confete e a faixa "Cidade transformada!", vem a conversa final e a tela de encerramento com lugares transformados, decisões tomadas e acertos de primeira. Dá para continuar explorando, ver o final de novo ou jogar desde o começo (com confirmação). "Pular passeio" e "Pular conversa" avançam; com movimento reduzido a câmera corta direto e não há partículas. O final toca uma vez: `progress.endingSeen` é salvo ao chegar ao encerramento. Código: `src/game/ending.ts` (sequência, enquadramentos e estatísticas, testados em `tests/ending.test.ts`), `src/content/ending.ts` (textos), `src/ui/ending/` (falas, legendas, faixa e encerramento), `fireworks` em `src/ui/effects/burst.ts`; a câmera segue `endingShot` em `src/game/CameraDirector.tsx`.
- **Extra (01/10/2026):** nas Configurações, a seção Extra repete as cenas especiais de volta ao mapa: a chegada (precisa de movimento ligado) e o final com a conversa (depois de visto, com a cidade toda resolvida). `src/ui/menus/ExtraScenes.tsx`, ações `playArrival` e `playEnding` da store.
- **Existentes:** logo flutuando e brilho no JOGAR, atalhos balançando, moeda do saldo girando quando muda, aviso entrando com salto.

Laços contínuos em controles clicáveis animam só sombra, contorno ou pseudo-elementos, para o alvo não se mover (automação de testes e toque preciso). "Reduzir movimentos" e `prefers-reduced-motion` desligam tudo, inclusive as partículas.
