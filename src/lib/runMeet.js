// 만남 별자리 만들기: 두 동네 대표 지점 → 근처 공개 장소 → meetStar (계산은 engine/meetStar.js)
import { regionAnchor } from '../engine/anchor.js';
import { meetStar } from '../engine/meetStar.js';
import { wgs84ToUtmk, utmkToWgs84, toNationalPoint } from '../engine/nationalPoint.js';
import { loadSidoFeatures, loadPlacesNear } from './data.js';

export async function anchorOf({ sido, sgg }) {
  const feats = (await loadSidoFeatures(sido)).filter((f) => f.properties.code === sgg);
  return regionAnchor(feats);
}

/** me·you: { sido, sgg }, bearing: 수호 카드 방향, rangeM: 이동 범위(m) */
export async function buildMeet({ me, you, bearing, rangeM }) {
  const A = await anchorOf(me);
  const B = you ? await anchorOf(you) : A;
  const dKm = Math.hypot(A.x - B.x, A.y - B.y) / 1000;
  const radius = Math.max(15, dKm * 1.2);
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
  return {
    ...star,
    dKm,
    A: withLL(A),
    B: withLL(B),
    center: withLL(star.center),
    spots: star.spots.map((s) => ({ ...s, place: { ...s.place, np: toNationalPoint(s.place.lat, s.place.lon)?.text ?? null } })),
  };
}
