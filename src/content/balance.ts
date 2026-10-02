// A new city starts with 100 coins (details in docs/RENDA-PASSIVA.md). Every
// choice fits in that budget. Costs live on each answer in situations.ts and
// vary independently of effectiveness, so a price cannot reveal the answer.
// Complete solutions cost 750 in total and each pays a 100-coin reward. When
// coins run short, earlier unsuccessful attempts are refunded up to the
// complete solution's price (see retryRefund in ProblemManager).
export const balance={initialCoins:100,completionReward:100};
