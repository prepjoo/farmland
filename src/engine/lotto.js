// 행운번호 (docs/spec.md 1장). 오락용이며 당첨 확률과 관계없다.
// 1~45를 결정적 난수로 섞어(피셔-예이츠) 앞 6개를 쓴다. 섞는 방식이라 중복이 생기지 않는다.
// 정렬(sorted)은 보여 주는 순서일 뿐이고, 추첨기에서 공이 나오는 순서는 drawn이다.
import { makeSeed, createRng } from './seed.js';

export const COMBINATIONS = 8145060; // 45개 중 6개를 고르는 경우의 수
export const GAMES = ['A', 'B', 'C', 'D', 'E'];
export const RULE = { today: 'fl-lotto-v1', personal: 'fl-lotto-me-v1', pair: 'fl-lotto-pair-v1' };

const FIRST_DRAW = Date.UTC(2002, 11, 7); // 1회 추첨일(토)
const DAY = 86400000;

function describe(game, drawn) {
  const sorted = [...drawn].sort((a, b) => a - b);
  const odd = drawn.filter((n) => n % 2 === 1).length;
  return {
    game,
    drawn,
    sorted,
    odd,
    even: 6 - odd,
    sum: drawn.reduce((a, b) => a + b, 0),
    hasConsecutive: sorted.some((n, i) => i > 0 && n - sorted[i - 1] === 1),
  };
}

/** 씨앗 글자 → 1~45 중 서로 다른 6개(나온 순서) */
export async function drawSix(seedText) {
  const rng = createRng(await makeSeed(seedText));
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = 0; i < 6; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6);
}

/** 5게임을 만든다. 앞 게임과 조합이 같으면 게임 글자 뒤에 #1, #2…를 붙여 다시 뽑는다. */
async function fiveGames(prefixParts) {
  const games = [];
  const seen = new Set();
  for (const game of GAMES) {
    let drawn;
    for (let k = 0; ; k++) {
      const tag = k === 0 ? game : `${game}#${k}`;
      drawn = await drawSix([...prefixParts, tag].join('|'));
      const key = [...drawn].sort((a, b) => a - b).join(',');
      if (!seen.has(key)) { seen.add(key); break; }
    }
    games.push(describe(game, drawn));
  }
  return games;
}

/** 오늘의 행운번호: 한국 날짜 + 이 기기의 무작위 값 */
export function todayNumbers({ date, salt }) {
  return fiveGames([RULE.today, date, salt]);
}

/** 나만의 행운번호: 생일·기념일(YYYYMMDD 또는 MMDD) + 이번 주 회차 */
export function personalNumbers({ round, dateInput }) {
  return fiveGames([RULE.personal, String(round), String(dateInput)]);
}

/** 둘의 행운번호: 두 사람의 표준 글자(가나다순으로 정렬) + 이번 주 회차 */
export function pairNumbers({ round, tokens }) {
  const [a, b] = [...tokens].map(String).sort();
  return fiveGames([RULE.pair, String(round), a, b]);
}

/** n회 추첨일(YYYY-MM-DD) */
export function drawDateOfRound(n) {
  return new Date(FIRST_DRAW + (n - 1) * 7 * DAY).toISOString().slice(0, 10);
}

/** 이번 주 회차: 오늘 또는 오늘 뒤 가장 가까운 토요일의 회차(일요일에 다음 회차로) */
export function roundForDate(date) {
  const t = Date.parse(`${date}T00:00:00Z`);
  const days = Math.round((t - FIRST_DRAW) / DAY);
  return Math.ceil(days / 7) + 1;
}

/** 이번 주 행운번호: 고른 지점의 국가지점번호 + 이번 주 회차 (2026-10-18 구조 변경, docs/spec.md 5장) */
export function weeklyNumbers({ round, np }) {
  return fiveGames(['fl-week-v1', String(round), String(np)]);
}
