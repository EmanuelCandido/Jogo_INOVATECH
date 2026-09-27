import { describe, expect, it } from 'vitest';
import { incomePerMinute, normalizeIncome, owedIncome, passiveIncome, settleIncome } from '../src/game/passiveIncome';
import { initialProgress } from '../src/game/save';
import { problems } from '../src/content/problems';
import { accessories } from '../src/game/wardrobe';
import type { Progress } from '../src/game/types';

const minute = 60000;
function city(solved: number, temporary = 0, at = 0, carry = 0): Progress {
  const progress = initialProgress();
  problems.forEach((problem, i) => {
    progress.problemStates[problem.id] = i < solved ? 'SOLVED' : i < solved + temporary ? 'TEMPORARILY_SOLVED' : 'AVAILABLE';
  });
  return { ...progress, income: { at, carry } };
}

describe('passive income', () => {
  it('pays for solved situations only', () => {
    expect(incomePerMinute(city(0))).toBe(0);
    expect(incomePerMinute(city(1))).toBe(2);
    expect(incomePerMinute(city(1, 1))).toBe(3);
    expect(incomePerMinute(city(problems.length))).toBe(2 * problems.length);
  });

  it('keeps fractions for the next payment', () => {
    const progress = city(1, 0, 0, .5);
    expect(owedIncome(progress, 15000)).toEqual({ coins: 1, carry: 0 });
    const next = settleIncome(progress, progress, 20000);
    expect(next.coins).toBe(progress.coins + 1);
    expect(next.income!.at).toBe(20000);
    expect(next.income!.carry).toBeCloseTo(1 / 6);
  });

  it('pays the time away up to the cap', () => {
    const progress = city(problems.length);
    const perHour = incomePerMinute(progress) * passiveIncome.offlineCapMinutes;
    expect(owedIncome(progress, 30 * minute).coins).toBe(perHour / 2);
    expect(owedIncome(progress, 24 * 60 * minute).coins).toBe(perHour);
  });

  it('pays nothing without a clock or for time that goes backwards', () => {
    expect(owedIncome({ ...city(3), income: undefined }, 10 * minute).coins).toBe(0);
    expect(owedIncome(city(3, 0, 10 * minute), 0).coins).toBe(0);
  });

  it('starts paying a new solution only from the moment it exists', () => {
    const before = city(0, 0, 0);
    const after = city(1, 0, 0);
    expect(settleIncome(before, after, 30 * minute).coins).toBe(after.coins);
  });

  it('restores only a valid stored clock', () => {
    expect(normalizeIncome({ at: 5, carry: .25 }, 10)).toEqual({ at: 5, carry: .25 });
    expect(normalizeIncome({ at: 50, carry: 0 }, 10)).toEqual({ at: 10, carry: 0 });
    for (const value of [null, 3, {}, { at: 'x', carry: 0 }, { at: 1, carry: 1 }, { at: 1, carry: -1 }, { at: Infinity, carry: 0 }]) {
      expect(normalizeIncome(value, 10)).toBeUndefined();
    }
  });

  it('stays below solving new situations and above pocket change', () => {
    const whole = incomePerMinute(city(problems.length));
    const prices = accessories.filter(item => item.price > 0).map(item => item.price);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    // A solution's 100-coin reward is earned again in no less than 30 minutes.
    expect(100 / passiveIncome.perMinute.SOLVED!).toBeGreaterThanOrEqual(30);
    // The whole city buys an average piece in 5 to 15 minutes...
    expect(average / whole).toBeGreaterThan(5);
    expect(average / whole).toBeLessThan(15);
    // ...and the whole shop only after hours of play.
    expect(prices.reduce((sum, price) => sum + price, 0) / whole / 60).toBeGreaterThan(3);
  });
});
