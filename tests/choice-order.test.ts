import { describe, expect, it } from 'vitest';
import { choiceOrder, choiceSeed } from '../src/game/choiceOrder';
import { questions } from '../src/content/questions';

describe('choice order', () => {
  it('shuffles without losing or repeating alternatives, the same way for the same seed', () => {
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      const order = choiceOrder(items, 'seed' + i);
      expect([...order].sort()).toEqual(items);
      expect(choiceOrder(items, 'seed' + i)).toEqual(order);
    }
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('places the complete solution in every position across situations and visits', () => {
    const positions = [0, 0, 0];
    for (const [id, question] of Object.entries(questions)) {
      const complete = question.alternatives.find(alternative => alternative.effectiveness === 'COMPLETE');
      if (!complete) continue;
      for (let visit = 0; visit < 30; visit++) {
        positions[choiceOrder(question.alternatives, id + ':' + visit).indexOf(complete)]++;
      }
    }
    const total = positions.reduce((sum, count) => sum + count, 0);
    for (const count of positions) expect(count / total).toBeGreaterThan(.2);
  });

  it('changes the seed when the situation is decided again', () => {
    expect(choiceSeed('pollution_01', [])).toBe('pollution_01:0:0');
    expect(choiceSeed('pollution_01', [{ problemId: 'pollution_01' }, { problemId: 'health_01' }])).toBe('pollution_01:1:2');
  });
});
