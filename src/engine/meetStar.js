// 만남 별자리 (우리 별땅 안의 부가 기능, docs/changes.md 네 번째). 좌표는 UTM-K 미터(x 동쪽, y 북쪽).
// 1) 두 사람 동네 대표 지점 A·B를 변 또는 대각선으로 하는 정오각형 후보 4개
// 2) 우리 별땅 수호 카드의 방향(번호 × 360/22°)과 별 중심 방향이 가장 가까운 후보
// 3) 빈 꼭짓점 3개마다 가장 가까운 공개 장소(관광공사 자료, R 안) → 만남 장소 1·2·3
// 같은 동네면 대표 지점 둘레 정오각형(반지름 = 이동 범위의 0.6배, 범위가 없으면 2km)의 카드 쪽 꼭짓점 3개를 쓴다.
// 이동 범위(rangeM, 별지점의 도보권 1.5 · 가까운 곳 6 · 조금 먼 곳 15 · 당일치기 60km): 빈 꼭짓점이
// 가까운 출발점에서 범위 안인 후보만 쓴다. 범위 안 후보가 없으면 카드 방향에 가장 가까운 후보 + outOfRange.

const DEG = Math.PI / 180;
const SIDE_K = 1 / (2 * Math.sin(36 * DEG));
const DIAG_K = 1 / (2 * Math.sin(72 * DEG));
const SAME_R = 2000;

const bearingOf = (from, to) => ((Math.atan2(to.x - from.x, to.y - from.y) / DEG) + 360) % 360;
const angDiff = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
const at = (c, bearing, r) => ({ x: c.x + r * Math.sin(bearing * DEG), y: c.y + r * Math.cos(bearing * DEG) });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function candidates(A, B) {
  const d = dist(A, B);
  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const n = { x: -(B.y - A.y) / d, y: (B.x - A.x) / d };
  const out = [];
  for (const [kind, K, half, step] of [['side', SIDE_K, 36, 1], ['diagonal', DIAG_K, 72, 2]]) {
    const R = K * d;
    const off = R * Math.cos(half * DEG);
    for (const sign of [1, -1]) {
      const c = { x: M.x + sign * n.x * off, y: M.y + sign * n.y * off };
      const tA = bearingOf(c, A), tB = bearingOf(c, B);
      const s = angDiff(tA + 72 * step, tB) < angDiff(tA - 72 * step, tB) ? 1 : -1;
      const verts = Array.from({ length: 5 }, (_, k) => at(c, tA + s * 72 * k, R));
      const empty = [1, 2, 3, 4].filter((k) => k !== step).map((k) => verts[k]);
      out.push({ kind, center: c, R, dir: bearingOf(M, c), empty });
    }
  }
  return out;
}

/** 꼭짓점에서 0.4R 안의 가장 가까운 장소, 없으면 R 안(같은 동네는 최소 3km)에서 가장 가까운 장소 */
function snap(vertex, R, places, used) {
  let best = null;
  for (const p of places) {
    if (used.has(p.id)) continue;
    const d = dist(vertex, p);
    if (!best || d < best.d) best = { p, d };
  }
  return best && best.d <= Math.max(R, 3000) ? best : null;
}

/** A·B: {x,y}, bearing: 카드 방향(도), places: [{id, name, x, y, theme, …}] */
export function meetStar({ A, B, bearing, places, rangeM = null }) {
  const same = dist(A, B) < 1000;
  let pick;
  let outOfRange = false;
  if (same) {
    const R = rangeM ? rangeM * 0.6 : SAME_R;
    const verts = Array.from({ length: 5 }, (_, k) => at(A, bearing + 72 * k, R));
    pick = { kind: 'same', center: { x: A.x, y: A.y }, R, empty: [verts[4], verts[0], verts[1]] };
  } else {
    const list = candidates(A, B).sort((a, b) => angDiff(a.dir, bearing) - angDiff(b.dir, bearing));
    const reach = (c) => Math.max(...c.empty.map((v) => Math.min(dist(v, A), dist(v, B))));
    const inRange = rangeM ? list.filter((c) => reach(c) <= rangeM) : list;
    outOfRange = inRange.length === 0;
    pick = inRange[0] ?? list[0];
  }
  const used = new Set();
  const spots = [];
  for (const v of pick.empty) {
    const s = snap(v, pick.R, places, used);
    if (!s) continue;
    used.add(s.p.id);
    spots.push({ n: spots.length + 1, ideal: v, place: s.p, offsetM: Math.round(s.d) });
  }
  return { kind: pick.kind, same, center: pick.center, R: pick.R, A, B, spots, outOfRange };
}
