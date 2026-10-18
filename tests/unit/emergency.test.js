import { describe, it, expect } from 'vitest';
import { EMERGENCY_NUMBERS, reportText, sayText, smsHref, telHref, toDms, describeAccuracy } from '../../src/engine/emergency.js';

describe('긴급 신고 도구', () => {
  it('1차 신고 번호는 119·112 (122는 공식 확인 전이라 빼 둠)', () => {
    expect(EMERGENCY_NUMBERS.map((e) => e.number)).toEqual(['119', '112']);
    expect(telHref('119')).toBe('tel:119');
  });
  it('신고 문구: 국가지점번호(휴대폰 계산값)를 맨 위에, 오차·시각, 위경도는 아래에 참고로 (사용자 결정 2026-10-14)', () => {
    const t = reportText({ np: '다사 5390 5203', lat: 37.56651, lon: 126.97801, accuracy: 18, at: new Date('2026-10-12T11:05:00Z') });
    const lines = t.split(' / ');
    expect(lines[0]).toBe('[긴급 신고] 제 위치입니다.');
    expect(lines[1]).toBe('국가지점번호 다사 5390 5203 (휴대폰 계산값)');
    expect(lines[2]).toBe('오차 약 20m · 20:05 측정');
    expect(lines[3]).toBe('(참고) 위도 37.56651, 경도 126.97801');
  });
  it('국가지점번호 구역 밖이면 위경도만', () => {
    const t = reportText({ np: null, lat: 33.0, lon: 125.0, accuracy: 30 });
    expect(t).not.toContain('국가지점번호');
    expect(t).toContain('위도 33, 경도 125');
  });
  it('전화로 읽을 문장', () => {
    expect(sayText({ np: '다사 5390 5203', accuracy: 18 })).toBe('제 위치는 국가지점번호 다사 오삼구공 오이공삼, 오차 약 20m입니다.');
    expect(sayText({ np: null, lat: 37.5, lon: 127, accuracy: 18 })).toContain('위도 37.5');
  });
  it('위치가 없으면 안내 문장만', () => {
    expect(reportText({})).toBe('[긴급 신고] 제 위치입니다.');
  });
  it('문자 신고 주소는 안드로이드·아이폰 모두 열리는 형식', () => {
    const h = smsHref('119', '긴급 신고 테스트');
    expect(h.startsWith('sms:119?&body=')).toBe(true);
    expect(decodeURIComponent(h.split('body=')[1])).toBe('긴급 신고 테스트');
  });
  it('도·분·초 표기', () => {
    expect(toDms(37.5665, 'lat')).toBe('북위 37° 33′ 59″');
    expect(toDms(126.978, 'lon')).toBe('동경 126° 58′ 41″');
  });
  it('정확도를 쉬운 말로', () => {
    expect(describeAccuracy(8)).toContain('정확');
    expect(describeAccuracy(400)).toContain('넓');
  });
});
