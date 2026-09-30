import type {Effectiveness} from '../game/types';
// A new city starts with 100 coins (details in docs/RENDA-PASSIVA.md). Every
// first choice fits in that budget, and a complete solution (70 or 80) pays a
// 100-coin reward, so each one leaves 20 to 30 coins for the next. A wrong
// answer costs 20 and a temporary fix 40 or 45: mistakes cost something, but
// never the whole budget. When a player opens a situation without enough coins
// for its complete solution, the coins spent on attempts that did not solve a
// problem are returned, up to that price (see retryRefund in ProblemManager).
export const balance={initialCoins:100,completionReward:100,
 costs:{standard:{COMPLETE:80,TEMPORARY:40,NONE:20},community:{COMPLETE:70,TEMPORARY:45,NONE:20}} satisfies Record<string,Record<Effectiveness,number>>};
