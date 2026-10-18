// 별땅의 행운 카드 (순수 함수)
// 타로에서 쓰는 '탄생 카드' 계산 방식을 빌린다: 숫자를 모두 더하고 21보다 크면 자릿수를 다시 더해
// 메이저 아르카나 0~21번 중 하나를 정한다. 계산 방식은 유파마다 조금 달라 출처 확정은 '확인 필요'.
// 카드 풀이는 라이더-웨이트-스미스 정방향 전통 해석(public/data/tarot-major.json)만 쓴다.

const digitSum = (n) => String(n).split('').reduce((s, c) => s + Number(c), 0);

/** 21보다 크면 자릿수 합을 되풀이해 0~21로 */
export function reduceToMajor(n) {
  let v = Math.abs(Math.trunc(n));
  while (v > 21) v = digitSum(v);
  return v;
}

/** 땅의 수호 카드: 8자리 숫자를 모두 더해 줄인 값. 같은 번호에는 늘 같은 카드 */
export function guardianCardNumber(digits) {
  if (!/^\d{8}$/.test(digits ?? '')) return null;
  return reduceToMajor(digitSum(digits));
}

/** 올해의 카드: 기념일의 월 + 일 + 올해 연도를 줄인 값. 해마다 바뀐다 */
export function yearCardNumber(date, year) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m || !Number.isInteger(year)) return null;
  return reduceToMajor(Number(m[1]) + Number(m[2]) + year);
}

/** 오늘의 행운 카드: 들어올 때마다 새로 뽑는다. random은 0 이상 1 미만, exclude(수호 카드)와는 겹치지 않게 */
export function drawTodayCard(random, exclude = null) {
  const pool = Array.from({ length: 22 }, (_, i) => i).filter((n) => n !== exclude);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/** 카드 고유 방위 = 카드 번호 × 360/22 (0번이 정북, 시계 방향) — CLAUDE.md 4번 */
export const cardBearing = (n) => (n * 360) / 22;

const WORDS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
/** 각도 → 8방위 이름 */
export const bearingWord = (deg) => WORDS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
