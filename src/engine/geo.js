// 위치 계산 도구 (경도 lon, 위도 lat 순서는 GeoJSON을 따른다)

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lon, lat, rings) {
  if (!inRing(lon, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) if (inRing(lon, lat, rings[k])) return false; // 구멍
  return true;
}

export function pointInGeometry(lon, lat, geometry) {
  if (geometry.type === 'Polygon') return inPolygon(lon, lat, geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((p) => inPolygon(lon, lat, p));
  return false;
}

/** 점이 들어 있는 첫 번째 지역(Feature)을 돌려준다. 없으면 null */
export function pointInFeatures(lon, lat, features) {
  return features.find((f) => pointInGeometry(lon, lat, f.geometry)) ?? null;
}

export function bboxOfFeatures(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const [x, y] of poly[0]) {
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
  }
  return [minX, minY, maxX, maxY];
}

/** 두 위치 사이 거리(m), 하버사인 공식 */
export function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371008.8;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
