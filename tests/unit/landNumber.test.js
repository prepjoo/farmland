import { describe, it, expect } from 'vitest';
import { digitsFrom, zoneCandidates, maskNationalPoint, ZONE_LETTERS, mbtiDigits, MBTI_KEYPAD } from '../../src/engine/landNumber.js';
import { reduceToMajor, guardianCardNumber, yearCardNumber, bearingWord, drawTodayCard } from '../../src/engine/landCard.js';
import { recommendIndex } from '../../src/engine/coupleRecommend.js';
import { encodeGift, decodeGift } from '../../src/engine/giftLink.js';
import { buildIcs } from '../../src/engine/ics.js';
import { toNationalPoint } from '../../src/engine/nationalPoint.js';

describe('번호 → 8자리', () => {
  it('날짜는 YYYYMMDD', () => {
    expect(digitsFrom('date', '1962-03-07')).toBe('19620307');
    expect(digitsFrom('date', '2026-02-30')).toBeNull(); // 없는 날짜
    expect(digitsFrom('date', '')).toBeNull();
  });
  it('전화번호는 숫자만 모아 마지막 8자리, 앞자리 0 유지', () => {
    expect(digitsFrom('phone', '010-0796-0488')).toBe('07960488');
    expect(digitsFrom('phone', '0488')).toBeNull();
  });
  it('직접 넣는 숫자는 꼭 8자리', () => {
    expect(digitsFrom('number', '1234 5678')).toBe('12345678');
    expect(digitsFrom('number', '1234567')).toBeNull();
  });
});

describe('MBTI 8글자 → 숫자 8자리 (휴대폰 자판)', () => {
  it('글자마다 휴대폰 자판 숫자, 두 사람은 가나다(알파벳)순으로 이어 붙여 순서를 바꿔도 같다', () => {
    expect(mbtiDigits('ESTJ', 'INFP')).toBe('37854637');
    expect(mbtiDigits('infp', 'estj')).toBe('37854637');
    expect(mbtiDigits('INFP', 'INFP')).toBe('46374637');
  });
  it('자리마다 두 글자의 숫자가 서로 달라 거꾸로 읽을 수 있다', () => {
    for (const [a, b] of [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']]) expect(MBTI_KEYPAD[a]).not.toBe(MBTI_KEYPAD[b]);
  });
  it('틀린 MBTI면 null', () => {
    expect(mbtiDigits('ABCD', 'INFP')).toBeNull();
    expect(mbtiDigits('', 'INFP')).toBeNull();
  });
});

describe('구역마다 한 곳', () => {
  it('64구역 모두 같은 8자리, 계산한 위치를 다시 번호로 바꾸면 같은 번호', () => {
    const list = zoneCandidates('57960488');
    expect(list).toHaveLength(64);
    expect(new Set(list.map((c) => c.zone)).size).toBe(64);
    for (const c of list) {
      expect(c.text).toBe(`${c.zone} 5796 0488`);
      const back = toNationalPoint(c.lat, c.lon);
      expect(back.text).toBe(c.text);
    }
  });
  it('구역 글자는 가~아 8개', () => {
    expect(ZONE_LETTERS.join('')).toBe('가나다라마바사아');
  });
  it('가리기: 가운데 네 자리를 ●로', () => {
    expect(maskNationalPoint('마마 5796 0488')).toBe('마마 57●● ●●88');
  });
});

describe('행운 카드', () => {
  it('21보다 크면 자릿수를 다시 더한다', () => {
    expect(reduceToMajor(47)).toBe(11);
    expect(reduceToMajor(21)).toBe(21);
    expect(reduceToMajor(99)).toBe(18);
    expect(reduceToMajor(2049)).toBe(15);
  });
  it('수호 카드: 8자리 합을 줄인 값. 같은 번호 = 같은 카드', () => {
    expect(guardianCardNumber('57960488')).toBe(11); // 47 → 11 정의
    expect(guardianCardNumber('19620307')).toBe(guardianCardNumber('19620307'));
  });
  it('올해의 카드: 월 + 일 + 올해 연도를 줄인 값', () => {
    expect(yearCardNumber('1962-10-13', 2026)).toBe(reduceToMajor(10 + 13 + 2026));
    expect(yearCardNumber('nope', 2026)).toBeNull();
  });
  it('오늘의 행운 카드: 0~21 중 하나, 수호 카드와 겹치지 않고, 뽑기 값이 같으면 같은 카드', () => {
    for (const r of [0, 0.3, 0.5, 0.9999]) {
      const n = drawTodayCard(() => r, 11);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(21);
      expect(n).not.toBe(11);
      expect(drawTodayCard(() => r, 11)).toBe(n);
    }
    const seen = new Set(Array.from({ length: 21 }, (_, i) => drawTodayCard(() => i / 21, 0)));
    expect(seen.size).toBe(21);
  });
  it('방위 이름', () => {
    expect(bearingWord(0)).toBe('북');
    expect(bearingWord(130)).toBe('남동');
    expect(bearingWord(350)).toBe('북');
  });
});

describe('연인 추천 별', () => {
  it('같은 입력이면 같은 추천, 두 MBTI 순서를 바꿔도 같다', async () => {
    const a = await recommendIndex({ mbtiA: 'INFP', mbtiB: 'ESTJ', digits: '20190504', count: 11 });
    const b = await recommendIndex({ mbtiA: 'estj', mbtiB: 'INFP', digits: '20190504', count: 11 });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(11);
  });
  it('후보가 없으면 -1', async () => {
    expect(await recommendIndex({ mbtiA: 'INFP', mbtiB: 'ESTJ', digits: '20190504', count: 0 })).toBe(-1);
  });
});

describe('선물 링크', () => {
  it('별땅·카드·메시지만 담고 MBTI·번호 종류는 담지 않는다', () => {
    const q = encodeGift({ np: '마마 5796 0488', yearCard: 15, year: 2026, masked: true, message: '우리 첫 여행 바다' });
    expect(q).not.toMatch(/INFP|phone|birthday|date/i);
    const g = decodeGift(q);
    expect(g).toEqual({ np: '마마 5796 0488', yearCard: 15, year: 2026, masked: true, message: '우리 첫 여행 바다' });
  });
  it('틀린 링크는 null, 메시지는 60자까지', () => {
    expect(decodeGift('n=hello')).toBeNull();
    const long = decodeGift(encodeGift({ np: '다사 1234 5678', message: 'ㄱ'.repeat(100) }));
    expect(long.message).toHaveLength(60);
    expect(long.yearCard).toBeNull();
  });
});

describe('휴대폰 달력 파일', () => {
  it('해마다 돌아오는 하루 종일 일정', () => {
    const ics = buildIcs({ title: '첫 만남 기념일', date: '2019-05-04', url: 'https://example.com/', now: new Date('2026-10-13T00:00:00Z') });
    expect(ics).toMatch(/BEGIN:VCALENDAR/);
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20190504/);
    expect(ics).toMatch(/RRULE:FREQ=YEARLY/);
    expect(ics).toMatch(/SUMMARY:첫 만남 기념일/);
    expect(ics).toMatch(/DTSTAMP:20261013T000000Z/);
    expect(ics.split('\r\n').length).toBeGreaterThan(8);
  });
});
