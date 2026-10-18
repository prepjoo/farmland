// 별땅 후보 찾기: 64구역 위치 중 육지(시·군·구 경계 안)에 떨어진 곳만 골라 동네 이름을 붙인다.
// 계산은 engine/landNumber.js, 여기서는 경계 자료만 불러온다. 필요한 시·도 파일만 받는다.
import { zoneCandidates } from '../engine/landNumber.js';
import { pointInFeatures } from '../engine/geo.js';
import { loadRegionIndex, loadSidoFeatures } from './data.js';

const base = import.meta.env.BASE_URL;
const inBox = ([w, s, e, n], c, m = 0.02) => c.lon >= w - m && c.lon <= e + m && c.lat >= s - m && c.lat <= n + m;

/** 8자리 → 육지 후보 [{ zone, east, north, text, lat, lon, sido, sidoName, sgg, sggName, place }] 북쪽부터 */
export async function landCandidates(digits) {
  const idx = await loadRegionIndex();
  const cands = zoneCandidates(digits).map((c) => ({ c, sidos: idx.sido.filter((s) => inBox(s.bbox, c)) })).filter((x) => x.sidos.length);
  const need = [...new Set(cands.flatMap((x) => x.sidos.map((s) => s.code)))];
  const feats = Object.fromEntries(await Promise.all(need.map(async (code) => [code, await loadSidoFeatures(code)])));
  const found = [];
  for (const { c, sidos } of cands) {
    for (const s of sidos) {
      const f = pointInFeatures(c.lon, c.lat, feats[s.code]);
      if (f) {
        const sggName = f.properties.name;
        found.push({ ...c, sido: s.code, sidoName: s.name, sgg: f.properties.code, sggName, place: `${s.name} ${sggName}` });
        break;
      }
    }
  }
  return found.sort((a, b) => b.lat - a.lat || a.lon - b.lon);
}

/** 고른 후보의 읍·면·동 이름 (없으면 빈 글자) */
export async function dongNameOf(c) {
  try {
    const fc = await fetch(`${base}data/regions/dong-${c.sido}.json`).then((r) => r.json());
    const f = pointInFeatures(c.lon, c.lat, fc.features.filter((x) => x.properties.sgg === c.sgg));
    return f?.properties.name ?? '';
  } catch {
    return '';
  }
}

/** 별땅 번호 하나 → 육지면 동네 이름이 붙은 후보, 바다면 { ...c, sea: true } */
export async function lookupOne(c) {
  const idx = await loadRegionIndex();
  for (const s of idx.sido.filter((x) => inBox(x.bbox, c))) {
    const f = pointInFeatures(c.lon, c.lat, await loadSidoFeatures(s.code));
    if (f) return { ...c, sido: s.code, sidoName: s.name, sgg: f.properties.code, sggName: f.properties.name, place: `${s.name} ${f.properties.name}` };
  }
  return { ...c, sea: true, place: '바다 위' };
}
