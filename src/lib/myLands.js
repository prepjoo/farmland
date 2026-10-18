// 내 별땅 목록: 이 기기(브라우저)에만 저장한다. 서버로 보내지 않는다.
// 날짜(생일·기념일)는 사용자가 [기념일로 기억하기]를 눌렀을 때만 함께 저장한다 (D-day 표시용).
import { load, save, remove } from './storage.js';

const KEY = 'myLands';
const MAX = 30;

export const listLands = () => load(KEY, []);

/** item: { np, place, label, kind, date|null, masked, reason } — 같은 별땅이면 새 내용으로 바꾼다 */
export function saveLand(item) {
  const list = listLands().filter((x) => x.np !== item.np);
  const saved = { ...item, id: `${Date.now()}`, savedAt: new Date().toISOString() };
  save(KEY, [saved, ...list].slice(0, MAX));
  return saved;
}

export function removeLand(id) {
  save(KEY, listLands().filter((x) => x.id !== id));
}

export function clearLands() {
  remove(KEY);
}

/** 올해(또는 내년) 기념일까지 남은 날. date: 'YYYY-MM-DD', today: 'YYYY-MM-DD' */
export function daysToNext(date, today) {
  const [, m, d] = date.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const t = Date.UTC(ty, tm - 1, td);
  let next = Date.UTC(ty, m - 1, d);
  if (next < t) next = Date.UTC(ty + 1, m - 1, d);
  return Math.round((next - t) / 86400000);
}
