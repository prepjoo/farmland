// 두 사람 만남 장소 3곳 — 순수 함수 (2026-10-19, docs/spec.md 8장)
// A = 나(현재 위치, 화면 메모리에만), B = 상대가 고른 동네의 시·군·구 대표 지점.
// 두 사람 중 더 먼 쪽의 거리가 짧은 곳부터(서로 비슷하게 가는 곳), 같으면 거리 차, 합, 이름표 순.
import { distanceM } from './geo.js';

const ok = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon);
const km = (p, q) => Math.round(distanceM(p.lat, p.lon, q.lat, q.lon) / 100) / 10;

export function midpoint(a, b) {
  return { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
}

export function meetPlaces({ a, b, places, count = 3 }) {
  const gapKm = km(a, b);
  const items = (places ?? []).filter(ok).map((p) => ({ ...p, fromA: km(a, p), fromB: km(b, p) }));
  items.sort((p, q) => Math.max(p.fromA, p.fromB) - Math.max(q.fromA, q.fromB)
    || Math.abs(p.fromA - p.fromB) - Math.abs(q.fromA - q.fromB)
    || (p.fromA + p.fromB) - (q.fromA + q.fromB)
    || String(p.id).localeCompare(String(q.id)));
  return { items: items.slice(0, count), gapKm, mid: midpoint(a, b) };
}
