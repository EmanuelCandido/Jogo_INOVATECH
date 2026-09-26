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
- **Existentes:** logo flutuando e brilho no JOGAR, atalhos balançando, moeda do saldo girando quando muda, aviso entrando com salto.

Laços contínuos em controles clicáveis animam só sombra, contorno ou pseudo-elementos, para o alvo não se mover (automação de testes e toque preciso). "Reduzir movimentos" e `prefers-reduced-motion` desligam tudo, inclusive as partículas.
