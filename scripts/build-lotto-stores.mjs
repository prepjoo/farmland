// 공공데이터포털 '기획예산처_온라인복권 1등 당첨 판매점 현황 정보'(CSV, UTF-8로 바꾼 것)를
// 행운 장소용 자료 public/data/lotto-stores.json으로 만든다. (docs/spec.md 3장)
//   node scripts/build-lotto-stores.mjs data/raw/lotto-stores-20260606.csv
// - 온라인 판매(인터넷 복권판매사이트)는 실제 가게가 아니므로 뺀다.
// - 지역 이름을 시·군·구 경계 자료(public/data/regions/index.json)의 코드로 바꾼다.
// - 2026-07 인천 행정구역 개편(중구·동구→제물포구·영종구, 서구→서해구·검단구)처럼
//   자료와 경계의 이름이 다르면 REMAP으로 후보 코드를 모두 붙인다(주소가 없어 한 곳으로 정할 수 없음).
import fs from 'node:fs';

const SIDO = {
  서울: '11', 부산: '26', 대구: '27', 인천: '28', 광주: '12', 대전: '30', 울산: '31', 세종: '36',
  경기: '41', 강원: '51', 충북: '43', 충남: '44', 전북: '52', 전남: '12', 경북: '47', 경남: '48', 제주: '50',
};
const REMAP = {
  '인천 중구': ['28125', '28155'],
  '인천 동구': ['28125'],
  '인천 서구': ['28275', '28290'],
};
const ONLINE = /인터넷|온라인/;

const csvPath = process.argv[2] ?? 'data/raw/lotto-stores-20260606.csv';
const outPath = process.argv[3] ?? 'public/data/lotto-stores.json';
const ix = JSON.parse(fs.readFileSync('public/data/regions/index.json', 'utf8'));

const lines = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
const rows = lines.slice(1).map((line) => {
  const p = line.split(',');
  return { no: Number(p[0]), name: p.slice(1, -2).join(',').trim(), region: p.at(-2).trim(), wins: Number(p.at(-1)) };
});

const stores = [];
const excluded = [];
const unmatched = [];
for (const r of rows) {
  if (ONLINE.test(r.name)) { excluded.push({ name: r.name, region: r.region, wins: r.wins, reason: '온라인 판매(실제 가게 아님)' }); continue; }
  const [sd, ...rest] = r.region.split(/\s+/);
  const sido = SIDO[sd];
  const sggName = rest.join(' ');
  let codes = REMAP[r.region] ?? null;
  if (!codes && sido === '36') codes = ix.sgg.filter((s) => s.sido === '36').map((s) => s.code);
  if (!codes) {
    const exact = ix.sgg.filter((s) => s.sido === sido && s.name === sggName);
    codes = exact.length ? exact.map((s) => s.code)
      : ix.sgg.filter((s) => s.sido === sido && s.name.startsWith(`${sggName} `)).map((s) => s.code);
  }
  if (!codes.length) { unmatched.push(r); continue; }
  stores.push({ id: r.no, name: r.name, region: r.region, sgg: codes, wins: r.wins });
}
if (unmatched.length) {
  console.error('시·군·구를 찾지 못한 판매점:', unmatched.map((r) => `${r.region} ${r.name}`).join(' | '));
  process.exit(1);
}

const out = {
  version: 'mopb-20260606',
  source: '기획예산처_온라인복권 1등 당첨 판매점 현황 정보_20260606 (공공데이터포털, 이용허락범위 제한 없음)',
  sourceUrl: 'https://www.data.go.kr/data/15059963/fileData.do',
  rounds: [1176, 1227],
  period: ['2025-06-08', '2026-06-06'],
  kind: '로또6/45 자동선택 1등만(수동 1등 제외)',
  regionsVersion: ix.version,
  excluded,
  stores,
};
fs.writeFileSync(outPath, `${JSON.stringify(out)}\n`);
console.log(`판매점 ${stores.length}곳(제외 ${excluded.length}) → ${outPath}`);
