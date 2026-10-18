import { describe, it, expect } from 'vitest';
import {
  toNationalPoint,
  fromNationalPoint,
  parseNationalPoint,
  formatNationalPoint,
  wgs84ToUtmk,
  utmkToWgs84,
} from '../../src/engine/nationalPoint.js';

// 기준값: 계산값이며 공식 조회(주소정보누리집)와 대조 전이다.
// 1주차 게이트에서 공식 조회 10곳과 대조해 OFFICIAL_CHECKS로 옮긴다.
const COMPUTED_REFERENCES = [
  { name: '서울시청 앞', lat: 37.5665, lon: 126.978, code: '다사 5390 5203' },
  { name: '부산시청 인근', lat: 35.1798, lon: 129.075, code: '마라 4341 8830' },
  { name: '한라산 정상 인근', lat: 33.3617, lon: 126.5312, code: '다나 0986 8599' },
];

// 공식 조회 결과를 받으면 여기에 넣는다. (확인 필요)
const OFFICIAL_CHECKS = [];

describe('국가지점번호 계산', () => {
  it.each(COMPUTED_REFERENCES)('$name → $code', ({ lat, lon, code }) => {
    expect(toNationalPoint(lat, lon).text).toBe(code);
  });

  it.each(OFFICIAL_CHECKS)('공식 대조: $name → $code', ({ lat, lon, code }) => {
    expect(toNationalPoint(lat, lon).text).toBe(code);
  });

  it('숫자 앞자리 0을 유지한다', () => {
    const r = toNationalPoint(33.3617, 126.5312);
    expect(r.east).toBe('0986');
    expect(r.east).toHaveLength(4);
  });

  it('UTM-K 변환은 왕복해도 1cm 안에서 같다', () => {
    const [x, y] = wgs84ToUtmk(37.5663, 126.9779);
    const [lat, lon] = utmkToWgs84(x, y);
    expect(lat).toBeCloseTo(37.5663, 7);
    expect(lon).toBeCloseTo(126.9779, 7);
  });

  it('번호를 위경도(10m 칸의 가운데)로 되돌린다', () => {
    const { lat, lon } = fromNationalPoint('다사 5390 5203');
    expect(toNationalPoint(lat, lon).text).toBe('다사 5390 5203');
  });

  it('띄어쓰기가 없거나 달라도 읽는다', () => {
    expect(parseNationalPoint('다사53905203')).toEqual({ zone: '다사', east: '5390', north: '5203' });
    expect(parseNationalPoint(' 다사  5390-5203 ')).toEqual({ zone: '다사', east: '5390', north: '5203' });
  });

  it('잘못된 번호는 null', () => {
    expect(parseNationalPoint('하하 1234 5678')).toBeNull();
    expect(parseNationalPoint('다사 123 5678')).toBeNull();
  });

  it('국가지점번호 구역 밖은 null', () => {
    expect(toNationalPoint(35.68, 139.76)).toBeNull(); // 도쿄
  });

  it('표시 형식', () => {
    expect(formatNationalPoint({ zone: '다사', east: '0001', north: '0099' })).toBe('다사 0001 0099');
  });
});
