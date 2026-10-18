// 별땅문서 이미지 (1080×1350). 브라우저 안에서 캔버스로 그려 PNG로 바꾸고, 서버로 보내지 않는다.
// 글꼴: 나눔명조(@fontsource/nanum-myeongjo, SIL OFL)를 사이트 안에서 불러와 그림에 쓴다.
// 우리나라 윤곽은 행정구역 경계 자료(land.json)를 줄여 그린다. 지도 그림(OpenStreetMap)은 넣지 않는다.
import { SITE_NAME } from './brand.js';

export const LAND_SIZE = [1080, 1350];
const SERIF = "'Nanum Myeongjo','Noto Serif KR','AppleMyungjo','Batang',serif";
const INK = '#2a2117', GOLD = '#a8843e', GOLD_D = '#7a5c22', RED = '#b8322a';
const BOX = { w: 124.5, e: 131.0, s: 33.0, n: 38.7 };
const f = (w, px) => `${w} ${px}px ${SERIF}`;

function projector(x0, y0, wpx, hpx) {
  const k = Math.cos((36 * Math.PI) / 180);
  const s = Math.min(wpx / ((BOX.e - BOX.w) * k), hpx / (BOX.n - BOX.s));
  const ox = x0 + (wpx - (BOX.e - BOX.w) * k * s) / 2, oy = y0 + (hpx - (BOX.n - BOX.s) * s) / 2;
  return (lon, lat) => [ox + (lon - BOX.w) * k * s, oy + (BOX.n - lat) * s];
}

function star(ctx, cx, cy, r, inner = 0.42) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * i) / 5 - Math.PI / 2, rr = i % 2 ? r * inner : r;
    ctx[i ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
}

/** 너비에 맞춰 줄 나누기(띄어쓰기 우선, 긴 낱말은 글자 단위) */
function wrap(ctx, text, maxW, maxLines) {
  const out = [];
  let line = '';
  for (const word of String(text ?? '').split(/\s+/).filter(Boolean)) {
    const tryLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(tryLine).width <= maxW) { line = tryLine; continue; }
    if (line) out.push(line);
    line = '';
    for (const ch of word) {
      if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; }
      line += ch;
    }
  }
  if (line) out.push(line);
  if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = out[maxLines - 1].replace(/.$/, '…'); }
  return out;
}

/** 가운데 장식선: ── ✦ ── */
function divider(ctx, cx, y, half) {
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 22, y); ctx.moveTo(cx + 22, y); ctx.lineTo(cx + half, y); ctx.stroke();
  ctx.fillStyle = GOLD; star(ctx, cx, y, 11); ctx.fill();
}

function paper(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H / 2, H * 0.8);
  g.addColorStop(0, '#fffbf0'); g.addColorStop(1, '#f1e4c6');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 종이결: 같은 그림이 나오도록 정해진 순서의 점
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = 'rgba(122,92,34,0.05)';
  for (let i = 0; i < 2600; i++) ctx.fillRect(r() * W, r() * H, 1.4, 1.4);
  // 테두리: 굵은 금선 + 가는 안쪽 선 + 모서리 별
  ctx.strokeStyle = GOLD_D; ctx.lineWidth = 3; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.strokeRect(50, 50, W - 100, H - 100);
  for (const [x, y] of [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]]) {
    ctx.fillStyle = '#fffbf0'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = GOLD; star(ctx, x, y, 14); ctx.fill();
  }
}

function koreaMap(ctx, features, x, y, w, h, lon, lat) {
  ctx.fillStyle = 'rgba(255,253,246,0.9)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  const P = projector(x + 20, y + 20, w - 40, h - 40);
  ctx.beginPath();
  for (const ft of features ?? []) {
    const polys = ft.geometry.type === 'Polygon' ? [ft.geometry.coordinates] : ft.geometry.coordinates;
    for (const poly of polys) {
      const ring = poly[0];
      if (ring.length < 4) continue;
      ring.forEach(([lo, la], i) => { const [px, py] = P(lo, la); ctx[i ? 'lineTo' : 'moveTo'](px, py); });
      ctx.closePath();
    }
  }
  ctx.fillStyle = '#efe2bf'; ctx.fill();
  ctx.strokeStyle = '#b79a5c'; ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.stroke();
  const [sx, sy] = P(lon, lat);
  ctx.fillStyle = 'rgba(255,193,69,0.35)'; ctx.beginPath(); ctx.arc(sx, sy, 30, 0, Math.PI * 2); ctx.fill();
  star(ctx, sx, sy, 20); ctx.fillStyle = '#ffc145'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
}

function seal(ctx, cx, cy) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.16);
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.strokeRect(-44, -44, 88, 88);
  ctx.lineWidth = 1.5; ctx.strokeRect(-37, -37, 74, 74);
  ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.font = f(800, 26);
  ctx.fillText('별땅', 0, -5); ctx.fillText('기념', 0, 25);
  ctx.restore();
}

/**
 * 별땅문서 그리기 (캔버스). 법적 효력이 없다는 문구를 위아래에 분명히 넣는다.
 * { place, np(표시용, 가렸으면 가린 번호), dedication(헌사 한 문장), dateText, cardName, cardLine, message, lat, lon, landFeatures }
 */
export function drawLandDeed(ctx, { place, np, dedication, dateText, cardName, cardLine, message, lat, lon, landFeatures }) {
  const [W, H] = LAND_SIZE, cx = W / 2;
  paper(ctx, W, H);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';

  ctx.fillStyle = GOLD_D; ctx.font = f(400, 22);
  ctx.fillText(`${SITE_NAME}  ·  기념 증서  ·  놀이용`, cx, 118);
  ctx.fillStyle = INK; ctx.font = f(800, 104);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '18px';
  ctx.fillText('별땅문서', cx + 9, 236);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  divider(ctx, cx, 282, 260);

  // 헌사
  ctx.font = f(400, 36); ctx.fillStyle = INK;
  // 쉼표 앞뒤로 줄을 나눠 읽기 좋게(넘치면 너비에 맞춰 다시 나눔)
  const ded = String(dedication ?? '').split(/(?<=,)\s+/).flatMap((part) => wrap(ctx, part, 860, 2)).slice(0, 3);
  ded.forEach((t, i) => ctx.fillText(t, cx, 350 + i * 56));
  let y = 350 + ded.length * 56 + 20;

  // 지도(왼쪽) + 내용(오른쪽)
  const top = Math.max(y, 456);
  koreaMap(ctx, landFeatures, 96, top, 380, 400, lon, lat);
  const items = [
    ['소재지', place],
    ['국가지점번호 · 계산값', np],
    ['면적', '가로세로 10m · 100㎡ (약 30평)'],
    ['수호 카드', cardName || '', cardLine],
  ];
  ctx.textAlign = 'left';
  let iy = top + 28;
  for (const [k, v, sub] of items) {
    ctx.fillStyle = GOLD_D; ctx.font = f(700, 21); ctx.fillText(k, 520, iy);
    ctx.fillStyle = INK; ctx.font = f(800, k.startsWith('국가') ? 38 : 29);
    const vl = wrap(ctx, v, 460, 2);
    vl.forEach((t, j) => ctx.fillText(t, 520, iy + 40 + j * 36));
    iy += 40 + (vl.length - 1) * 36;
    if (sub) {
      ctx.font = f(400, 22);
      const sl = wrap(ctx, sub, 460, 2);
      sl.forEach((t, j) => ctx.fillText(t, 520, iy + 34 + j * 30));
      iy += 34 + (sl.length - 1) * 30;
    }
    if (k !== '수호 카드') {
      ctx.strokeStyle = 'rgba(168,132,62,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(520, iy + 20); ctx.lineTo(984, iy + 20); ctx.stroke();
    }
    iy += 50;
  }

  // 한 줄 메시지
  ctx.textAlign = 'center';
  y = top + 400 + 62;
  if (message) {
    ctx.fillStyle = INK; ctx.font = f(700, 31);
    const ml = wrap(ctx, `“${message}”`, 860, 2);
    ml.forEach((t, i) => ctx.fillText(t, cx, y + i * 44));
    y += ml.length * 44 + 10;
  } else y += 10;

  // 증명 문구 · 날짜 · 이름 · 도장
  y = Math.min(Math.max(y + 24, 1020), 1066);
  ctx.fillStyle = INK; ctx.font = f(400, 28);
  ctx.fillText('위 별땅을 기념으로 분양하였음을 증명합니다.', cx, y);
  ctx.font = f(400, 26); ctx.fillText(dateText, cx, y + 46);
  // 이름과 도장을 한 묶음으로 가운데 정렬(이름 길이에 맞춤)
  ctx.font = f(800, 34);
  const nw = ctx.measureText(SITE_NAME).width, gap = 26, sw = 88, x0 = cx - (nw + gap + sw) / 2;
  ctx.textAlign = 'left'; ctx.fillText(SITE_NAME, x0, y + 112); ctx.textAlign = 'center';
  seal(ctx, x0 + nw + gap + sw / 2, y + 102);

  ctx.fillStyle = GOLD_D; ctx.font = f(400, 19);
  ctx.fillText('이 문서는 놀이용 기념 증서로, 실제 토지 소유권·등기·분양과 아무 관계가 없습니다.', cx, H - 92);
  ctx.fillText('위치는 국가지점번호 계산값이며, 그곳은 남의 땅일 수 있으니 찾아가지 마세요.', cx, H - 66);
}

/** 글꼴을 다 받은 뒤 그려서 PNG(Blob)로 */
export async function landDeedPng(opts) {
  const text = Object.values(opts).filter((v) => typeof v === 'string').join('') + `별땅문서${SITE_NAME}기념증서놀이용소재지국가지점번호계산값면적가로세로약평수호카드위을으로분양하였음증명합니다이문서는실제토지소유권등기과아무관계가없습니다치며그곳남의땅일수있니찾아가지마세요·“”…`;
  try {
    await Promise.all([400, 700, 800].map((w) => document.fonts.load(f(w, 30), text)));
  } catch { /* 글꼴을 못 받아도 기본 명조로 그린다 */ }
  const [W, H] = LAND_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  drawLandDeed(canvas.getContext('2d'), opts);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG를 만들지 못했어요'))), 'image/png'));
}
