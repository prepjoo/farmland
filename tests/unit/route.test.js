// 길찾기 링크와 ‘내 위치에서 거리’ — 순수 함수. 내 위치는 링크에 넣지 않는다.
import { describe, it, expect } from 'vitest';
import { kakaoRouteUrl, kakaoSearchUrl, withDistanceFromMe, fromMeText } from '../../src/engine/route.js';

describe('카카오맵 길찾기 링크', () => {
  it('목적지 이름,위도,경도 (카카오맵 /link/to 형식)', () => {
    expect(kakaoRouteUrl({ name: '갈산공원', lat: 37.506118, lon: 126.868411 }))
      .toBe(`https://map.kakao.com/link/to/${encodeURIComponent('갈산공원')},37.506118,126.868411`);
  });

  it('이름의 쉼표는 형식을 깨므로 빈칸으로 바꾸고, 위경도는 소수 6자리', () => {
    const u = kakaoRouteUrl({ name: '시장, 먹자골목', lat: 35.1, lon: 129.0412345678 });
    expect(u).toBe(`https://map.kakao.com/link/to/${encodeURIComponent('시장 먹자골목')},35.100000,129.041235`);
  });

  it('위치가 없거나 이상하면 링크를 만들지 않는다', () => {
    expect(kakaoRouteUrl({ name: 'x' })).toBeNull();
    expect(kakaoRouteUrl({ name: 'x', lat: 'a', lon: 1 })).toBeNull();
    expect(kakaoRouteUrl(null)).toBeNull();
  });

  it('주소가 없는 판매점은 이름+시·군·구로 검색 링크', () => {
    expect(kakaoSearchUrl('행운복권방 강남구')).toBe(`https://map.kakao.com/link/search/${encodeURIComponent('행운복권방 강남구')}`);
    expect(kakaoSearchUrl('  ')).toBeNull();
  });
});

describe('내 위치에서 거리', () => {
  const me = { lat: 37.5665, lon: 126.978 };
  it('각 장소에 직선거리(km, 소수 1자리)를 붙이고 원래 순서는 그대로', () => {
    const items = [{ id: 'a', lat: 37.5665, lon: 126.978 }, { id: 'b', lat: 37.4563, lon: 126.7052 }];
    const out = withDistanceFromMe(me, items, (p) => p);
    expect(out.map((o) => o.id)).toEqual(['a', 'b']);
    expect(out[0].fromMeKm).toBe(0);
    expect(out[1].fromMeKm).toBeGreaterThan(26);
    expect(out[1].fromMeKm).toBeLessThan(28);
    expect(items[0].fromMeKm).toBeUndefined(); // 원래 값을 바꾸지 않음
  });

  it('위치를 고르는 함수로 판매점은 시·군·구 대표 지점을 쓴다', () => {
    const out = withDistanceFromMe(me, [{ store: { id: 1 }, region: { lat: 37.5665, lon: 126.978 } }], (m) => m.region);
    expect(out[0].fromMeKm).toBe(0);
  });

  it('내 위치가 없으면 거리를 붙이지 않는다', () => {
    const items = [{ id: 'a', lat: 1, lon: 2 }];
    expect(withDistanceFromMe(null, items, (p) => p)).toBe(items);
  });

  it('읽기 쉬운 거리 문장', () => {
    expect(fromMeText(0.04)).toBe('내 위치에서 약 100m 안');
    expect(fromMeText(0.8)).toBe('내 위치에서 약 800m');
    expect(fromMeText(12.34)).toBe('내 위치에서 약 12.3km');
    expect(fromMeText(123.4)).toBe('내 위치에서 약 123km');
  });
});
