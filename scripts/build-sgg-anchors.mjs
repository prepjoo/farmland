// 시·군·구 대표 지점(public/data/sgg-anchors.json)을 미리 계산한다 (docs/spec.md 3.2)
//   node scripts/build-sgg-anchors.mjs
// 별땅 엔진의 regionAnchor(가장 넓은 땅덩이의 무게중심, 경계 밖이면 안쪽 가장 가까운 점)를 그대로 쓴다.
import fs from 'node:fs';
import { regionAnchor } from '../src/engine/anchor.js';

const dir = 'public/data/regions';
const ix = JSON.parse(fs.readFileSync(`${dir}/index.json`, 'utf8'));
const anchors = {};
for (const sido of ix.sido) {
  const fc = JSON.parse(fs.readFileSync(`${dir}/${sido.code}.json`, 'utf8'));
  const groups = new Map();
  for (const f of fc.features) {
    const code = f.properties.code;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(f);
  }
  for (const [code, feats] of groups) {
    const a = regionAnchor(feats);
    const meta = ix.sgg.find((s) => s.code === code);
    anchors[code] = {
      lat: Math.round(a.lat * 1e6) / 1e6,
      lon: Math.round(a.lon * 1e6) / 1e6,
      name: meta?.name ?? feats[0].properties.name,
      sido: sido.code,
      sidoName: sido.name,
    };
  }
}
const missing = ix.sgg.filter((s) => !anchors[s.code]);
if (missing.length) {
  console.error('대표 지점이 없는 시·군·구:', missing.map((s) => s.name).join(', '));
  process.exit(1);
}
fs.writeFileSync('public/data/sgg-anchors.json', `${JSON.stringify({ version: ix.version, anchors })}\n`);
console.log(`시·군·구 대표 지점 ${Object.keys(anchors).length}곳 → public/data/sgg-anchors.json`);
