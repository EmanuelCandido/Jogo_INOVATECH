# HUD Eco City!

A interface aplica o visual das três referências fornecidas: título com letras em relevo e botão JOGAR, retrato do Impactus sobre a placa de identificação, caixa de fala azul-violeta e três alternativas sobre uma base clara, com custos à direita.

As cinco poses existentes acompanham os estados narrativos. Os valores continuam vindo das regras da partida; as imagens de referência não alteram custos, recompensas ou progresso. A abertura aparece para uma nova partida e os saves em andamento retomam sua etapa.

No celular de 360 × 640, a pergunta tem espaço reservado e o retrato é compacto. Textos extensos e configurações podem ser rolados. Os controles mantêm navegação por teclado, indicação de saldo insuficiente e redução de movimento.

## Capturas

- [Abertura no desktop](screenshots/hud/title-desktop.png)
- [Diálogo no desktop](screenshots/hud/intro-desktop.png)
- [Alternativas no desktop](screenshots/hud/choices-desktop.png)
- [Abertura no celular](screenshots/hud/title-mobile.png)
- [Diálogo no celular](screenshots/hud/intro-mobile.png)
- [Alternativas no celular](screenshots/hud/choices-mobile.png)
- [Alternativas em 360 × 640](screenshots/hud/choices-small.png)
- [Configurações em 360 × 640](screenshots/hud/settings-small.png)
- [Alternativas em modo horizontal](screenshots/hud/choices-landscape.png)

## Validação

Compilação de produção e 21 testes das regras do jogo aprovados. Nove testes de navegador aprovados: abertura e retomada em três tamanhos, legibilidade das perguntas e custos, cinco poses, tutorial, teclado, conclusão das dez situações, soluções provisórias e saldo insuficiente.

Para repetir a verificação do HUD: `npx playwright test tests/e2e/hud.spec.ts --workers=1`. A suíte usa as dimensões desktop, Pixel 7 e 360 × 640.
