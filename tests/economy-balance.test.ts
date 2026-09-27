import { describe, expect, it } from 'vitest';
import { balance } from '../src/content/balance';
import { problems } from '../src/content/problems';
import { questions } from '../src/content/questions';
import { DAILY_BONUS, dailyMissionList } from '../src/game/dailyMissions';

describe('coin balance', () => {
  it('lets a new city afford any first choice', () => {
    for (const problem of problems.filter(p => p.unlockAfter === 0)) {
      for (const alternative of questions[problem.questionId].alternatives) expect(alternative.cost).toBeLessThanOrEqual(balance.initialCoins);
    }
  });

  it('keeps ignoring the most expensive choice and a complete solution self-funding', () => {
    for (const costs of Object.values(balance.costs)) {
      expect(costs.NONE).toBeGreaterThan(costs.COMPLETE);
      expect(costs.COMPLETE).toBeGreaterThan(costs.TEMPORARY);
      expect(balance.completionReward).toBeGreaterThan(costs.COMPLETE);
      // ...but only by a little: solving is not a coin farm.
      expect(balance.completionReward - costs.COMPLETE).toBeLessThanOrEqual(30);
    }
  });

  it('pays daily missions in the order of effort, about one shop piece a day', () => {
    const rewards = dailyMissionList.map(mission => mission.reward);
    expect(rewards).toEqual([...rewards].sort((a, b) => a - b));
    const total = rewards.reduce((sum, reward) => sum + reward, 0) + DAILY_BONUS;
    expect(total).toBe(250);
  });
});
