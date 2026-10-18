// 근처 음식점 (docs/changes.md 다섯 번째 변경): 행운 지점 후보가 아니라 참고 정보.
// 가까운 후보(최대 count×3곳) 중에서 rng가 있으면 씨앗값으로 count곳을 고르고, 가까운 순서로 돌려준다.
import { distanceM } from './geo.js';

export function nearbyFood({ foods, lat, lon, count = 3, maxDistanceM = 1500, rng }) {
  if (!foods?.length) return [];
  const near = foods
    .map((f) => ({ ...f, distanceM: distanceM(lat, lon, f.lat, f.lon) }))
    .filter((f) => f.distanceM <= maxDistanceM)
    .sort((a, b) => a.distanceM - b.distanceM);
  if (!rng) return near.slice(0, count);
  const pool = near.slice(0, count * 3);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a.distanceM - b.distanceM);
}
