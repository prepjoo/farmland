// 만남 별자리 만들기 (별땅 runMeet를 옮겨 읍·면·동 대표 지점과 현재 위치를 쓸 수 있게 함). 계산은 engine/meetStar.js.
// A = 나(현재 위치 또는 고른 동네의 대표 지점), B = 상대(고른 동네의 대표 지점, 같은 동네면 A).
import { regionAnchor } from '../engine/anchor.js';
import { meetStar } from '../engine/meetStar.js';
import { starOrder } from '../engine/starPath.js';
import { wgs84ToUtmk, utmkToWgs84, toNationalPoint } from '../engine/nationalPoint.js';
import { loadSidoFeatures, loadPlacesNear } from './data.js';

const base = import.meta.env.BASE_URL;
const dongCache = new Map();

/** 시·도의 읍·면·동 경계 (동 고르기용) */
export function loadDongs(sido) {
  if (!dongCache.has(sido)) {
    const p = fetch(`${base}data/regions/dong-${sido}.json`).then((r) => { if (!r.ok) throw new Error('dong'); return r.json(); }).then((fc) => fc.features);
    p.catch(() => dongCache.delete(sido));
    dongCache.set(sido, p);
  }
  return dongCache.get(sido);
}

/** 고른 동네 → 대표 지점 {x, y, lat, lon}. 동을 고르면 그 동, 아니면 시·군·구 */
export async function anchorOfRegion({ sido, sgg, dong }) {
  if (dong) {
    const feats = (await loadDongs(sido)).filter((f) => f.properties.code === dong);
    if (feats.length) return regionAnchor(feats);
  }
  const feats = (await loadSidoFeatures(sido)).filter((f) => f.properties.code === sgg);
  return regionAnchor(feats);
}

export function pointFromLatLon({ lat, lon }) {
  const [x, y] = wgs84ToUtmk(lat, lon);
  return { x, y, lat, lon };
}

/** A·B: {x, y, lat, lon}, bearing: 카드 방향(도), rangeM: 만날 장소까지 거리(m) */
export async function buildMeet({ A, B, bearing, rangeM }) {
  const dKm = Math.hypot(A.x - B.x, A.y - B.y) / 1000;
  const radius = Math.max(15, dKm * 1.2, (rangeM / 1000) * 1.2);
  const raw = await loadPlacesNear([A, B], radius);
  const places = raw.map((p) => {
    const [x, y] = wgs84ToUtmk(p.lat, p.lon);
    return { ...p, x, y };
  });
  const star = meetStar({ A, B, bearing, places, rangeM });
  const withLL = (p) => {
    const [lat, lon] = utmkToWgs84(p.x, p.y);
    return { ...p, lat, lon };
  };
  const spots = star.spots.map((s) => ({ ...s, place: { ...s.place, np: toNationalPoint(s.place.lat, s.place.lon)?.text ?? null } }));
  const pts = [{ id: 'A', ...A }, ...(star.same ? [] : [{ id: 'B', ...B }]), ...spots.map((s) => ({ id: String(s.n), x: s.place.x, y: s.place.y, lat: s.place.lat, lon: s.place.lon }))];
  const order = starOrder({ center: star.center, points: pts });
  const byId = Object.fromEntries(pts.map((p) => [p.id, p]));
  return { ...star, dKm, A, B, center: withLL(star.center), spots, starIds: order, starLine: order.map((id) => [byId[id].lat, byId[id].lon]), starPts: pts };
}
