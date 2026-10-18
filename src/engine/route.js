// 행운 장소로 가는 길: 카카오맵 길찾기·검색 링크와 ‘내 위치에서 거리’(직선) — 순수 함수.
// 링크에는 목적지(공개 장소·판매점 이름과 위치)만 넣고 내 위치는 넣지 않는다. 출발지는 카카오맵에서 정한다.
// 형식: https://map.kakao.com/link/to/이름,위도,경도 (카카오맵 공식 계정 답변, devtalk.kakao.com/t/url/138644)
import { distanceM } from './geo.js';

const ok = (n) => typeof n === 'number' && Number.isFinite(n);

export function kakaoRouteUrl(place) {
  if (!place || !ok(place.lat) || !ok(place.lon)) return null;
  const name = String(place.name ?? '목적지').replace(/,/g, ' ').replace(/\s+/g, ' ').trim() || '목적지';
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${place.lat.toFixed(6)},${place.lon.toFixed(6)}`;
}

export function kakaoSearchUrl(query) {
  const q = String(query ?? '').trim();
  return q ? `https://map.kakao.com/link/search/${encodeURIComponent(q)}` : null;
}

/** 각 항목에 내 위치에서의 직선거리 fromMeKm를 붙인 새 목록. pointOf(item) → {lat, lon} */
export function withDistanceFromMe(me, items, pointOf) {
  if (!me || !ok(me.lat) || !ok(me.lon)) return items;
  return items.map((it) => {
    const p = pointOf(it);
    const km = p && ok(p.lat) && ok(p.lon) ? Math.round(distanceM(me.lat, me.lon, p.lat, p.lon) / 100) / 10 : null;
    return { ...it, fromMeKm: km };
  });
}

export function fromMeText(km) {
  if (km < 0.1) return '내 위치에서 약 100m 안';
  if (km < 1) return `내 위치에서 약 ${Math.round(km * 10) * 100}m`;
  if (km < 100) return `내 위치에서 약 ${(Math.round(km * 10) / 10).toFixed(1)}km`;
  return `내 위치에서 약 ${Math.round(km)}km`;
}

/** 출발지와 도착지를 함께 넣은 카카오맵 길찾기. 형식 /link/from/이름,위도,경도/to/이름,위도,경도 — 공식 안내로 확인 필요 */
export function kakaoFromToUrl(from, to) {
  const f = kakaoRouteUrl(from);
  const t = kakaoRouteUrl(to);
  if (!f || !t) return null;
  const part = (u) => u.replace('https://map.kakao.com/link/to/', '');
  return `https://map.kakao.com/link/from/${part(f)}/to/${part(t)}`;
}
