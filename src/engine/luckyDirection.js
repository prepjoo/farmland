// 오늘의 카드와 행운 방향 (docs/spec.md 2장)
// 오늘의 카드는 기기와 상관없이 그날 전국이 같다. 방향은 재미를 위한 규칙이며 당첨과 관계없다.
import { makeSeed, createRng } from './seed.js';

export const CARD_RULE = 'fl-card-v1';
export const DIRS16 = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
  '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];

/** 오늘의 카드 번호(0~21, 타로 메이저) */
export async function todayCard(date) {
  const rng = createRng(await makeSeed([CARD_RULE, date].join('|')));
  return Math.floor(rng() * 22);
}

/** 카드 번호 × 360/22 (0번 정북, 시계 방향) */
export function cardAngle(card) {
  return (card * 360) / 22;
}

/** 각도 → 가장 가까운 16방위 이름 */
export function dirName(angle) {
  const a = ((angle % 360) + 360) % 360;
  return DIRS16[Math.round(a / 22.5) % 16];
}
