// 별땅: 내 번호 8자리 → 구역마다 한 곳씩 있는 국가지점번호 위치 (순수 함수, docs/plan.md)
// 앞 4자리 = 구역 서쪽 경계에서 동쪽으로 ×10m, 뒤 4자리 = 남쪽 경계에서 북쪽으로 ×10m.
import { fromNationalPoint, formatNationalPoint } from './nationalPoint.js';

export const ZONE_LETTERS = ['가', '나', '다', '라', '마', '바', '사', '아'];

/** 있는 날짜인가 ('YYYY-MM-DD') */
function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * 입력 → 숫자 8자리 문자열. 틀리면 null
 * kind: 'date'(생일·기념일, YYYY-MM-DD) | 'phone'(전화번호, 마지막 8자리) | 'number'(숫자 8자리)
 */
export function digitsFrom(kind, value) {
  const s = String(value ?? '');
  if (kind === 'date') return isRealDate(s) ? s.replaceAll('-', '') : null;
  const d = s.replace(/\D/g, '');
  if (kind === 'phone') return d.length >= 8 ? d.slice(-8) : null;
  if (kind === 'number') return d.length === 8 ? d : null;
  if (kind === 'mbti') return mbtiAlphaDigits(s);
  return null;
}

/**
 * 귀땅: MBTI 4글자 → 글자마다 알파벳 순서 2자리(A=01 … Z=26), 이어서 8자리 (사용자 결정 2026-10-18).
 * 예: ESTJ → 05 19 20 10 → '05192010'. 틀리면 null
 */
export function mbtiAlphaDigits(m) {
  const t = String(m ?? '').toUpperCase();
  if (!/^[EI][SN][TF][JP]$/.test(t)) return null;
  return [...t].map((c) => String(c.charCodeAt(0) - 64).padStart(2, '0')).join('');
}

/** 휴대폰 자판의 글자-숫자 (ABC 2, DEF 3, GHI 4, JKL 5, MNO 6, PQRS 7, TUV 8) */
export const MBTI_KEYPAD = { E: '3', I: '4', S: '7', N: '6', T: '8', F: '3', J: '5', P: '7' };
const MBTI_RE = /^[EI][SN][TF][JP]$/;

/**
 * 두 사람 MBTI 8글자 → 숫자 8자리. 휴대폰 자판처럼 글자를 숫자로 바꾸고,
 * 두 사람은 알파벳순으로 이어 붙여 누가 먼저 넣어도 같은 번호가 된다. 틀리면 null
 */
export function mbtiDigits(a, b) {
  const pair = [String(a ?? '').toUpperCase(), String(b ?? '').toUpperCase()];
  if (!pair.every((m) => MBTI_RE.test(m))) return null;
  return pair.sort().map((m) => [...m].map((c) => MBTI_KEYPAD[c]).join('')).join('');
}

/** 8자리 → 64구역 후보 [{ zone, east, north, text, lat, lon, x, y }] (바다·국토 밖 포함) */
export function zoneCandidates(digits) {
  if (!/^\d{8}$/.test(digits ?? '')) return [];
  const east = digits.slice(0, 4), north = digits.slice(4);
  const out = [];
  for (const yl of ZONE_LETTERS) {
    for (const xl of ZONE_LETTERS) {
      const p = { zone: xl + yl, east, north };
      const { lat, lon, x, y } = fromNationalPoint(p);
      out.push({ ...p, text: formatNationalPoint(p), lat, lon, x, y });
    }
  }
  return out;
}

/** '마마 5796 0488' → '마마 57●● ●●88' (전화번호 가리기) */
export function maskNationalPoint(text) {
  const m = /^(\S{2}) (\d{2})\d{2} \d{2}(\d{2})$/.exec(text ?? '');
  return m ? `${m[1]} ${m[2]}●● ●●${m[3]}` : text;
}
