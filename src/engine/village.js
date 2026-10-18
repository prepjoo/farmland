// 내 귀땅 마을(가상 마을) — 순수 함수. 1팜 = 그림 속 가상 칸(100㎡ 상징), 실제 땅·소유가 아니다.
// 미션 2가지만: ① 오늘의 행운 보기(하루 1팜) ② 이번 주 5일 방문(주 1팜, 이번 주 = 행운번호 회차와 같은 일~토).
// 번호 보기·복권 구매·판매점 방문에는 보상하지 않는다(CLAUDE.md 10). 기록에는 날짜·회차만 남기고 입력·고른 곳은 남기지 않는다.
import { roundForDate } from './lotto.js';

export const THEMES = [
  { id: 'field', name: '들녘 마을', line: '논밭과 개울이 있는 들판 마을' },
  { id: 'sea', name: '바닷가 마을', line: '모래밭과 고깃배가 있는 바닷가 마을' },
];
export const PINS = [
  { id: 'sprout', name: '새싹이' },
  { id: 'chick', name: '병아리' },
  { id: 'scarecrow', name: '허수아비' },
];
export const WEEK_GOAL = 5;
export const GRID = 7;
export const MAX_DRAWN = GRID * GRID;
const KEEP_DAYS = 14;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyVillage() {
  return { v: 1, theme: null, pin: null, farms: 0, days: [], weeks: [] };
}

/** 저장소에서 읽은 값을 믿지 않고 고쳐서 돌려준다 */
export function normalizeVillage(raw) {
  const s = emptyVillage();
  if (!raw || typeof raw !== 'object') return s;
  if (THEMES.some((t) => t.id === raw.theme)) s.theme = raw.theme;
  if (PINS.some((p) => p.id === raw.pin)) s.pin = raw.pin;
  if (Number.isFinite(raw.farms) && raw.farms > 0) s.farms = Math.floor(raw.farms);
  if (Array.isArray(raw.days)) s.days = [...new Set(raw.days.filter((d) => typeof d === 'string' && DATE_RE.test(d)))].sort().slice(-KEEP_DAYS);
  if (Array.isArray(raw.weeks)) s.weeks = [...new Set(raw.weeks.filter((w) => Number.isInteger(w) && w > 0))].sort((a, b) => a - b).slice(-KEEP_DAYS);
  return s;
}

/** 마을 그림 고르기. 처음 고르면 첫 1팜 */
export function chooseTheme(state, theme) {
  if (!THEMES.some((t) => t.id === theme)) return state;
  return { ...state, theme, farms: state.farms > 0 ? state.farms : 1 };
}

export function choosePin(state, pin) {
  if (!PINS.some((p) => p.id === pin)) return state;
  return { ...state, pin };
}

export const doneToday = (state, date) => state.days.includes(date);

const daysInWeek = (state, round) => state.days.filter((d) => roundForDate(d) === round).length;

/** 이번 주 5일 방문 진행: 이번 주(회차)에 오늘의 행운을 본 날 수 */
export function weekProgress(state, date) {
  const round = roundForDate(date);
  return { done: Math.min(WEEK_GOAL, daysInWeek(state, round)), goal: WEEK_GOAL, rewarded: state.weeks.includes(round) };
}

/** 오늘의 행운을 봤을 때. gained: 'today'(하루 1팜), 'week'(이번 주 5일째 1팜) */
export function recordTodayLuck(state, date) {
  if (typeof date !== 'string' || !DATE_RE.test(date) || doneToday(state, date)) return { state, gained: [] };
  const gained = ['today'];
  let farms = state.farms + 1;
  const days = [...state.days, date].sort().slice(-KEEP_DAYS);
  let weeks = state.weeks;
  const round = roundForDate(date);
  if (!weeks.includes(round) && days.filter((d) => roundForDate(d) === round).length >= WEEK_GOAL) {
    gained.push('week');
    farms += 1;
    weeks = [...weeks, round].slice(-KEEP_DAYS);
  }
  return { state: { ...state, farms, days, weeks }, gained };
}

/** 그림에 칸을 놓는 순서: 7×7 판의 가운데에서 시작해 바깥으로 도는 나선. 이웃 칸으로 이어진다 */
export function plotCells(count) {
  const n = Math.min(Math.max(0, Math.floor(count) || 0), MAX_DRAWN);
  const out = [];
  let col = Math.floor(GRID / 2);
  let row = col;
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let step = 1;
  let d = 0;
  if (n > 0) out.push({ col, row });
  while (out.length < n) {
    for (let rep = 0; rep < 2 && out.length < n; rep++) {
      const [dc, dr] = dirs.at(d % 4);
      for (let k = 0; k < step && out.length < n; k++) {
        col += dc;
        row += dr;
        if (col >= 0 && col < GRID && row >= 0 && row < GRID) out.push({ col, row });
      }
      d++;
    }
    step++;
  }
  return out;
}
