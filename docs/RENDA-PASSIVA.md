# Renda passiva dos problemas resolvidos

Cada situação resolvida continua rendendo moedas para a cidade enquanto o jogo
está aberto. O saldo mostra a renda atual logo abaixo do valor (`+6/min`).

## Valores

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

Referências do jogo: começa com 1.500 moedas, cada solução completa dá 100 de
recompensa e custa de 220 a 400; a loja tem 27 peças que somam 4.730 moedas
(de 80 a 300, média de 175).

- **Não rende demais.** A recompensa de 100 moedas de uma solução leva 50 minutos
  para ser ganha de novo só com a renda passiva. Resolver novas situações continua
  sendo o jeito mais rápido de ganhar moedas.
- **Não rende de menos.** Com 5 situações resolvidas (10/min), uma sessão de 30
  minutos rende cerca de 300 moedas, quase duas peças médias da loja.
- **A cidade inteira resolvida** (10 situações, 20/min, 1.200 por hora) compra uma
  peça média a cada 9 minutos, mas a loja inteira só depois de umas 4 horas de jogo.
- **O limite de 60 minutos fora do jogo** evita que deixar o jogo fechado por dias
  compre a loja inteira de uma vez.

Os valores ficam em `src/game/passiveIncome.ts` e os limites acima são conferidos
em `tests/passive-income.test.ts`.
