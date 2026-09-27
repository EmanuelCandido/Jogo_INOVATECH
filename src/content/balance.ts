import type {Effectiveness} from '../game/types';
// A new city starts with 100 coins (details in docs/RENDA-PASSIVA.md). Every
// first choice fits in that budget, and a complete solution (70 or 80) pays a
// 100-coin reward, so each one leaves 20 to 30 coins for the next. Ten complete
// solutions cost 750; rewards return 1,000, leaving 350 coins. Ignoring the
// problem stays the most expensive choice; the temporary fix is the cheapest.
export const balance={initialCoins:100,completionReward:100,
 costs:{standard:{COMPLETE:80,TEMPORARY:40,NONE:90},community:{COMPLETE:70,TEMPORARY:45,NONE:100}} satisfies Record<string,Record<Effectiveness,number>>};
