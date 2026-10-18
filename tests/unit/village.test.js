// 내 귀땅 마을(가상 마을) 엔진 — 1팜은 그림 속 가상 칸. 미션 2가지(오늘의 행운 보기 · 이번 주 5일 방문).
import { describe, it, expect } from 'vitest';
import {
  emptyVillage, normalizeVillage, chooseTheme, choosePin, recordTodayLuck, weekProgress,
  doneToday, plotCells, THEMES, PINS, WEEK_GOAL, MAX_DRAWN,
} from '../../src/engine/village.js';

const seq = (state, dates) => dates.reduce((s, d) => recordTodayLuck(s, d).state, state);

describe('마을 상태', () => {
  it('처음은 빈 마을, 그림·캐릭터 2종 이상', () => {
    expect(emptyVillage()).toEqual({ v: 1, theme: null, pin: null, farms: 0, days: [], weeks: [] });
    expect(THEMES.map((t) => t.id)).toEqual(['field', 'sea']);
    expect(PINS.length).toBeGreaterThanOrEqual(3);
  });

  it('저장소에서 읽은 값이 이상하면 빈 마을로 고친다', () => {
    expect(normalizeVillage(null)).toEqual(emptyVillage());
    expect(normalizeVillage('abc')).toEqual(emptyVillage());
    const fixed = normalizeVillage({ v: 1, theme: 'moon', pin: 'x', farms: -3, days: ['2026-10-12', 'bad', 5], weeks: [1194, 'x'] });
    expect(fixed).toEqual({ v: 1, theme: null, pin: null, farms: 0, days: ['2026-10-12'], weeks: [1194] });
    expect(normalizeVillage({ farms: 2.7 }).farms).toBe(2);
  });

  it('처음 마을 그림을 고르면 첫 1팜, 다시 바꿔도 팜은 그대로', () => {
    const a = chooseTheme(emptyVillage(), 'field');
    expect(a.theme).toBe('field');
    expect(a.farms).toBe(1);
    const b = chooseTheme(a, 'sea');
    expect(b.theme).toBe('sea');
    expect(b.farms).toBe(1);
    expect(chooseTheme(a, 'moon')).toBe(a); // 없는 그림은 무시
  });

  it('캐릭터 고르기', () => {
    const s = choosePin(emptyVillage(), PINS[1].id);
    expect(s.pin).toBe(PINS[1].id);
    expect(choosePin(s, 'nope')).toBe(s);
  });

  it('원래 상태를 바꾸지 않는다(순수 함수)', () => {
    const s = emptyVillage();
    recordTodayLuck(s, '2026-10-12');
    chooseTheme(s, 'field');
    expect(s).toEqual(emptyVillage());
  });
});

describe('미션 1: 오늘의 행운 보기 (하루 1팜)', () => {
  it('그날 처음 보면 +1팜, 같은 날 다시 보면 그대로', () => {
    const r1 = recordTodayLuck(emptyVillage(), '2026-10-12');
    expect(r1.gained).toEqual(['today']);
    expect(r1.state.farms).toBe(1);
    expect(doneToday(r1.state, '2026-10-12')).toBe(true);
    const r2 = recordTodayLuck(r1.state, '2026-10-12');
    expect(r2.gained).toEqual([]);
    expect(r2.state.farms).toBe(1);
    expect(doneToday(r2.state, '2026-10-13')).toBe(false);
  });

  it('날짜 형식이 아니면 아무것도 하지 않는다', () => {
    const r = recordTodayLuck(emptyVillage(), '어제');
    expect(r.gained).toEqual([]);
    expect(r.state).toEqual(emptyVillage());
  });

  it('기록은 최근 14일만 남긴다(날짜만, 입력·고른 곳 없음)', () => {
    const dates = Array.from({ length: 20 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const s = seq(emptyVillage(), dates);
    expect(s.days).toHaveLength(14);
    expect(s.days.at(-1)).toBe('2026-10-20');
    expect(Object.keys(s).sort()).toEqual(['days', 'farms', 'pin', 'theme', 'v', 'weeks']);
  });
});

describe('미션 2: 이번 주 5일 방문 (주 1팜)', () => {
  // 이번 주 = 행운번호 회차와 같은 주(일요일~토요일, 한국 날짜). 2026-10-11(일)~10-17(토)
  it('같은 주에 5일째 보면 +1팜 더, 6일째는 하루 1팜만', () => {
    let s = seq(emptyVillage(), ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14']);
    expect(s.farms).toBe(4);
    expect(weekProgress(s, '2026-10-14')).toEqual({ done: 4, goal: WEEK_GOAL, rewarded: false });
    const r5 = recordTodayLuck(s, '2026-10-16');
    expect(r5.gained).toEqual(['today', 'week']);
    expect(r5.state.farms).toBe(6);
    expect(weekProgress(r5.state, '2026-10-16')).toEqual({ done: 5, goal: 5, rewarded: true });
    const r6 = recordTodayLuck(r5.state, '2026-10-17');
    expect(r6.gained).toEqual(['today']);
    expect(r6.state.farms).toBe(7);
    s = r6.state;
    expect(weekProgress(s, '2026-10-17').done).toBe(5); // 5를 넘겨 보이지 않음
  });

  it('일요일에 새 주가 시작된다', () => {
    const s = seq(emptyVillage(), ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17']);
    expect(weekProgress(s, '2026-10-17').rewarded).toBe(true);
    expect(weekProgress(s, '2026-10-18')).toEqual({ done: 0, goal: 5, rewarded: false });
  });

  it('주를 걸친 5일은 보상이 없다', () => {
    const s = seq(emptyVillage(), ['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19']);
    expect(s.farms).toBe(5);
    expect(s.weeks).toEqual([]);
  });
});

describe('마을 그림 칸', () => {
  it('가운데부터 바깥으로 겹치지 않게 놓인다', () => {
    const cells = plotCells(MAX_DRAWN);
    expect(cells).toHaveLength(MAX_DRAWN);
    expect(cells[0]).toEqual({ col: 3, row: 3 });
    expect(new Set(cells.map((c) => `${c.col},${c.row}`)).size).toBe(MAX_DRAWN);
    for (const c of cells) {
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeLessThan(7);
      expect(c.row).toBeGreaterThanOrEqual(0);
      expect(c.row).toBeLessThan(7);
    }
    // 이웃한 칸으로 이어진다
    for (let i = 1; i < cells.length; i++) {
      const d = Math.abs(cells[i].col - cells[i - 1].col) + Math.abs(cells[i].row - cells[i - 1].row);
      expect(d).toBe(1);
    }
  });

  it('그리는 칸은 최대 49칸, 0이나 음수는 빈 목록', () => {
    expect(plotCells(80)).toHaveLength(MAX_DRAWN);
    expect(plotCells(0)).toEqual([]);
    expect(plotCells(-1)).toEqual([]);
    expect(plotCells(3)).toEqual(plotCells(MAX_DRAWN).slice(0, 3));
  });
});
