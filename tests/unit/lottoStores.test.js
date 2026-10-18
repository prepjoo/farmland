// 행운 장소 자료(public/data/lotto-stores.json) 점검 — docs/spec.md 3장
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('public/data/lotto-stores.json', 'utf8'));
const regions = JSON.parse(fs.readFileSync('public/data/regions/index.json', 'utf8'));
const sggCodes = new Set(regions.sgg.map((s) => s.code));

describe('행운 장소 자료', () => {
  it('출처·기간·종류가 적혀 있다', () => {
    expect(data.source).toContain('기획예산처');
    expect(data.rounds).toEqual([1176, 1227]);
    expect(data.kind).toContain('자동');
  });

  it('온라인 판매는 실제 가게가 아니므로 빠져 있다', () => {
    expect(data.stores.some((s) => /인터넷|온라인/.test(s.name))).toBe(false);
    expect(data.excluded.length).toBe(1);
  });

  it('모든 판매점이 경계 자료에 있는 시·군·구 코드를 하나 이상 갖는다', () => {
    expect(data.stores.length).toBe(462);
    for (const s of data.stores) {
      expect(s.sgg.length).toBeGreaterThan(0);
      for (const c of s.sgg) expect(sggCodes.has(c)).toBe(true);
      expect(s.wins).toBeGreaterThanOrEqual(1);
    }
  });

  it('인천 개편 전 이름(서구)은 새 구 두 곳을 후보로 갖는다', () => {
    const s = data.stores.find((x) => x.region === '인천 서구');
    expect(s.sgg).toEqual(['28275', '28290']);
  });
});
