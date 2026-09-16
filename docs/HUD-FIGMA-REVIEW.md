# Comparação do HUD com o Figma

> Registro da análise anterior à correção. A implementação posterior aplicou as artes, fontes, cores e composição do Figma; veja [HUD atual](HUD.md). As diferenças e capturas abaixo descrevem a versão antiga.

Análise de 15/09/2026, com leitura do código de referência e das imagens dos três frames no Figma, comparação com os componentes React/CSS atuais e capturas do jogo no navegador.

**Conclusão: o HUD tem a estrutura das referências, mas não é uma reprodução fiel.** As fotos fornecidas inicialmente não mostravam com precisão a cor original. O Figma usa roxo intenso; a implementação atual usa azul-violeta.

## Referências consultadas

- [Abertura — frame 12:58](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=12-58)
- [Contexto do problema — frame 17:2](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=17-2)
- [Pergunta e alternativas — frame 17:17](https://www.figma.com/design/tXQE0PouFqqOIl3CMMZsXh/Jogo?node-id=17-17)

## Diferenças verificadas

| Elemento | Figma | Jogo atual |
| --- | --- | --- |
| Cor dos painéis | Fundo `#5D01C7`, borda/sombra `#30007E` | Gradiente `#675AF0 → #4942DF → #5959ED`, borda clara `#8A7CF3` |
| Tipografia principal | Exo 2: Bold no diálogo/nome, Medium nas alternativas, ExtraBold nos preços e Black em JOGAR | DM Sans e Manrope; o logo é texto em Arial Black/Manrope |
| Logo | Arte vetorial exportada, letras com contornos, volumes e inclinações próprios | Aproximação com texto, contorno CSS e sombras; o desenho das letras não coincide |
| Abertura | Fundo desfocado, logo mais alto, faixa inferior roxa e botão JOGAR | Fundo nítido, logo mais baixo no celular, botão e faixa azul-violeta, menu e frase adicional |
| Impactus | Pose piscando, braços abaixados; retrato grande com brilho roxo atrás | Cinco poses diferentes; retrato muda conforme a narrativa e fica bem menor na pergunta em 360 × 640 |
| Caixa de diálogo | Borda roxa escura, canto superior esquerdo reto, iluminação interna na parte inferior | Contorno claro, todos os cantos arredondados e sombra inferior mais marcada |
| Placa do nome | Recorte retangular à esquerda, borda inferior escura e pouca separação do painel | Placa com contorno claro, altura e espaçamento diferentes |
| Composição do contexto | Retrato e caixa formam um conjunto na região central/inferior; não há cabeçalho nem rodapé nesse frame | Caixa ancorada perto do rodapé; logo, saldo, menu e rodapé continuam presentes |
| Indicação de continuar | Manrope Bold branca a 45% de opacidade, sem seta nem indicador de falas | Texto mais claro, seta; na introdução há também pontos de progresso |
| Base das alternativas | Cinza `#E4E4E4`, borda branca translúcida | Creme `#F8F6E9`, borda `#D8D5C8` e sombra inferior |
| Botões das alternativas | Roxo `#5D01C7`, borda inferior `#30007E` e brilho na parte superior | Gradiente violeta mais azulado, contorno claro e proporções diferentes |
| Saldo e menu da pergunta | Moeda ilustrada sobreposta à esquerda do saldo; menu circular compacto | Moeda CSS com estrela dentro do painel, legenda adicional e menu quadrado arredondado |
| Elementos extras na pergunta | Sem logo no canto esquerdo, rodapé ou botão de adiar | Logo, rodapé e “Decidir depois” aparecem, dependendo do tamanho da tela |

Os dois seguem a mesma organização geral: Impactus acima da placa, texto branco no painel e três alternativas sobre uma base clara com preço à direita. Isso explica a semelhança, mas não elimina as diferenças de arte, cor, fonte e proporção.

Os textos e custos também não coincidem: o frame de referência mostra `−500 / −250 / 0`; a situação de lixo do jogo usa `−220 / −120 / −400`. Esses valores pertencem à economia atual da partida e não foram alterados nesta correção. O mapa 3D também é diferente do fundo do Figma; essa diferença é do cenário, além do HUD.

As medidas absolutas do Figma não foram tratadas como valores equivalentes nos celulares: a implementação é responsiva. A comparação de composição usa as capturas e a posição relativa dos elementos.

## Correção do toque

A tela inteira recebe toque/clique nos estados de fala: introdução, observação, contexto e resultado. O gesto avança uma única etapa, inclusive sobre o retrato, o texto, áreas vazias e a borda inferior.

- Botões e links mantêm suas próprias ações, sem avanço duplicado.
- Perguntas exigem a seleção de uma alternativa.
- Configurações abertas e carregamento da cena não permitem avanço pelo fundo.
- Arrastos, rolagens, gestos cancelados e seleção de texto não dispensam a fala.
- O botão explícito e os comandos de teclado continuam disponíveis.

A mudança de comportamento está em `src/ui/dialogue/DialogueStage.tsx` e `src/ui/styles.css`. O desenho do HUD foi analisado, sem substituir suas artes ou alterar a economia.

## Evidência no navegador

Capturas da versão analisada:

- [Contexto no desktop](screenshots/hud-review/context-desktop.png)
- [Pergunta no desktop](screenshots/hud-review/question-desktop.png)
- [Contexto no celular](screenshots/hud-review/context-mobile.png)
- [Pergunta no celular](screenshots/hud-review/question-mobile.png)

Regressões cobertas em `tests/e2e/dialogue-touch.spec.ts` e `tests/e2e/loading.spec.ts`: toque/clique fora do botão, um avanço por gesto, continuidade após rolagem, menus, perguntas, resultados e espera pelo carregamento. Desktop, Pixel 7 e 360 × 640.

Resultado: os seis testes de navegador passaram. A checagem de TypeScript e a compilação de produção também passaram.
