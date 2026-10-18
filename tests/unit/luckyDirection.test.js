// 오늘의 카드와 행운 방향 — docs/spec.md 2장
import { describe, expect, it } from 'vitest';
import { todayCard, cardAngle, dirName } from '../../src/engine/luckyDirection.js';

describe('오늘의 카드', () => {
  it('0~21 중 하나, 같은 날이면 누구나 같다', async () => {
    const a = await todayCard('2026-10-18');
    const b = await todayCard('2026-10-18');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(21);
  });

  it('날마다 바뀐다(한 달 동안 여러 카드가 나온다)', async () => {
    const cards = new Set();
    for (let d = 1; d <= 30; d++) cards.add(await todayCard(`2026-11-${String(d).padStart(2, '0')}`));
    expect(cards.size).toBeGreaterThan(5);
  });
});

describe('행운 방향', () => {
  it('카드 번호 × 360/22, 0번 정북', () => {
    expect(cardAngle(0)).toBe(0);
    expect(cardAngle(11)).toBe(180);
    expect(cardAngle(17)).toBeCloseTo(278.18, 2);
  });

  it('가장 가까운 16방위 이름', () => {
    expect(dirName(cardAngle(0))).toBe('북');
    expect(dirName(cardAngle(11))).toBe('남');
    expect(dirName(cardAngle(17))).toBe('서');
    expect(dirName(cardAngle(18))).toBe('서북서');
    expect(dirName(cardAngle(21))).toBe('북북서');
    expect(dirName(355)).toBe('북');
  });
});
