// 2026-10-18 구조 변경(오늘·이번 주) 엔진 — docs/spec.md 5장
import { describe, expect, it } from 'vitest';
import { digitsFrom, mbtiAlphaDigits, zoneCandidates } from '../../src/engine/landNumber.js';
import { todayTarot, todayHexagram } from '../../src/engine/fortune.js';
import { pickNearbyPlaces, nearestStores, NEAR_RANGES_KM } from '../../src/engine/nearby.js';
import { weeklyNumbers } from '../../src/engine/lotto.js';

describe('의미 있는 숫자', () => {
  it('MBTI는 글자마다 알파벳 순서 2자리(ESTJ → 05192010)', () => {
    expect(mbtiAlphaDigits('ESTJ')).toBe('05192010');
    expect(mbtiAlphaDigits('infp')).toBe('09140616');
    expect(digitsFrom('mbti', 'ENFJ')).toBe('05140610');
    expect(digitsFrom('mbti', 'EXTJ')).toBeNull();
    expect(digitsFrom('mbti', 'EST')).toBeNull();
  });
  it('생년월일·전화번호는 별땅 규칙 그대로', () => {
    expect(digitsFrom('date', '1962-03-07')).toBe('19620307');
    expect(digitsFrom('phone', '010-1234-5678')).toBe('12345678');
  });
  it('MBTI 숫자도 국가지점 후보를 만든다', () => {
    expect(zoneCandidates(mbtiAlphaDigits('ESTJ')).length).toBeGreaterThan(20);
  });
});

describe('오늘의 카드', () => {
  it('고른 지점과 날짜가 같으면 같은 카드, 범위 안', async () => {
    const a = await todayTarot({ date: '2026-10-18', np: '다마 8905 1196' });
    const b = await todayTarot({ date: '2026-10-18', np: '다마 8905 1196' });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(21);
    const h = await todayHexagram({ date: '2026-10-18', np: '다마 8905 1196' });
    expect(h).toBeGreaterThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(64);
  });
  it('날이 바뀌면 바뀐다(한 달에 여러 카드)', async () => {
    const s = new Set();
    for (let d = 1; d <= 30; d++) s.add(await todayTarot({ date: `2026-11-${String(d).padStart(2, '0')}`, np: '다마 8905 1196' }));
    expect(s.size).toBeGreaterThan(5);
  });
});

const point = { lat: 37.5665, lon: 126.978 };
const places = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `장소${i}`, lat: 37.5665 + 0.002 * (i + 1), lon: 126.978, theme: '산책·자연' })); // 북쪽으로 약 0.22km씩
places.push({ id: 'far', name: '먼곳', lat: 37.80, lon: 126.978, theme: '역사·문화' }); // 약 26km

describe('오늘의 행운 장소 3곳', () => {
  it('거리 안에서 3곳, 같은 날·같은 지점이면 같고 가까운 순', async () => {
    const a = await pickNearbyPlaces({ date: '2026-10-18', np: 'X', point, places, rangeKm: 6 });
    const b = await pickNearbyPlaces({ date: '2026-10-18', np: 'X', point, places, rangeKm: 6 });
    expect(a).toEqual(b);
    expect(a.items).toHaveLength(3);
    expect(new Set(a.items.map((p) => p.id)).size).toBe(3);
    for (const p of a.items) expect(p.distanceKm).toBeLessThanOrEqual(6);
    const d = a.items.map((p) => p.distanceKm);
    expect([...d].sort((x, y) => x - y)).toEqual(d);
    expect(a.widened).toBe(false);
  });
  it('거리 안에 3곳이 없으면 넓히고 넓혔다고 알린다', async () => {
    const few = [places[0], places.at(-1)];
    const r = await pickNearbyPlaces({ date: '2026-10-18', np: 'X', point, places: few, rangeKm: 1.5 });
    expect(r.items).toHaveLength(2);
    expect(r.widened).toBe(true);
    expect(r.rangeKm).toBe(60);
  });
  it('거리 선택지는 1.5·6·15·60km', () => {
    expect(NEAR_RANGES_KM).toEqual([1.5, 6, 15, 60]);
  });
});

describe('이번 주 행운 장소: 가까운 1등 판매점 3곳', () => {
  const anchors = {
    A: { lat: 37.57, lon: 126.98, name: '가구', sido: '11' }, // 약 0.4km
    B: { lat: 37.62, lon: 126.98, name: '나구', sido: '11' }, // 약 6km
    C: { lat: 37.90, lon: 126.98, name: '다구', sido: '41' }, // 약 37km
  };
  const stores = [
    { id: 1, name: '가게1', sgg: ['A'], wins: 1 },
    { id: 2, name: '가게2', sgg: ['A'], wins: 3 },
    { id: 3, name: '가게3', sgg: ['B'], wins: 1 },
    { id: 4, name: '가게4', sgg: ['C'], wins: 2 },
    { id: 5, name: '가게5', sgg: ['B', 'C'], wins: 1 },
  ];
  it('가까운 시·군·구부터, 같은 곳이면 1등 횟수가 많은 순으로 3곳', () => {
    const r = nearestStores({ point, stores, anchors, rangeKm: 15 });
    expect(r.items.map((x) => x.store.id)).toEqual([2, 1, 3]);
    expect(r.items[0].region.code).toBe('A');
    expect(r.widened).toBe(false);
  });
  it('후보 지역이 여럿인 가게는 더 가까운 지역으로 친다', () => {
    const r = nearestStores({ point, stores: stores.filter((s) => s.id === 5), anchors, rangeKm: 15 });
    expect(r.items[0].region.code).toBe('B');
  });
  it('거리 안에 3곳이 없으면 넓힌다', () => {
    const r = nearestStores({ point, stores, anchors, rangeKm: 1.5 });
    expect(r.items).toHaveLength(3);
    expect(r.widened).toBe(true);
  });
  it('자료가 없으면 빈 목록', () => {
    expect(nearestStores({ point, stores: [], anchors, rangeKm: 6 }).items).toEqual([]);
  });
});

describe('이번 주 행운번호', () => {
  it('같은 회차·같은 지점이면 같은 5게임, 회차가 바뀌면 바뀐다', async () => {
    const a = await weeklyNumbers({ round: 1246, np: '다마 8905 1196' });
    const b = await weeklyNumbers({ round: 1246, np: '다마 8905 1196' });
    const c = await weeklyNumbers({ round: 1247, np: '다마 8905 1196' });
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(a[0].sorted).not.toEqual(c[0].sorted);
    for (const g of a) expect(new Set(g.drawn).size).toBe(6);
  });
});
