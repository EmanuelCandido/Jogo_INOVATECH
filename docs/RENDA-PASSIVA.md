# Economia de moedas

Valores em `src/content/balance.ts` (início e soluções), `src/game/dailyMissions.ts`
(missões do dia) e `src/game/passiveIncome.ts` (renda passiva). Os limites abaixo
são conferidos em `tests/game.test.ts`, `tests/wardrobe.test.ts` e
`tests/passive-income.test.ts`.

## Início e soluções

Uma cidade nova começa com **100 moedas**. Toda escolha da primeira situação cabe
nesse valor.

| Faixa de custo | Solução completa | Temporária | Nenhuma melhoria |
| --- | --- | --- | --- |
| Padrão | 80 | 40 | 90 |
| Comunitária | 70 | 45 | 100 |

- A solução completa devolve **100 moedas** de recompensa (uma vez por situação).
  Cada uma deixa de 20 a 30 moedas a mais para a próxima.
- Resolver as 10 situações por completo custa 750 e devolve 1.000: a primeira partida
  termina com cerca de 350 moedas, antes das missões e da renda passiva.
- Ignorar o problema continua sendo a escolha mais cara, e a temporária a mais barata.
  Quem escolhe a temporária no começo precisa de uma missão do dia (energia, +20) ou
  de alguns minutos de renda para pagar a solução completa.
- Saves antigos mantêm o saldo que já tinham; só cidades novas começam com 100.

## Missões do dia

Na ordem em que um dia de jogo chega a elas:

| Missão | Meta | Recompensa |
| --- | --- | --- |
| Dar energia ao Impactus | 1 | 20 |
| Conhecer uma emoção | 1 | 30 |
| Explorar a cidade | 3 lugares | 50 |
| Cuidar da cidade | 1 solução completa | 80 |
| Baú bônus (todas resgatadas) | | 70 |

Total: **250 moedas por dia**, pouco mais que uma peça média da loja.

## Renda passiva

Cada situação resolvida continua rendendo moedas enquanto o jogo está aberto. O saldo
mostra a renda atual logo abaixo do valor (`+6/min`).

| Estado do problema | Moedas por minuto |
| --- | --- |
| Resolvido (solução completa) | 2 |
| Resolvido temporariamente | 1 |
| Ainda não resolvido | 0 |

- Com o jogo fechado, o tempo fora rende no máximo **60 minutos** (até 1.200 moedas
  com a cidade inteira resolvida), pago ao abrir o jogo ou voltar para a aba.
- Frações de moeda não se perdem: ficam guardadas para o próximo pagamento.
- Uma solução nova só rende a partir do momento em que foi aplicada.

## A conta

A loja tem 27 peças que somam 4.730 moedas (de 80 a 300, média de 175).

- **Não rende demais.** A recompensa de 100 moedas de uma solução leva 50 minutos para
  ser ganha de novo só com a renda passiva, então resolver novas situações continua
  sendo o jeito mais rápido de ganhar moedas. A loja inteira leva várias horas de jogo.
- **Não rende de menos.** Uma primeira partida de uns 30 minutos termina com perto de
  900 moedas: 350 das soluções, 250 das missões do dia e cerca de 300 de renda. Isso
  compra umas 5 peças.
- **A cidade inteira resolvida** (20 por minuto, 1.200 por hora) compra uma peça média
  a cada 9 minutos.
- **O limite de 60 minutos fora do jogo** evita que deixar o jogo fechado por dias
  compre a loja inteira de uma vez.
