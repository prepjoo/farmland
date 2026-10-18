// 연인 추천 별: 두 사람 MBTI + 기념일 번호로 후보 중 하나를 고른다 (놀이용 추첨, 성격·궁합 평가 아님)
// 씨앗값 = SHA-256('v5-couple' | 두 MBTI를 가나다순으로 | 8자리). 순서를 바꿔 넣어도 같은 별.
import { makeSeed } from './seed.js';
import { normalizeMbti } from './code.js';

export async function recommendIndex({ mbtiA, mbtiB, digits, count }) {
  if (!count || count < 1) return -1;
  const pair = [normalizeMbti(mbtiA), normalizeMbti(mbtiB)].sort().join('+');
  const seed = await makeSeed(['v5-couple', pair, digits].join('|'));
  const v = new DataView(seed.buffer).getUint32(0);
  return v % count;
}
