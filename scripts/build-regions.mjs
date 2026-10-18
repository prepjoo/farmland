// 시·군·구 경계 데이터 만들기
// 사용법: node scripts/build-regions.mjs <행정동 경계 geojson 경로>
// 원자료: vuski/admdongkor (https://github.com/vuski/admdongkor) ver20260701
//        통계청 SGIS 행정동 경계, 공공누리 제1유형 → CC BY 4.0. 출처 표기 필수.
// 결과: public/data/regions/index.json, <시도코드>.json, land.json, dong-<시도코드>.json(읍·면·동)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SOURCE_VERSION = 'ver20260701';
const ATTRIBUTION =
  '행정구역 경계: 통계청 통계지리정보서비스(SGIS)에서 공공누리 제1유형으로 개방한 행정동 경계를 가공(vuski/admdongkor, CC BY 4.0)';

const input = process.argv[2];
if (!input) {
  console.error('행정동 경계 geojson 경로를 넣어 주세요.');
  process.exit(1);
}
const outDir = resolve('public/data/regions');
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'regions-'));
const mapshaper = resolve('node_modules/.bin/mapshaper');

function run(simplify, out) {
  execFileSync(mapshaper, [
    input,
    '-dissolve', 'sgg', 'copy-fields=sido,sidonm,sggnm',
    '-simplify', simplify, 'keep-shapes',
    '-o', out, 'format=geojson', 'precision=0.0001',
  ], { stdio: 'inherit' });
  return JSON.parse(readFileSync(out, 'utf8'));
}

// '고양시덕양구' → '고양시 덕양구'
const prettySgg = (name) => name.replace(/^(.+?시)(.+구)$/, '$1 $2');

function bboxOf(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY].map((v) => Math.round(v * 1e4) / 1e4);
}
const mergeBbox = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

const detail = run('10%', join(tmp, 'detail.json'));

// 읍·면·동: 합치지 않고 간략화만 (이웃한 경계선은 함께 간략화되어 틈이 생기지 않는다)
const dongOut = join(tmp, 'dong.json');
execFileSync(mapshaper, [input, '-simplify', '15%', 'keep-shapes', '-o', dongOut, 'format=geojson', 'precision=0.0001'], { stdio: 'inherit' });
const dong = JSON.parse(readFileSync(dongOut, 'utf8'));
const coarse = run('3%', join(tmp, 'coarse.json'));

const sidoMap = new Map();
const sgg = [];
const bySido = new Map();
for (const f of detail.features) {
  const p = f.properties;
  const bbox = bboxOf(f.geometry);
  const item = { code: p.sgg, name: prettySgg(p.sggnm), sido: p.sido, bbox };
  sgg.push(item);
  const s = sidoMap.get(p.sido);
  sidoMap.set(p.sido, s ? { ...s, bbox: mergeBbox(s.bbox, bbox) } : { code: p.sido, name: p.sidonm, bbox });
  if (!bySido.has(p.sido)) bySido.set(p.sido, []);
  bySido.get(p.sido).push({ type: 'Feature', properties: { code: item.code, name: item.name, sido: p.sido }, geometry: f.geometry });
}

sgg.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
const sido = [...sidoMap.values()].sort((a, b) => a.code.localeCompare(b.code));
const country = sido.reduce((acc, s) => (acc ? mergeBbox(acc, s.bbox) : s.bbox), null);

writeFileSync(join(outDir, 'index.json'), JSON.stringify({ version: SOURCE_VERSION, attribution: ATTRIBUTION, country: { code: '00', name: '전국', bbox: country }, sido, sgg }));
for (const [code, features] of bySido) {
  writeFileSync(join(outDir, `${code}.json`), JSON.stringify({ type: 'FeatureCollection', features }));
}
const dongBySido = new Map();
for (const f of dong.features) {
  const p = f.properties;
  const name = p.adm_nm.split(' ').at(-1);
  if (!dongBySido.has(p.sido)) dongBySido.set(p.sido, []);
  dongBySido.get(p.sido).push({ type: 'Feature', properties: { code: p.adm_cd2, name, sgg: p.sgg }, geometry: f.geometry });
}
for (const [code, features] of dongBySido) {
  features.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'ko'));
  writeFileSync(join(outDir, `dong-${code}.json`), JSON.stringify({ type: 'FeatureCollection', features }));
}
writeFileSync(join(outDir, 'land.json'), JSON.stringify({
  type: 'FeatureCollection',
  features: coarse.features.map((f) => ({ type: 'Feature', properties: { code: f.properties.sgg }, geometry: f.geometry })),
}));
console.log(`시도 ${sido.length}개, 시군구 ${sgg.length}개, 읍면동 ${dong.features.length}개를 ${outDir}에 저장했습니다.`);
