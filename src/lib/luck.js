// 화면에서 쓰는 행운 도우미: 이 기기의 무작위 값, 19세 확인, 연출 본 날, 기억한 동네, 장소 자료 불러오기.
// 계산은 engine/에서 하고, 여기서는 저장소와 자료 파일만 다룬다. (docs/spec.md 4장)
import { load, save, remove } from './storage.js';
import { normalizeVillage, recordTodayLuck } from '../engine/village.js';

const base = import.meta.env.BASE_URL;
let memorySalt = null;
let memoryVillage = null; // 저장이 막힌 브라우저에서는 화면을 연 동안만

function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 이 기기의 무작위 값. 저장이 막히면 메모리에만 두고 stored:false */
export function getSalt() {
  const saved = load('salt');
  if (typeof saved === 'string' && /^[0-9a-f]{32}$/.test(saved)) return { salt: saved, stored: true };
  const fresh = memorySalt ?? randomHex();
  save('salt', fresh);
  const ok = load('salt') === fresh;
  if (!ok) memorySalt = fresh;
  return { salt: fresh, stored: ok };
}

export const getAge = () => load('age'); // { ok: boolean, date }
export const setAge = (ok, date) => save('age', { ok, date });

export const seenToday = (date) => load('seen') === date;
export const markSeen = (date) => save('seen', date);

export const getHome = () => load('home'); // 시·군·구 코드
export const setHome = (code) => save('home', code);

export function clearAll() {
  ['salt', 'age', 'seen', 'home', 'village'].forEach(remove);
  memorySalt = null;
  memoryVillage = null;
}

/** 내 귀땅 마을 기록(고른 그림·캐릭터·팜 수·방문한 날짜·받은 주). 입력한 숫자·고른 곳은 담지 않는다 */
export function getVillage() {
  const raw = load('village');
  return normalizeVillage(raw ?? memoryVillage);
}

/** 저장하고, 이 브라우저에 실제로 남았는지 돌려준다 */
export function putVillage(state) {
  save('village', state);
  const ok = JSON.stringify(load('village')) === JSON.stringify(state);
  memoryVillage = ok ? null : state;
  return ok;
}

export function clearVillage() {
  remove('village');
  memoryVillage = null;
}

/** 오늘의 행운을 봤을 때 미션 기록. { gained, state } */
export function recordVisit(date) {
  const r = recordTodayLuck(getVillage(), date);
  if (r.gained.length) putVillage(r.state);
  return r;
}

const cache = new Map();
function getJson(path) {
  if (!cache.has(path)) {
    const p = fetch(`${base}${path}`).then((r) => {
      if (!r.ok) throw new Error(path);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path);
}

/** 행운 장소 자료(판매점·대표 지점). 실패하면 null → 화면은 ‘자료 준비 중’ */
export async function loadPlaceData() {
  try {
    const [stores, anchors] = await Promise.all([getJson('data/lotto-stores.json'), getJson('data/sgg-anchors.json')]);
    return { stores: stores.stores, meta: { rounds: stores.rounds, source: stores.source, period: stores.period, kind: stores.kind }, anchors: anchors.anchors };
  } catch {
    return null;
  }
}

export const loadTarot = () => getJson('data/tarot-major.json').then((t) => t.cards);

/** 사람이 보기 좋은 날짜: 2026-10-18 → 10월 18일 */
export function kDate(date) {
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일`;
}

/** 공 색 구간 (귀땅 색, 공식 복권 색과 다르게) */
export function ballClass(n) {
  if (n < 10) return 'b1';
  if (n < 20) return 'b2';
  if (n < 30) return 'b3';
  if (n < 40) return 'b4';
  return 'b5';
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const loadHexagrams = () => getJson('data/hexagrams.json').then((h) => h.hexagrams);
