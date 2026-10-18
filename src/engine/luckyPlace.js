// 오늘의 행운 장소 (docs/spec.md 3장)
// 자료: 1등이 나온 판매점(시·군·구 단위, 주소 없음). 기준점에서 오늘의 카드 방향으로
// 가장 가까운 '판매점이 있는 시·군·구'를 고르고, 그 안에서 날짜로 가게 하나를 고른다.
// 기준점이 없으면(전국) 날짜로 시·도 → 지역 → 가게. 자료가 없으면 장소를 만들지 않는다.
import { makeSeed, createRng } from './seed.js';
import { wgs84ToUtmk } from './nationalPoint.js';
import { cardAngle, dirName } from './luckyDirection.js';

export const PLACE_RULE = 'fl-place-v1';
export const RANGES_KM = [6, 15, 60];
export const HALF_SECTOR = 22.5;
const MIN_KM = 1; // 내 지역(거리 0)은 방향을 정할 수 없어 방향 찾기에서 뺀다

function planar(p) {
  const [x, y] = wgs84ToUtmk(p.lat, p.lon);
  return { x, y };
}

/** a → b 방위(0=북, 시계 방향, 도) */
export function bearingDeg(a, b) {
  const p = planar(a), q = planar(b);
  const deg = (Math.atan2(q.x - p.x, q.y - p.y) * 180) / Math.PI;
  return (deg + 360) % 360;
}

function distanceKm(a, b) {
  const p = planar(a), q = planar(b);
  return Math.hypot(q.x - p.x, q.y - p.y) / 1000;
}

const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const round1 = (v) => Math.round(v * 10) / 10;

function storesByRegion(stores) {
  const m = new Map();
  for (const s of stores) {
    for (const code of s.sgg) {
      if (!m.has(code)) m.set(code, []);
      m.get(code).push(s);
    }
  }
  for (const list of m.values()) list.sort((a, b) => a.id - b.id);
  return m;
}

async function rngFor(date, key) {
  return createRng(await makeSeed([PLACE_RULE, date, key].join('|')));
}

function storeOut(s) {
  return { id: s.id, name: s.name, wins: s.wins, region: s.region ?? null };
}

/**
 * @param {{date:string, card:number, base:{lat:number,lon:number,sggCode?:string}|null,
 *          anchors:Record<string,{lat:number,lon:number,name:string,sido:string}>,
 *          stores:Array<{id:number,name:string,sgg:string[],wins:number,region?:string}>,
 *          meta:{rounds:number[], source:string}}} input
 */
export async function pickLuckyPlace({ date, card, base, anchors, stores, meta }) {
  const byRegion = storesByRegion(stores ?? []);
  const regions = [...byRegion.keys()].filter((c) => anchors?.[c]).sort();
  if (!regions.length) return { mode: 'unavailable' };
  const basis = { rounds: meta?.rounds ?? null, source: meta?.source ?? null };

  if (!base) {
    const sidos = [...new Set(regions.map((c) => anchors[c].sido))].sort();
    const rng = await rngFor(date, '00');
    const sido = sidos[Math.floor(rng() * sidos.length)];
    const inSido = regions.filter((c) => anchors[c].sido === sido);
    const code = inSido[Math.floor(rng() * inSido.length)];
    const list = byRegion.get(code);
    const store = list[Math.floor(rng() * list.length)];
    return {
      mode: 'national', card, angle: null, dirName: null, sido, sidoCount: sidos.length,
      region: { code, name: anchors[code].name }, distanceKm: null, rangeKm: null,
      store: storeOut(store), basis, fallback: false,
    };
  }

  const angle = cardAngle(card);
  const measured = regions.map((code) => ({
    code, r: distanceKm(base, anchors[code]), phi: bearingDeg(base, anchors[code]),
  }));
  let chosen = null;
  let rangeKm = null;
  for (const R of RANGES_KM) {
    const hits = measured
      .filter((m) => m.r >= MIN_KM && m.r <= R && angDiff(m.phi, angle) <= HALF_SECTOR)
      .sort((a, b) => a.r - b.r || a.code.localeCompare(b.code));
    if (hits.length) { chosen = hits[0]; rangeKm = R; break; }
  }
  let fallback = false;
  if (!chosen) {
    fallback = true;
    const own = base.sggCode && byRegion.has(base.sggCode) ? measured.find((m) => m.code === base.sggCode) : null;
    chosen = own ?? [...measured].sort((a, b) => a.r - b.r || a.code.localeCompare(b.code))[0];
  }
  const list = byRegion.get(chosen.code);
  const rng = await rngFor(date, chosen.code);
  const store = list[Math.floor(rng() * list.length)];
  return {
    mode: 'base', card, angle, dirName: dirName(angle), sido: anchors[chosen.code].sido, sidoCount: null,
    region: { code: chosen.code, name: anchors[chosen.code].name },
    distanceKm: round1(chosen.r), rangeKm, store: storeOut(store), basis, fallback,
  };
}
