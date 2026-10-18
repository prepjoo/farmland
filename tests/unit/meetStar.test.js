import { describe, it, expect } from 'vitest';
import { meetStar } from '../../src/engine/meetStar.js';
import { nearbyFood } from '../../src/engine/food.js';

// 가짜 장소: 격자 모양으로 2km마다 하나
const grid = [];
for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) grid.push({ id: `p${i}_${j}`, name: `장소${i},${j}`, x: 1000000 + i * 2000, y: 1900000 + j * 2000, theme: '산책·자연' });

const A = { x: 990000, y: 1900000 };
const B = { x: 1010000, y: 1900000 };

describe('만남 별자리', () => {
  it('A·B + 카드 방향 → 겹치지 않는 공개 장소 3곳, 같은 입력이면 같은 결과', () => {
    const r1 = meetStar({ A, B, bearing: 0, places: grid });
    const r2 = meetStar({ A, B, bearing: 0, places: grid });
    expect(r1).toEqual(r2);
    expect(r1.spots).toHaveLength(3);
    expect(new Set(r1.spots.map((s) => s.place.id)).size).toBe(3);
    expect(r1.spots.map((s) => s.n)).toEqual([1, 2, 3]);
  });
  it('카드 방향이 북쪽이면 별이 A·B 북쪽에, 남쪽이면 남쪽에 생긴다', () => {
    const north = meetStar({ A, B, bearing: 0, places: grid });
    const south = meetStar({ A, B, bearing: 180, places: grid });
    expect(north.center.y).toBeGreaterThan(A.y);
    expect(south.center.y).toBeLessThan(A.y);
  });
  it('장소는 꼭짓점 가까이(0.4R 안)에서 고른다', () => {
    const r = meetStar({ A, B, bearing: 90, places: grid });
    for (const s of r.spots) expect(s.offsetM).toBeLessThanOrEqual(0.4 * r.R);
  });
  it('같은 동네면 동네 둘레 2km 안팎 세 곳', () => {
    const r = meetStar({ A, B: A, bearing: 45, places: grid });
    expect(r.same).toBe(true);
    expect(r.spots).toHaveLength(3);
    for (const s of r.spots) expect(Math.hypot(s.place.x - A.x, s.place.y - A.y)).toBeLessThan(5000);
  });
  it('같은 동네 + 이동 범위: 도보권(1.5km)이면 세 곳 모두 대표 지점 가까이', () => {
    const r = meetStar({ A, B: A, bearing: 45, places: grid, rangeM: 1500 });
    expect(r.R).toBeLessThanOrEqual(1500);
    expect(r.spots.length).toBeGreaterThan(0);
    const far = meetStar({ A, B: A, bearing: 45, places: grid, rangeM: 60000 });
    expect(far.R).toBeGreaterThan(r.R);
  });
  it('두 동네 + 이동 범위: 범위 안 후보가 있으면 그 중에서, 없으면 가장 가까운 별 + 범위 넘음 표시', () => {
    const wide = meetStar({ A, B, bearing: 0, places: grid, rangeM: 60000 });
    expect(wide.outOfRange).toBe(false);
    const tight = meetStar({ A, B, bearing: 0, places: grid, rangeM: 1500 });
    expect(tight.outOfRange).toBe(true);
    expect(tight.spots).toHaveLength(3);
  });
  it('범위가 좁으면 넓을 때보다 작은 별(대각선 후보)을 고른다', () => {
    const r = meetStar({ A, B, bearing: 0, places: grid, rangeM: 21000 });
    expect(r.outOfRange).toBe(false);
    expect(r.kind).toBe('diagonal');
  });
  it('장소가 없으면 빈 목록', () => {
    expect(meetStar({ A, B, bearing: 0, places: [] }).spots).toEqual([]);
  });
});

describe('근처 음식점', () => {
  it('가까운 순서로 count곳, 거리 안만', () => {
    const foods = [
      { id: 'a', lat: 37.5, lon: 127.0 },
      { id: 'b', lat: 37.501, lon: 127.0 },
      { id: 'c', lat: 37.6, lon: 127.0 },
    ];
    const r = nearbyFood({ foods, lat: 37.5, lon: 127.0, count: 2, maxDistanceM: 1500 });
    expect(r.map((f) => f.id)).toEqual(['a', 'b']);
  });
});
