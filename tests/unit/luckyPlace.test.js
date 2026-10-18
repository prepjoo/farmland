// 행운 장소 — docs/spec.md 3장 (작은 가상 자료로 규칙을 확인)
import { describe, expect, it } from 'vitest';
import { pickLuckyPlace, bearingDeg } from '../../src/engine/luckyPlace.js';

// 기준점 서울시청 근처, 주변 지역 대표 지점(가상)
const base = { lat: 37.5665, lon: 126.978, sggCode: 'B' };
const anchors = {
  B: { lat: 37.5665, lon: 126.978, name: '기준구', sido: '11' },
  N: { lat: 37.6100, lon: 126.978, name: '북쪽구', sido: '11' }, // 북 약 4.8km
  W: { lat: 37.5665, lon: 126.920, name: '서쪽구', sido: '11' }, // 서 약 5.1km
  WF: { lat: 37.5665, lon: 126.830, name: '먼서쪽구', sido: '11' }, // 서 약 13km
  E: { lat: 37.5665, lon: 127.200, name: '동쪽구', sido: '41' }, // 동 약 19.6km
};
const stores = [
  { id: 1, name: '북쪽가게', sgg: ['N'], wins: 1 },
  { id: 2, name: '서쪽가게1', sgg: ['W'], wins: 2 },
  { id: 3, name: '서쪽가게2', sgg: ['W'], wins: 1 },
  { id: 4, name: '먼서쪽가게', sgg: ['WF'], wins: 1 },
  { id: 5, name: '동쪽가게', sgg: ['E'], wins: 1 },
];
const meta = { rounds: [1176, 1227], source: '테스트 자료' };

describe('방위 계산', () => {
  it('북은 0도, 동은 90도 근처', () => {
    expect(bearingDeg(base, anchors.N)).toBeLessThan(2);
    expect(Math.abs(bearingDeg(base, anchors.E) - 90)).toBeLessThan(2);
  });
});

describe('행운 장소 고르기', () => {
  it('카드 방향(서쪽) 6km 안에서 가장 가까운 지역', async () => {
    const r = await pickLuckyPlace({ date: '2026-10-18', card: 17, base, anchors, stores, meta });
    expect(r.mode).toBe('base');
    expect(r.region.code).toBe('W');
    expect(r.dirName).toBe('서');
    expect(['서쪽가게1', '서쪽가게2']).toContain(r.store.name);
    expect(r.fallback).toBe(false);
    expect(r.distanceKm).toBeGreaterThan(4);
  });

  it('6km 안에 없으면 15km로 넓힌다', async () => {
    const noNear = stores.filter((s) => s.sgg[0] !== 'W');
    const r = await pickLuckyPlace({ date: '2026-10-18', card: 17, base, anchors, stores: noNear, meta });
    expect(r.region.code).toBe('WF');
    expect(r.rangeKm).toBe(15);
  });

  it('그 방향에 없으면 방향과 상관없이 가장 가까운 곳 + 대체 표시', async () => {
    const r = await pickLuckyPlace({ date: '2026-10-18', card: 6, base, anchors, stores: stores.filter((s) => s.id !== 5), meta }); // 동쪽(98도)
    expect(r.fallback).toBe(true);
    expect(r.region.code).toBe('N');
  });

  it('같은 날·같은 기준점이면 같은 장소', async () => {
    const a = await pickLuckyPlace({ date: '2026-10-18', card: 17, base, anchors, stores, meta });
    const b = await pickLuckyPlace({ date: '2026-10-18', card: 17, base, anchors, stores, meta });
    expect(a).toEqual(b);
  });

  it('전국 모드: 방향 없이 날짜로 시·도→지역→가게, 결정적', async () => {
    const a = await pickLuckyPlace({ date: '2026-10-18', card: 17, base: null, anchors, stores, meta });
    const b = await pickLuckyPlace({ date: '2026-10-18', card: 17, base: null, anchors, stores, meta });
    expect(a.mode).toBe('national');
    expect(a).toEqual(b);
    expect(a.sidoCount).toBe(2);
    expect(stores.map((s) => s.name)).toContain(a.store.name);
    expect(a.dirName).toBeNull();
  });

  it('자료가 없으면 장소를 지어내지 않는다', async () => {
    const r = await pickLuckyPlace({ date: '2026-10-18', card: 17, base, anchors, stores: [], meta });
    expect(r).toEqual({ mode: 'unavailable' });
  });
});

describe('실제 자료로 점검', () => {
  it('256개 시·군·구 어디를 기준점으로 해도 장소가 나온다', async () => {
    const fs = await import('node:fs');
    const A = JSON.parse(fs.readFileSync('public/data/sgg-anchors.json', 'utf8')).anchors;
    const S = JSON.parse(fs.readFileSync('public/data/lotto-stores.json', 'utf8'));
    const codes = Object.keys(A);
    expect(codes.length).toBe(256);
    for (const code of codes) {
      const r = await pickLuckyPlace({ date: '2026-10-18', card: 17, base: { ...A[code], sggCode: code }, anchors: A, stores: S.stores, meta: S });
      expect(r.mode).toBe('base');
      expect(r.store.name).toBeTruthy();
    }
  });
});
