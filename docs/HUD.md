# HUD Eco City!

Atualizado em 15/09/2026 a partir dos frames [12:58](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=12-58), [17:2](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=17-2) e [17:17](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=17-17).

## Visual aplicado

- Logo vetorial, Impactus piscando, moeda, ícone de menu, listras e auras exportados do próprio Figma. A introdução usa o retrato da referência; reflexão, alerta, comemoração e preocupação usam as quatro poses correspondentes já existentes. Cada troca mantém a imagem anterior até a nova pose ser decodificada, ignorando carregamentos atrasados de uma etapa já encerrada.
- Fontes Exo 2 e Manrope locais. Exo 2 Bold no nome e nas falas, Medium nas escolhas, ExtraBold nos custos e Black no botão JOGAR e saldo.
- Painéis `#5D01C7`, bordas `#30007E`, faixa de abertura com borda `#7203F1` e base de alternativas `#E4E4E4`.
- Canto superior esquerdo reto, placa com extremidade esquerda reta, borda inferior escura, iluminação interna e sombras dimensionadas pela referência.
- Abertura com mapa desfocado e sem frase/cabeçalho adicionais. Falas sem cabeçalho ou rodapé. Perguntas com saldo e menu circular no canto superior direito.

No celular, a composição parte da prancheta de 750 × 1334 e reserva espaço para o cabeçalho. Após conferir novamente os frames 17:2 e 17:17, o retrato das poses do jogo ocupa 510 unidades da arte (antes 634, redução de aproximadamente 20%) e desloca sua margem transparente 28 unidades para a esquerda. Assim, o corpo fica acima da parte esquerda da placa de nome, preservando os braços. O espaço vertical reservado nas perguntas diminui proporcionalmente. O menu tem 48 px visíveis, a moeda 48 px e o saldo usa fonte de 20 px. No desktop, esses tamanhos são 56 px, 58 px e 24 px, sem redução pela escala da arte.

Em telas a partir de 1000 px de largura, as falas ocupam um painel largo na parte inferior esquerda, com texto entre 21 e 26 px e o personagem acima. Nas perguntas, as alternativas ficam à direita do diálogo. Textos reais fluem nos painéis e a indicação de continuar tem sua própria linha. Em telas baixas na horizontal, o personagem fica ao lado da área de leitura e as alternativas podem ser roladas.

O cenário continua sendo a cidade 3D jogável. Textos, custos, recompensas e saves continuam vindo das regras da partida; por isso o fundo e o conteúdo não são uma captura idêntica do protótipo estático.

## Interação

Ao selecionar uma missão, a câmera aproxima e centraliza o problema, com aceleração e desaceleração suaves. Depois de chegar, a cena permanece sem personagem, diálogo ou cabeçalho por 3,5 segundos completos. Só então Impactus entra pela esquerda, na escala ajustada à composição, seguido do painel e da placa de nome. As alternativas aparecem em sequência. As falas seguintes não reiniciam a câmera nem a entrada do personagem.

A preferência de movimento reduzido desativa as animações da interface e abrevia o voo, mantendo o tempo para observar. Sair da aba interrompe a espera; voltar oferece novamente os 3,5 segundos. Girar a tela durante a aproximação reenquadra a cena antes de iniciar a espera. O botão “Voltar” fica no canto superior esquerdo desde a aproximação e cancela a espera ao sair. Antes da decisão, preserva moedas e deixa o problema disponível; depois da decisão, preserva o resultado.

Toque ou clique em qualquer parte da tela durante uma fala para continuar. Arrastar, rolar ou selecionar texto não dispensa a fala; perguntas exigem escolher uma alternativa. O clique sintetizado após o toque de continuação é consumido. As alternativas aguardam 650 ms e exigem um novo gesto iniciado sobre a opção habilitada, evitando escolhas involuntárias por toque duplo. Ativação por teclado e tecnologia assistiva continua disponível. Carregamento e configurações abertas bloqueiam o avanço. O botão de continuação e Enter/Espaço também funcionam.

O card de zoom foi removido. O mapa mantém arrasto, pinça, roda do mouse e os atalhos de teclado anunciados pelo canvas (setas, mais, menos e Home).

O menu aparece nas perguntas, resultados e mapa. No computador, Escape abre/fecha as configurações em qualquer etapa. “Decidir depois · voltar ao mapa” está no menu das perguntas, preservando o retorno sem gastar moedas. Uma partida salva retoma sua etapa; a abertura aparece para partidas novas.

## Fontes e validação

[Proveniência das artes e fontes](../assets-source/ui/figma/README.md). [Auditoria anterior à correção](HUD-FIGMA-REVIEW.md).

A suíte `tests/e2e/hud.spec.ts` verifica abertura, retomada, leitura, custos, alternativas e retorno ao mapa em desktop, Pixel 7 e 360 × 640. `dialogue-touch.spec.ts` cobre toque na tela, arrastos, menus e escolhas; `dialogue.spec.ts` cobre tutorial/teclado/restauração; `loading.spec.ts` verifica bloqueio durante carregamento.

As capturas atualizadas ficam em `docs/screenshots/hud-figma/`.

Resultado em 15/09/2026: TypeScript e compilação de produção aprovados. Os 15 testes de navegador acima passaram nos três perfis, incluindo rotação para 844 × 390 no perfil pequeno. Capturas de abertura, falas, contexto e escolhas inspecionadas visualmente.

A adaptação posterior para desktop e o aumento do cabeçalho são registrados em `docs/screenshots/hud-responsive/`. Os testes do HUD também verificam o tamanho visível do menu, moeda e saldo, além do alinhamento inferior em 1440 × 900, 1600 × 756 e 1024 × 600.

Validação desta adaptação: os nove testes de HUD e toque passaram em desktop, Pixel 7 e 360 × 640, incluindo modo horizontal. TypeScript e compilação de produção aprovados.

Correção de poses: `CharacterStage` usa o arquivo associado ao estado narrativo em `characters.companion.poses`. A validação no navegador confere tanto o estado quanto o `src` e a imagem carregada, incluindo uma pose com resposta de rede atrasada.

Correção do enquadramento: a máscara do retrato agora acomoda toda a largura das imagens, incluindo braços abertos e capa. A escala nas telas verticais e no desktop é preservada, limitada à largura disponível do diálogo. O recorte inferior termina atrás do painel; no modo horizontal baixo, a imagem inteira cabe na coluna lateral. Os testes de poses também conferem se a imagem está dentro dos limites horizontais da máscara e da tela.

Validação da correção de poses: seis testes unitários da narrativa, quatro testes de navegador (cinco poses em desktop, Pixel 7 e 360 × 640; carregamento atrasado no desktop), TypeScript e compilação de produção aprovados.

Validação do enquadramento: dez testes de navegador de diálogo e HUD aprovados (desktop, Pixel 7, 360 × 640 e rotação para 844 × 390), além de TypeScript e compilação. Duas repetições móveis do teste de rede atrasada são ignoradas intencionalmente. Capturas `pose-uncropped-*` em `docs/screenshots/hud-responsive/` registram o resultado.

Validação da correção mobile em 16/09/2026: 33 testes unitários aprovados, 14 testes de navegador nos perfis Pixel 7 e 360 × 640, cinco de mouse/teclado no desktop e duas verificações finais no celular pequeno. As duas verificações de teclado físico são ignoradas nos projetos de toque. A câmera ficou pelo menos 4,9 segundos completamente parada e sem diálogo antes da entrada (tolerância de amostragem de 100 ms para a espera de cinco segundos), inclusive com movimento reduzido. Toque duplo não alterou saldo nem decisões; um novo toque ou Enter escolheu apenas uma alternativa. TypeScript e build com o caminho de publicação aprovados. Capturas e relatórios locais em `test-results/mobile-problem-*`.

Validação do ajuste seguinte: oito testes de HUD e enquadramento aprovados em Pixel 7 e 360 × 640, incluindo rotação e movimento reduzido. O retrato ficou menor, com seu centro à esquerda de 40% da largura da tela; a espera observada após a chegada da câmera corresponde a 3,5 segundos. TypeScript e compilação de publicação aprovados. Capturas em `test-results/portrait-left-3500/`.
