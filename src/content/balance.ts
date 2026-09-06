import type {Effectiveness} from '../game/types';
// Preserve the established 1,500 starting coins, 100 reward and original cost bands.
// Ten complete solutions cost 2,350; rewards return 1,000, leaving 150 coins.
export const balance={initialCoins:1500,completionReward:100,
 costs:{standard:{COMPLETE:250,TEMPORARY:100,NONE:300},community:{COMPLETE:220,TEMPORARY:120,NONE:400}} satisfies Record<string,Record<Effectiveness,number>>};
