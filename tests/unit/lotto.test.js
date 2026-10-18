// 행운번호 — docs/spec.md 1장
import { describe, expect, it } from 'vitest';
import {
  todayNumbers, personalNumbers, pairNumbers, roundForDate, drawDateOfRound, COMBINATIONS,
} from '../../src/engine/lotto.js';

const salt = '0123456789abcdef0123456789abcdef';

function checkGame(g) {
  expect(g.drawn).toHaveLength(6);
  expect(new Set(g.drawn).size).toBe(6);
  for (const n of g.drawn) {
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(45);
  }
  expect(g.sorted).toEqual([...g.drawn].sort((a, b) => a - b));
  expect(g.odd + g.even).toBe(6);
  expect(g.sum).toBe(g.drawn.reduce((a, b) => a + b, 0));
}

describe('오늘의 행운번호', () => {
  it('5게임 A~E, 게임마다 1~45 중 서로 다른 6개', async () => {
    const games = await todayNumbers({ date: '2026-10-18', salt });
    expect(games.map((g) => g.game)).toEqual(['A', 'B', 'C', 'D', 'E']);
    games.forEach(checkGame);
  });

  it('A~E는 서로 다른 조합', async () => {
    const games = await todayNumbers({ date: '2026-10-18', salt });
    const keys = new Set(games.map((g) => g.sorted.join(',')));
    expect(keys.size).toBe(5);
  });

  it('같은 날·같은 기기면 같은 번호(새로고침해도 그대로)', async () => {
    const a = await todayNumbers({ date: '2026-10-18', salt });
    const b = await todayNumbers({ date: '2026-10-18', salt });
    expect(a).toEqual(b);
  });

  it('날짜나 기기 값이 바뀌면 다른 번호', async () => {
    const a = await todayNumbers({ date: '2026-10-18', salt });
    const b = await todayNumbers({ date: '2026-10-19', salt });
    const c = await todayNumbers({ date: '2026-10-18', salt: 'ffffffffffffffffffffffffffffffff' });
    expect(a[0].sorted).not.toEqual(b[0].sorted);
    expect(a[0].sorted).not.toEqual(c[0].sorted);
  });

  it('연속 번호 여부를 계산한다', async () => {
    const games = await todayNumbers({ date: '2026-10-18', salt });
    for (const g of games) {
      const s = g.sorted;
      const has = s.some((n, i) => i > 0 && n - s[i - 1] === 1);
      expect(g.hasConsecutive).toBe(has);
    }
  });

  it('모든 조합 수는 8,145,060', () => {
    expect(COMBINATIONS).toBe(8145060);
  });
});

describe('회차', () => {
  it('1회 = 2002-12-07, 1227회 = 2026-06-06(공공데이터와 일치)', () => {
    expect(drawDateOfRound(1)).toBe('2002-12-07');
    expect(drawDateOfRound(1227)).toBe('2026-06-06');
  });

  it('이번 주 회차 = 오늘 또는 다음 토요일의 회차, 일요일에 넘어간다', () => {
    expect(roundForDate('2026-06-06')).toBe(1227); // 토요일 당일
    expect(roundForDate('2026-06-01')).toBe(1227); // 월요일
    expect(roundForDate('2026-06-07')).toBe(1228); // 일요일
  });
});

describe('나만의·둘의 행운번호', () => {
  it('같은 회차·같은 날짜면 같고, 회차가 바뀌면 바뀐다', async () => {
    const a = await personalNumbers({ round: 1246, dateInput: '19900412' });
    const b = await personalNumbers({ round: 1246, dateInput: '19900412' });
    const c = await personalNumbers({ round: 1247, dateInput: '19900412' });
    a.forEach(checkGame);
    expect(a).toEqual(b);
    expect(a[0].sorted).not.toEqual(c[0].sorted);
  });

  it('둘의 번호는 두 사람 순서가 바뀌어도 같다', async () => {
    const a = await pairNumbers({ round: 1246, tokens: ['mbti:ESTJ', 'zodiac:03'] });
    const b = await pairNumbers({ round: 1246, tokens: ['zodiac:03', 'mbti:ESTJ'] });
    a.forEach(checkGame);
    expect(a).toEqual(b);
  });
});
