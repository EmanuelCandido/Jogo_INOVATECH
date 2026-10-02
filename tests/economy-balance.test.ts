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

  it('varies prices independently of answer quality and keeps complete solutions self-funding', () => {
    const completeRanks = new Set<number>();
    for (const question of Object.values(questions)) {
      const complete = question.alternatives.find(a => a.effectiveness === 'COMPLETE')!;
      const costs = question.alternatives.map(a => a.cost);
      expect(new Set(costs).size).toBe(3);
      for (const cost of costs) {
        expect(Number.isSafeInteger(cost)).toBe(true);
        expect(cost).toBeGreaterThan(0);
        expect(cost).toBeLessThanOrEqual(balance.initialCoins);
      }
      completeRanks.add(costs.filter(cost => cost < complete.cost).length);
      expect(complete.cost).toBeLessThanOrEqual(balance.completionReward);
    }
    expect([...completeRanks].sort()).toEqual([0, 1, 2]);
  });

  it('always lets a player retry a first situation after every wrong attempt', () => {
    for (const first of problems.filter(p => p.unlockAfter === 0)) {
      const alternatives = questions[first.questionId].alternatives;
      const complete = alternatives.find(a => a.effectiveness === 'COMPLETE')!;
      const wrongs = alternatives.filter(a => a.effectiveness !== 'COMPLETE');
      // Tried alternatives stay locked, so each order of wrong attempts is tried once.
      for (const order of [wrongs, [...wrongs].reverse()]) {
        let s = overview();
        for (const wrong of order) {
          s = open(s, first.id);
          expect(s.coins).toBeGreaterThanOrEqual(complete.cost);
          if (!canAfford(s.coins, wrong.cost)) break;
          s = finish(ProblemManager.decide(s, wrong.id));
          // A temporary fix reopens once the player decides something else.
          s = { ...s, problemStates: { ...s.problemStates, [first.id]: 'AVAILABLE' } };
        }
        s = open(s, first.id);
        expect(s.coins).toBeGreaterThanOrEqual(complete.cost);
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
