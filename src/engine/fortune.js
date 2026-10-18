// 오늘의 행운 카드 (2026-10-18 구조 변경, docs/spec.md 5장)
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
