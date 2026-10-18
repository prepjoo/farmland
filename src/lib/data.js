// 데이터 파일 불러오기 (이 사이트 안의 파일만, 한 번 받으면 기억)
const cache = new Map();

function getJson(path) {
  if (!cache.has(path)) {
    const p = fetch(path).then((r) => {
      if (!r.ok) throw new Error(`데이터를 불러오지 못했습니다: ${path}`);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path);
}

const base = import.meta.env.BASE_URL;
export const loadRegionIndex = () => getJson(`${base}data/regions/index.json`);

/** 시·도 하나의 시·군·구 경계 Feature 목록 */
export async function loadSidoFeatures(sido) {
  return (await getJson(`${base}data/regions/${sido}.json`)).features;
}


/** 타로 메이저 22장 자료 */
export const loadDecks = async () => ({ tarot: await getJson(`${base}data/tarot-major.json`) });

// ---- 만남 별자리: 공개 장소·음식점(한국관광공사 TourAPI, 시·도별 파일) ----
const loadPlacesIndex = () => getJson(`${base}data/places-index.json`).catch(() => null);

/** 점들 둘레(radiusKm)에 걸치는 시·도 코드 */
async function sidosNear(points, radiusKm) {
  const idx = await loadRegionIndex();
  const dLat = radiusKm / 111, dLon = radiusKm / 88;
  return idx.sido
    .filter(({ bbox: [w, s, e, n] }) => points.some((p) => !(p.lon + dLon < w || p.lon - dLon > e || p.lat + dLat < s || p.lat - dLat > n)))
    .map((x) => x.code);
}

/** 점들 근처 시·도의 공개 장소만 받는다 */
export async function loadPlacesNear(points, radiusKm) {
  const pidx = await loadPlacesIndex();
  if (!pidx) return [];
  const want = (await sidosNear(points, radiusKm)).filter((c) => pidx.sidos?.[c]?.places);
  const lists = await Promise.all(want.map((c) => getJson(`${base}data/places-${c}.json`).then((d) => d.places).catch(() => [])));
  return lists.flat();
}

/** 점 근처 시·도의 음식점·카페 */
export async function loadFoodsNear(point, radiusKm = 12) {
  const pidx = await loadPlacesIndex();
  if (!pidx) return [];
  const want = (await sidosNear([point], radiusKm)).filter((c) => pidx.sidos?.[c]?.foods);
  const lists = await Promise.all(want.map((c) => getJson(`${base}data/food-${c}.json`).then((d) => d.foods).catch(() => [])));
  return lists.flat();
}
