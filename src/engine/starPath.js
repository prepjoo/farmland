// 만남 별자리를 별 모양으로 잇는 순서 (별땅 StarFigure와 같은 규칙) — 순수 함수.
// 중심에서 본 방향(-180~180°, 남쪽부터 시계 방향)으로 둘레를 정렬하고, 5개면 0→2→4→1→3→0 순서로 이어 별을 그린다.
const ang = (p, c) => Math.atan2(p.x - c.x, p.y - c.y);

/** center: {x,y}, points: [{id, x, y}] (UTM-K 미터) → 잇는 순서의 id 목록(처음 점으로 돌아옴) */
export function starOrder({ center, points }) {
  const ring = [...points].sort((a, b) => ang(a, center) - ang(b, center));
  const order = ring.length === 5 ? [0, 2, 4, 1, 3, 0] : [...ring.keys(), 0];
  return order.map((i) => ring[i].id);
}
