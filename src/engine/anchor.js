// 출발점: 고른 동네(지역)의 대표 지점 (docs/changes.md 2026-10-12 두 번째 변경)
// 날짜·인연 코드와 상관없이 같은 동네면 항상 같은 지점. 가장 큰 땅덩이의 무게중심을 쓰고,
// 무게중심이 경계 밖(초승달 모양 등)이면 경계 안에서 무게중심에 가장 가까운 점을 쓴다.
import { wgs84ToUtmk, utmkToWgs84, utmkToNationalPoint } from './nationalPoint.js';
import { pointInGeometry } from './geo.js';

function ringAreaCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a /= 2;
  return { area: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
}

const snap = (v) => Math.floor(v / 10) * 10 + 5;

export function regionAnchor(features) {
  // UTM-K로 바꿔 가장 넓은 폴리곤을 찾는다
  let best = null;
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      const outer = poly[0].map(([lon, lat]) => wgs84ToUtmk(lat, lon));
      const c = ringAreaCentroid(outer);
      if (!best || c.area > best.c.area) best = { c, outer, poly, feature: f };
    }
  }
  const geom = { type: 'Polygon', coordinates: best.poly };
  const inside = (x, y) => {
    const [lat, lon] = utmkToWgs84(x, y);
    return pointInGeometry(lon, lat, geom);
  };
  let x = snap(best.c.x), y = snap(best.c.y);
  if (!inside(x, y)) {
    const xs = best.outer.map((p) => p[0]), ys = best.outer.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    let found = null;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const gx = snap(minX + ((maxX - minX) * i) / N), gy = snap(minY + ((maxY - minY) * j) / N);
        if (!inside(gx, gy)) continue;
        const d = Math.hypot(gx - best.c.x, gy - best.c.y);
        if (!found || d < found.d) found = { gx, gy, d };
      }
    }
    if (found) ({ gx: x, gy: y } = found);
  }
  const [lat, lon] = utmkToWgs84(x, y);
  return { x, y, lat, lon, np: utmkToNationalPoint(x, y), regionCode: best.feature.properties.code, regionName: best.feature.properties.name ?? null };
}
