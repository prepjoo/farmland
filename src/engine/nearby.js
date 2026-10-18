// 고른 지점 주변 추천 (2026-10-18 구조 변경, docs/spec.md 5장)
// - 오늘의 행운 장소: 공개 장소(한국관광공사 TourAPI) 중 거리 안에서 날짜로 3곳
// - 이번 주 행운 장소: 1등 나온 판매점(시·군·구 단위) 중 가까운 3곳
// 거리 안에 모자라면 다음 거리로 넓히고 넓혔다고 알린다. 거리는 직선거리다.
import { makeSeed, createRng } from './seed.js';
import { distanceM } from './geo.js';

export const NEAR_RANGES_KM = [1.5, 6, 15, 60];
const km = (a, b) => distanceM(a.lat, a.lon, b.lat, b.lon) / 1000;
const r1 = (v) => Math.round(v * 10) / 10;

function rangesFrom(rangeKm) {
  const i = NEAR_RANGES_KM.indexOf(rangeKm);
  return i < 0 ? NEAR_RANGES_KM : NEAR_RANGES_KM.slice(i);
}

/** 공개 장소 3곳. 거리 안 장소들을 id 순으로 줄 세운 뒤 날짜 씨앗으로 섞어 3곳 → 가까운 순으로 */
export async function pickNearbyPlaces({ date, np, point, places, rangeKm, count = 3 }) {
  const measured = (places ?? []).map((p) => ({ ...p, distanceKm: r1(km(point, p)) }));
  let used = rangeKm, pool = [];
  for (const R of rangesFrom(rangeKm)) {
    used = R;
    pool = measured.filter((p) => p.distanceKm <= R);
    if (pool.length >= count) break;
  }
  pool.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const rng = createRng(await makeSeed(['fl-today-place-v1', date, np, String(used)].join('|')));
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const items = pool.slice(0, count).sort((a, b) => a.distanceKm - b.distanceKm || String(a.id).localeCompare(String(b.id)));
  return { items, rangeKm: used, widened: used !== rangeKm };
}

/** 1등 판매점 3곳: 가게마다 후보 시·군·구 대표 지점 중 가장 가까운 거리로, 가까운 순 → 1등 횟수 많은 순 → id 순 */
export function nearestStores({ point, stores, anchors, rangeKm, count = 3 }) {
  const measured = [];
  for (const s of stores ?? []) {
    let best = null;
    for (const code of s.sgg) {
      const a = anchors?.[code];
      if (!a) continue;
      const d = km(point, a);
      if (!best || d < best.d) best = { d, code, a };
    }
    if (best) measured.push({ store: s, region: { code: best.code, name: best.a.name, sido: best.a.sido, sidoName: best.a.sidoName ?? null, lat: best.a.lat, lon: best.a.lon }, distanceKm: r1(best.d) });
  }
  measured.sort((x, y) => x.distanceKm - y.distanceKm || y.store.wins - x.store.wins || x.store.id - y.store.id);
  let used = rangeKm, items = [];
  for (const R of rangesFrom(rangeKm)) {
    used = R;
    items = measured.filter((m) => m.distanceKm <= R);
    if (items.length >= count) break;
  }
  if (items.length < count) items = measured; // 60km 안에도 모자라면 거리와 상관없이 가까운 곳
  const out = items.slice(0, count);
  return { items: out, rangeKm: used, widened: used !== rangeKm || out.some((m) => m.distanceKm > used) };
}
