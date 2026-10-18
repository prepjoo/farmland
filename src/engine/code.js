// MBTI 정리 (연인 추천 별에만 쓴다)
import { MBTI_TYPES } from './constants.js';

/** MBTI를 대문자로. 모르거나 틀리면 'XXXX' */
export function normalizeMbti(s) {
  const up = String(s ?? '').trim().toUpperCase();
  return MBTI_TYPES.includes(up) ? up : 'XXXX';
}
