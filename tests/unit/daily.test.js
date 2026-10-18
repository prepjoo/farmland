import { describe, it, expect } from 'vitest';
import { dailyLuck } from '../../src/engine/daily.js';
import { dedication } from '../../src/engine/dedication.js';

describe('오늘의 행운 (첫 화면)', () => {
  it('같은 날·같은 기기 값이면 같은 카드와 번호, 날짜가 바뀌면 다시 뽑는다', async () => {
    const a = await dailyLuck({ date: '2026-10-14', salt: 'abc' });
    const b = await dailyLuck({ date: '2026-10-14', salt: 'abc' });
    expect(a).toEqual(b);
    const days = await Promise.all(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'].map((date) => dailyLuck({ date, salt: 'abc' })));
    expect(days.some((d) => d.card !== a.card || d.numbers.join() !== a.numbers.join())).toBe(true);
  });
  it('카드는 0~21, 행운의 번호는 1~45 중 겹치지 않는 3개(작은 순)', async () => {
    for (const salt of ['x', 'y', 'z', 'w']) {
      const { card, numbers } = await dailyLuck({ date: '2026-10-14', salt });
      expect(card).toBeGreaterThanOrEqual(0);
      expect(card).toBeLessThanOrEqual(21);
      expect(numbers).toHaveLength(3);
      expect(new Set(numbers).size).toBe(3);
      for (const n of numbers) expect(n >= 1 && n <= 45).toBe(true);
      expect([...numbers].sort((p, q) => p - q)).toEqual(numbers);
    }
  });
});

describe('별땅문서 헌사', () => {
  it('생일: 나는 ‘당신’, 가족은 그 이름', () => {
    expect(dedication({ kind: 'birthday', label: '내 생일' })).toContain('당신의 빛나는 탄생을 축하하며');
    expect(dedication({ kind: 'birthday', label: '엄마 생일' })).toContain('엄마의 소중한 탄생을 축하하며');
  });
  it('기념일·MBTI·전화번호·의미 있는 수', () => {
    expect(dedication({ kind: 'anniv', label: '첫 만난 날' })).toContain('처음 만난 그날을 기념하며');
    expect(dedication({ kind: 'anniv', label: '결혼기념일' })).toContain('함께 걸어온 날들을 기념하며');
    expect(dedication({ kind: 'anniv', label: '프러포즈한 날' })).toContain('‘프러포즈한 날’을 기념하며');
    expect(dedication({ kind: 'mbti' })).toContain('서로 다른 두 사람');
    expect(dedication({ kind: 'phone' })).toContain('번호');
    expect(dedication({ kind: 'number' })).toContain('의미 있는 숫자');
  });
  it('모든 문장은 별을 새긴다로 끝난다', () => {
    for (const k of ['birthday', 'anniv', 'mbti', 'phone', 'number', 'gift']) expect(dedication({ kind: k, label: '내 생일' })).toMatch(/별 하나를 새깁니다\.$/);
  });
});
