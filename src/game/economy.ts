export function canAfford(coins: number, cost: number) {
  return Number.isSafeInteger(cost) && cost >= 0 && coins >= cost;
}
export function spend(coins: number, cost: number) {
  if (!canAfford(coins, cost))
    throw new Error("Moedas insuficientes para esta solução.");
  return coins - cost;
}
