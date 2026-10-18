// 선물 링크 (#/g?…). 별땅 번호·가리기 여부·한 줄 메시지만 담는다(예전 링크의 올해 카드 c·y는 읽기만).
// MBTI, 번호 종류(생일인지 전화번호인지), 기념일 날짜는 담지 않는다 (CLAUDE.md 7번, v5 변경안).
import { parseNationalPoint, formatNationalPoint } from './nationalPoint.js';

export const MESSAGE_MAX = 60;

export function encodeGift({ np, yearCard = null, year = null, masked = false, message = '' }) {
  const p = parseNationalPoint(np);
  if (!p) throw new Error('별땅 번호가 올바르지 않아요');
  const q = new URLSearchParams();
  q.set('n', `${p.zone}${p.east}${p.north}`);
  if (Number.isInteger(yearCard) && Number.isInteger(year)) {
    q.set('c', String(yearCard));
    q.set('y', String(year));
  }
  if (masked) q.set('m', '1');
  const msg = String(message ?? '').trim().slice(0, MESSAGE_MAX);
  if (msg) q.set('t', msg);
  return q.toString();
}

export function decodeGift(query) {
  const q = new URLSearchParams(query ?? '');
  const p = parseNationalPoint(q.get('n') ?? '');
  if (!p) return null;
  const c = Number(q.get('c')), y = Number(q.get('y'));
  const ok = q.has('c') && Number.isInteger(c) && c >= 0 && c <= 21 && Number.isInteger(y) && y > 1900 && y < 3000;
  return {
    np: formatNationalPoint(p),
    yearCard: ok ? c : null,
    year: ok ? y : null,
    masked: q.get('m') === '1',
    message: (q.get('t') ?? '').slice(0, MESSAGE_MAX),
  };
}
