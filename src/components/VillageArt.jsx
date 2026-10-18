// 귀땅 마을 그림(가상). 7×7 마름모 칸 중 내 팜만큼 가운데부터 채우고, 마지막 칸에 내 캐릭터 핀을 세운다.
// 사진이 아닌 단순한 그림이며 실제 지도·땅과 관계없다. 그림 색은 하늘·땅 그림이라 어두운 모드에서도 그대로 쓴다.
import { plotCells, MAX_DRAWN, GRID } from '../engine/village.js';

const CW = 20; // 칸 반너비
const CH = 10; // 칸 반높이
const OX = 180;
const OY = 104;
const cellXY = ({ col, row }) => ({ x: OX + (col - row) * CW, y: OY + (col + row) * CH });
const diamond = (x, y, s = 1) => `${x},${y - CH * s} ${x + CW * s},${y} ${x},${y + CH * s} ${x - CW * s},${y}`;

const CROPS = {
  field: [['#7fae5a', '#5e8f40'], ['#d8b65a', '#b8933a'], ['#9cc46c', '#6f9a45'], ['#c9d97a', '#9fb252']],
  sea: [['#8fbf7a', '#679a55'], ['#e4cf8f', '#c4a865'], ['#7bb3a8', '#4f8f84'], ['#b9d48a', '#8fae5f']],
};

function Crop({ x, y, i, theme }) {
  const [fill, line] = CROPS[theme].at(i % 4);
  return (
    <g>
      <polygon points={diamond(x, y, 0.92)} fill={fill} stroke={line} strokeWidth="1" />
      <path d={`M${x - 10} ${y - 1}l8 -4M${x - 4} ${y + 3}l10 -5M${x + 2} ${y + 6}l8 -4`} stroke={line} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

function Scenery({ theme }) {
  if (theme === 'sea') {
    return (
      <g>
        <rect width="360" height="300" fill="#d8ecf3" />
        <circle cx="300" cy="44" r="18" fill="#f6d77a" />
        <path d="M0 96 Q60 70 120 92 T240 88 T360 90 V300 H0Z" fill="#9fc9a0" />
        <path d="M0 210 Q90 196 180 214 T360 206 V300 H0Z" fill="#5f9fc4" />
        <path d="M20 236 q12 -6 24 0 t24 0M220 250 q12 -6 24 0 t24 0M120 268 q12 -6 24 0 t24 0" stroke="#e8f4fa" strokeWidth="2" fill="none" strokeLinecap="round" />
        <polygon points={`${OX},${OY - CH - 8} ${OX + CW * GRID + 8},${OY + CH * (GRID - 1)} ${OX},${OY + CH * (2 * GRID - 1) + 8} ${OX - CW * GRID - 8},${OY + CH * (GRID - 1)}`} fill="#efdcaa" stroke="#d9c182" />
        {/* 등대 */}
        <g transform="translate(316 132)">
          <rect x="-6" y="0" width="12" height="44" fill="#fffdf7" stroke="#b8532f" strokeWidth="1.5" />
          <rect x="-6" y="12" width="12" height="7" fill="#b8532f" />
          <rect x="-6" y="30" width="12" height="7" fill="#b8532f" />
          <path d="M-8 0 L0 -10 L8 0Z" fill="#1f2f55" />
        </g>
        {/* 고깃배 */}
        <g transform="translate(70 228)">
          <path d="M-18 0 H18 L12 9 H-12Z" fill="#b8532f" />
          <path d="M0 0 V-22 L14 -4Z" fill="#fffdf7" stroke="#1f2f55" strokeWidth="1" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <rect width="360" height="300" fill="#e6f0dc" />
      <circle cx="304" cy="42" r="18" fill="#f6d77a" />
      <path d="M0 92 Q50 52 110 84 Q170 50 236 82 Q300 56 360 80 V300 H0Z" fill="#a9c98b" />
      <path d="M0 120 Q80 100 160 118 T360 112 V300 H0Z" fill="#c5dca5" />
      {/* 개울 */}
      <path d="M0 250 Q60 230 90 262 T170 300 H130 Q100 276 70 282 T0 274Z" fill="#8ec3d6" />
      <polygon points={`${OX},${OY - CH - 8} ${OX + CW * GRID + 8},${OY + CH * (GRID - 1)} ${OX},${OY + CH * (2 * GRID - 1) + 8} ${OX - CW * GRID - 8},${OY + CH * (GRID - 1)}`} fill="#d9c79a" stroke="#bfa86f" />
      {/* 집 */}
      <g transform="translate(46 128)">
        <rect x="-16" y="0" width="32" height="20" fill="#fffdf7" stroke="#5b5f57" strokeWidth="1" />
        <path d="M-24 2 Q0 -18 24 2 Q0 -8 -24 2Z" fill="#1f2f55" />
        <rect x="-4" y="8" width="8" height="12" fill="#b8932a" />
      </g>
      {/* 나무 */}
      <g fill="#5e8f40"><circle cx="318" cy="150" r="12" /><circle cx="332" cy="162" r="10" /><circle cx="300" cy="230" r="11" /></g>
      <g fill="#7a5a3a"><rect x="316" y="160" width="4" height="12" /><rect x="298" y="239" width="4" height="10" /></g>
    </g>
  );
}

export function Pin({ id, x, y, scale = 1 }) {
  // 핀 끝(x, y)에서 위로 선 물방울 모양 + 캐릭터 얼굴
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 C-4 -8 -16 -16 -16 -28 A16 16 0 1 1 16 -28 C16 -16 4 -8 0 0Z" fill="#fffdf7" stroke="#1f2f55" strokeWidth="2.2" />
      {id === 'chick' && (
        <g>
          <circle cx="0" cy="-28" r="10" fill="#f2c94c" />
          <circle cx="-3.5" cy="-30" r="1.6" fill="#1f2a24" /><circle cx="3.5" cy="-30" r="1.6" fill="#1f2a24" />
          <path d="M-3 -26 L3 -26 L0 -22Z" fill="#e07b39" />
          <path d="M-2 -38 q2 -4 4 0" stroke="#e0a82e" strokeWidth="1.6" fill="none" />
        </g>
      )}
      {id === 'scarecrow' && (
        <g>
          <circle cx="0" cy="-27" r="8.5" fill="#f0d9a8" />
          <path d="M-15 -31 H15 L8 -35 Q0 -44 -8 -35Z" fill="#c9a24a" stroke="#8a6d25" strokeWidth="1" />
          <circle cx="-3" cy="-27" r="1.5" fill="#1f2a24" /><circle cx="3" cy="-27" r="1.5" fill="#1f2a24" />
          <path d="M-3 -23 q3 2 6 0" stroke="#1f2a24" strokeWidth="1.2" fill="none" />
        </g>
      )}
      {(id === 'sprout' || !id) && (
        <g>
          <path d="M0 -20 V-30" stroke="#3e6b48" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M0 -30 C-2 -38 -10 -40 -12 -36 C-10 -30 -4 -29 0 -30Z" fill="#6fae5a" />
          <path d="M0 -32 C2 -41 11 -43 13 -38 C11 -32 4 -31 0 -32Z" fill="#3e6b48" />
          <circle cx="-3" cy="-24" r="1.3" fill="#1f2a24" /><circle cx="3" cy="-24" r="1.3" fill="#1f2a24" />
        </g>
      )}
    </g>
  );
}

export default function VillageArt({ theme = 'field', farms = 0, pin = 'sprout', label, small = false }) {
  const owned = plotCells(farms);
  const all = plotCells(MAX_DRAWN);
  const last = owned.at(-1);
  return (
    <svg className={`village-art${small ? ' small' : ''}`} viewBox="0 0 360 300" role="img" aria-label={label}>
      <Scenery theme={theme} />
      {all.slice(owned.length).map((c) => {
        const { x, y } = cellXY(c);
        return <polygon key={`e${c.col}-${c.row}`} points={diamond(x, y, 0.92)} fill="#fffdf7" fillOpacity="0.35" stroke="#a08a55" strokeOpacity="0.5" strokeDasharray="3 3" />;
      })}
      {owned.map((c, i) => {
        const { x, y } = cellXY(c);
        return <Crop key={`o${c.col}-${c.row}`} x={x} y={y} i={i} theme={theme} />;
      })}
      {last && <Pin id={pin} {...cellXY(last)} />}
    </svg>
  );
}
