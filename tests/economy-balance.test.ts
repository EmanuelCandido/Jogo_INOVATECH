import { describe, expect, it } from 'vitest';
import { balance } from '../src/content/balance';
import { problems } from '../src/content/problems';
import { questions } from '../src/content/questions';
import { DAILY_BONUS, dailyMissionList } from '../src/game/dailyMissions';
import { canAfford } from '../src/game/economy';
import { NarrativeManager } from '../src/game/NarrativeManager';
import { ProblemManager } from '../src/game/ProblemManager';
import { finish, open, overview } from './helpers';

describe('coin balance', () => {
  it('lets a new city afford any first choice', () => {
    for (const problem of problems.filter(p => p.unlockAfter === 0)) {
      for (const alternative of questions[problem.questionId].alternatives) expect(alternative.cost).toBeLessThanOrEqual(balance.initialCoins);
    }
  });

  it('makes a wrong answer the cheapest mistake and a complete solution self-funding', () => {
    for (const costs of Object.values(balance.costs)) {
      expect(costs.COMPLETE).toBeGreaterThan(costs.TEMPORARY);
      expect(costs.TEMPORARY).toBeGreaterThan(costs.NONE);
      // A wrong first answer still leaves enough for the complete solution.
      expect(balance.initialCoins - costs.NONE).toBeGreaterThanOrEqual(costs.COMPLETE);
      expect(balance.completionReward).toBeGreaterThan(costs.COMPLETE);
      // ...but only by a little: solving is not a coin farm.
      expect(balance.completionReward - costs.COMPLETE).toBeLessThanOrEqual(30);
    }
  });

  it('always lets a player retry a first situation after any number of wrong attempts', () => {
    for (const first of problems.filter(p => p.unlockAfter === 0)) {
      const alternatives = questions[first.questionId].alternatives;
      const complete = alternatives.find(a => a.effectiveness === 'COMPLETE')!;
      for (const wrong of alternatives.filter(a => a.effectiveness !== 'COMPLETE')) {
        let s = overview();
        for (let attempt = 0; attempt < 6; attempt++) {
          s = open(s, first.id);
          expect(s.coins).toBeGreaterThanOrEqual(complete.cost);
          if (!canAfford(s.coins, wrong.cost)) break;
          s = finish(ProblemManager.decide(s, wrong.id));
          // A temporary fix reopens once the player decides something else.
          s = { ...s, problemStates: { ...s.problemStates, [first.id]: 'AVAILABLE' } };
        }
        s = open(s, first.id);
        expect(ProblemManager.decide(s, complete.id).problemStates[first.id]).toBe('SOLVED');
      }
    }
  });

  it('only returns coins spent on attempts, so reopening cannot farm coins', () => {
    let s = finish(ProblemManager.decide(open(), 'campaign'));
    const spent = balance.initialCoins - s.coins;
    s = { ...s, coins: 0 };
    let total = 0;
    for (let i = 0; i < 4; i++) {
      s = open(s);
      total += s.retryHelp ?? 0;
      s = NarrativeManager.cameraArrived(ProblemManager.leave(s));
      s = { ...s, coins: 0 };
    }
    expect(total).toBe(spent);
  });

  it('pays daily missions in the order of effort, about one shop piece a day', () => {
    const rewards = dailyMissionList.map(mission => mission.reward);
    expect(rewards).toEqual([...rewards].sort((a, b) => a - b));
    const total = rewards.reduce((sum, reward) => sum + reward, 0) + DAILY_BONUS;
    expect(total).toBe(250);
  });
});
