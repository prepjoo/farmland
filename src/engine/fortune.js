// 오늘의 행복메시지: 타로·주역·점성술 (2026-10-19, docs/spec.md 8장)
// 고른 지점(국가지점번호)과 한국 날짜로 타로 메이저 22장 중 한 장, 또는 주역 64괘 중 한 괘를 정한다.
// 풀이는 라이더-웨이트-스미스 정방향·주역 괘사의 전통 의미만 쓴다(자료 파일).
import { makeSeed, createRng } from './seed.js';

async function pick(rule, date, np, n) {
  const rng = createRng(await makeSeed([rule, date, np].join('|')));
  return Math.floor(rng() * n);
}

/** 타로 카드 번호 0~21 */
export const todayTarot = ({ date, np }) => pick('fl-tarot-v1', date, np, 22);

/** 주역 괘 번호 1~64 */
export const todayHexagram = async ({ date, np }) => (await pick('fl-iching-v1', date, np, 64)) + 1;

/** 점성술 12궁 번호 0~11 (놀이용 추첨, 생일 별자리가 아님) */
export const todayZodiac = ({ date, np }) => pick('fl-zodiac-v1', date, np, 12);

/** 행복메시지 종류: 회전판 칸 수와 함께 (2026-10-19) */
export const MESSAGE_KINDS = [
  { id: 'tarot', label: '타로', count: 22 },
  { id: 'iching', label: '주역', count: 64 },
  { id: 'zodiac', label: '점성술', count: 12 },
];

const TRIGRAM_DIR = { 감: '북', 간: '북동', 진: '동', 손: '남동', 리: '남', 곤: '남서', 태: '서', 건: '북서' }; // 후천팔괘 방위
const WORDS8 = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];

/** 오늘의 행운 방향(놀이용): 타로 = 카드 번호 × 360/22°를 8방위로, 주역 = 상괘의 후천팔괘 방위. 점성술은 없음 */
export function luckyDirection(kind, card) {
  if (kind === 'tarot') return WORDS8[Math.round(((card.n * 360) / 22) / 45) % 8];
  if (kind === 'iching') return TRIGRAM_DIR[card.upper] ?? null;
  return null;
}
