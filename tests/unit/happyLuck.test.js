// 행복메시지(타로·주역·점성술) · 만남 장소 · 출발 길찾기 — 엔진 테스트 (2026-10-19 메인 개편)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { todayTarot, todayHexagram, todayZodiac, MESSAGE_KINDS } from '../../src/engine/fortune.js';
import { meetPlaces, midpoint } from '../../src/engine/meet.js';
import { kakaoFromToUrl } from '../../src/engine/route.js';

const zodiac = JSON.parse(readFileSync(new URL('../../public/data/zodiac.json', import.meta.url), 'utf8'));

describe('행복메시지 3종', () => {
  it('종류는 타로 22장 · 주역 64괘 · 점성술 12궁', () => {
    expect(MESSAGE_KINDS.map((k) => [k.id, k.label, k.count])).toEqual([['tarot', '타로', 22], ['iching', '주역', 64], ['zodiac', '점성술', 12]]);
  });

  it('점성술: 같은 날·같은 곳이면 같은 별자리, 0~11', async () => {
    const a = await todayZodiac({ date: '2026-10-19', np: '다사 5390 5203' });
    expect(a).toBe(await todayZodiac({ date: '2026-10-19', np: '다사 5390 5203' }));
    expect(Number.isInteger(a) && a >= 0 && a < 12).toBe(true);
    const seen = new Set();
    for (let d = 1; d <= 60; d++) seen.add(await todayZodiac({ date: `2026-1${d % 2}-${String((d % 28) + 1).padStart(2, '0')}`, np: `다사 ${d}` }));
    expect(seen.size).toBe(12);
  });

  it('타로·주역·점성술은 서로 다른 규칙 글자를 써서 따로 뽑힌다', async () => {
    const np = '마라 4341 8830';
    const r = await Promise.all(['2026-10-19', '2026-10-20', '2026-10-21'].map(async (date) => [await todayTarot({ date, np }), (await todayHexagram({ date, np })) - 1, await todayZodiac({ date, np })]));
    expect(r.some(([t, h, z]) => !(t === h && h === z))).toBe(true);
  });

  it('별자리 자료 12개: 원소·특성·지배 행성·풀이', () => {
    expect(zodiac.signs).toHaveLength(12);
    expect(zodiac.signs.map((s) => s.n)).toEqual([...Array(12).keys()]);
    for (const s of zodiac.signs) {
      expect(['불', '흙', '공기', '물']).toContain(s.element);
      expect(['활동궁', '고정궁', '변통궁']).toContain(s.modality);
      expect(s.tradition.length).toBeGreaterThan(10);
      expect(s.advice.length).toBeGreaterThan(5);
    }
    expect(zodiac.status).toContain('놀이용');
  });
});

describe('만남 장소 3곳 (나는 현재 위치, 상대는 동네 대표 지점)', () => {
  const a = { lat: 37.5665, lon: 126.978 }; // 서울시청
  const b = { lat: 37.4563, lon: 126.7052 }; // 인천
  const places = [
    { id: 'near-a', name: '시청 앞', lat: 37.567, lon: 126.979 },
    { id: 'mid1', name: '가운데1', lat: 37.51, lon: 126.84 },
    { id: 'mid2', name: '가운데2', lat: 37.52, lon: 126.85 },
    { id: 'mid3', name: '가운데3', lat: 37.50, lon: 126.83 },
    { id: 'near-b', name: '인천 앞', lat: 37.456, lon: 126.705 },
  ];

  it('가운데 지점', () => {
    const m = midpoint(a, b);
    expect(m.lat).toBeCloseTo(37.5114, 3);
    expect(m.lon).toBeCloseTo(126.8416, 3);
  });

  it('두 사람 중 더 먼 쪽의 거리가 짧은 곳부터 3곳, 각자의 거리를 붙인다', () => {
    const r = meetPlaces({ a, b, places });
    expect(r.items.map((p) => p.id).sort()).toEqual(['mid1', 'mid2', 'mid3']); // 한쪽에 치우친 곳은 빠짐
    const worst = r.items.map((p) => Math.max(p.fromA, p.fromB));
    expect(worst).toEqual([...worst].sort((x, y) => x - y));
    for (const p of r.items) {
      expect(p.fromA).toBeGreaterThan(0);
      expect(p.fromB).toBeGreaterThan(0);
      expect(Math.abs(p.fromA - p.fromB)).toBeLessThan(5);
    }
    expect(r.gapKm).toBeGreaterThan(26);
    expect(r.gapKm).toBeLessThan(28);
  });

  it('같은 입력이면 같은 결과, 같은 점수면 이름표(id) 순', () => {
    const same = [{ id: 'b', lat: 1, lon: 1 }, { id: 'a', lat: 1, lon: 1 }];
    expect(meetPlaces({ a: { lat: 1, lon: 1 }, b: { lat: 1, lon: 1 }, places: same }).items.map((p) => p.id)).toEqual(['a', 'b']);
    expect(meetPlaces({ a, b, places })).toEqual(meetPlaces({ a, b, places }));
  });

  it('위치가 없는 장소는 뺀다, 장소가 없으면 빈 목록', () => {
    expect(meetPlaces({ a, b, places: [{ id: 'x' }] }).items).toEqual([]);
    expect(meetPlaces({ a, b, places: [] }).items).toEqual([]);
  });
});

describe('출발 길찾기 (행운위치 → 목적지)', () => {
  it('카카오맵 /link/from/이름,위도,경도/to/이름,위도,경도 (형식 확인 필요)', () => {
    expect(kakaoFromToUrl({ name: '행운위치', lat: 37.5665, lon: 126.978 }, { name: '강남구, 대표', lat: 37.4979, lon: 127.0276 }))
      .toBe(`https://map.kakao.com/link/from/${encodeURIComponent('행운위치')},37.566500,126.978000/to/${encodeURIComponent('강남구 대표')},37.497900,127.027600`);
  });
  it('어느 한쪽 위치가 없으면 null', () => {
    expect(kakaoFromToUrl({ name: 'a' }, { name: 'b', lat: 1, lon: 1 })).toBeNull();
  });
});
