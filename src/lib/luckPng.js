// 행운 카드 공유 이미지 (1080×1350). 브라우저 안에서 캔버스로 그려 PNG로 만들고 서버로 보내지 않는다.
// 날짜·번호·장소·자료 기준·오락용 문구를 함께 넣어, 퍼져도 언제 어떤 기준의 결과인지 알 수 있게 한다.
import { SITE_NAME } from './brand.js';

export const CARD_SIZE = [1080, 1350];
const SANS = "'Gothic A1','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const SERIF = "'Nanum Myeongjo','Noto Serif KR',serif";
const PAPER = '#FBF6EA', INK = '#1F2A24', NAVY = '#1F2F55', GOLD = '#C9A24A', MUTED = '#5b5f57';
const BALL = ['#C9A24A', '#1F2F55', '#B8532F', '#6B7280', '#3E6B48'];

function drawBall(ctx, x, y, r, n) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = BALL[Math.min(4, Math.floor(n / 10))]; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.fillStyle = n < 10 ? INK : '#ffffff';
  ctx.font = `800 ${Math.round(r * 0.95)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y + 2);
}

export function drawLuckCard(ctx, { dateText, game, numbers, placeLine, placeSub, cardLine, basisLine, siteText }) {
  const [W, H] = CARD_SIZE;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = NAVY; ctx.lineWidth = 3; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = NAVY; ctx.font = `800 64px ${SERIF}`; ctx.fillText(`${SITE_NAME} · 오늘의 행운`, W / 2, 170);
  ctx.fillStyle = MUTED; ctx.font = `600 34px ${SANS}`; ctx.fillText(`${dateText} · 행운번호 ${game}`, W / 2, 232);
  const r = 62, gap = 22, total = numbers.length * 2 * r + (numbers.length - 1) * gap;
  numbers.forEach((n, i) => drawBall(ctx, (W - total) / 2 + r + i * (2 * r + gap), 360, r, n));
  ctx.fillStyle = INK; ctx.font = `600 32px ${SANS}`; ctx.fillText('오늘의 행운 장소', W / 2, 520);
  ctx.font = `800 48px ${SANS}`; ctx.fillText(placeLine, W / 2, 586);
  ctx.fillStyle = MUTED; ctx.font = `500 30px ${SANS}`; ctx.fillText(placeSub, W / 2, 634);
  ctx.fillStyle = NAVY; ctx.font = `700 40px ${SERIF}`; ctx.fillText(cardLine, W / 2, 760);
  ctx.fillStyle = MUTED; ctx.font = `500 26px ${SANS}`;
  ctx.fillText(basisLine, W / 2, 1060);
  ctx.fillText('모든 번호 조합의 1등 확률은 같습니다(8,145,060분의 1).', W / 2, 1104);
  ctx.fillText('오락용이며 당첨과 관계없습니다. 복권 운영사와 관계없는 사이트입니다.', W / 2, 1144);
  ctx.fillStyle = NAVY; ctx.font = `700 30px ${SANS}`; ctx.fillText(siteText, W / 2, 1230);
}

/** 글꼴을 받은 뒤 그려서 PNG(Blob)로 */
export async function luckCardPng(opts) {
  try {
    const text = Object.values(opts).join('') + '귀땅오늘의행운번호장소모든조합등확률같습니다오락용당첨관계없복권운영사사이트';
    await Promise.all([document.fonts.load(`800 40px ${SERIF}`, text), document.fonts.load(`700 40px ${SANS}`, text)]);
  } catch { /* 글꼴을 못 받아도 기본 글꼴로 그린다 */ }
  const [W, H] = CARD_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  drawLuckCard(canvas.getContext('2d'), opts);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/png'));
}
