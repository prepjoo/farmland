// 타로 메이저 22장 상징 그림 (이 사이트를 위해 새로 그린 단순한 상징. 특정 덱의 그림을 따라 그리지 않았다)
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

const star = (cx, cy, r, points = 5, inner = 0.45) => {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const rays = (cx, cy, r1, r2, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`;
  }).join('');
// 위쪽 반원에만 빛줄기 (해돋이)
const upRays = (cx, cy, r1, r2, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 1)) / (n + 1);
    return `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`;
  }).join('');
const heart = (x, y, s) => `M${x} ${y + s * 0.9}C${x - s * 1.4} ${y}, ${x - s * 0.7} ${y - s * 0.9}, ${x} ${y - s * 0.25}C${x + s * 0.7} ${y - s * 0.9}, ${x + s * 1.4} ${y}, ${x} ${y + s * 0.9}Z`;

const SYMBOLS = {
  0: (<g><path d="M50 128 C 30 110, 70 98, 50 82 S 46 64, 50 56" /><polygon points={star(50, 40, 9)} className="fill" /><circle cx="76" cy="30" r="4" /></g>),
  1: (<g><path d="M30 75 C 30 62, 46 62, 50 75 C 54 88, 70 88, 70 75 C 70 62, 54 62, 50 75 C 46 88, 30 88, 30 75 Z" /><path d="M50 30 L50 56" /><circle cx="50" cy="28" r="4" className="fill" /><path d="M36 112 H64" /></g>),
  2: (<g><rect x="20" y="42" width="10" height="72" /><rect x="70" y="42" width="10" height="72" /><path d="M54 60 A 18 18 0 1 0 54 96 A 13 13 0 1 1 54 60 Z" className="fill" /></g>),
  3: (<g><path d="M50 122 V 46" /><path d="M50 60 C 38 56, 34 46, 36 40 C 44 44, 48 50, 50 60 Z M50 60 C 62 56, 66 46, 64 40 C 56 44, 52 50, 50 60 Z M50 82 C 36 78, 32 66, 34 60 C 44 64, 48 72, 50 82 Z M50 82 C 64 78, 68 66, 66 60 C 56 64, 52 72, 50 82 Z" className="fill soft" /><path d={heart(50, 104, 8)} /></g>),
  4: (<g><path d="M30 62 L36 44 L44 56 L50 40 L56 56 L64 44 L70 62 Z" className="fill" /><rect x="32" y="72" width="36" height="40" /><path d="M32 86 H68" /></g>),
  5: (<g><path d="M50 62 C 40 56, 28 56, 22 60 V 104 C 28 100, 40 100, 50 106 C 60 100, 72 100, 78 104 V 60 C 72 56, 60 56, 50 62 Z" /><path d="M50 62 V 106" /><path d="M30 72 H42 M30 82 H42 M58 72 H70 M58 82 H70" /><polygon points={star(50, 40, 7)} className="fill" /></g>),
  6: (<g><path d={heart(42, 74, 14)} /><path d={heart(58, 74, 14)} className="fill soft" /><polygon points={star(50, 40, 6)} className="fill" /></g>),
  7: (<g><path d="M50 36 L66 60 H56 V 92 H44 V 60 H34 Z" className="fill soft" /><circle cx="34" cy="108" r="9" /><circle cx="66" cy="108" r="9" /><path d="M34 108 H66" /></g>),
  8: (<g><circle cx="50" cy="76" r="10" className="fill" /><path d={[0, 72, 144, 216, 288].map((d) => { const a = (d - 90) * Math.PI / 180; const x = 50 + 22 * Math.cos(a), y = 76 + 22 * Math.sin(a); return `M50 76 Q ${(50 + 28 * Math.cos(a - 0.5)).toFixed(1)} ${(76 + 28 * Math.sin(a - 0.5)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} Q ${(50 + 28 * Math.cos(a + 0.5)).toFixed(1)} ${(76 + 28 * Math.sin(a + 0.5)).toFixed(1)} 50 76`; }).join(' ')} /><path d="M50 104 V 124 M50 114 C 44 110, 40 112, 38 116 M50 118 C 56 114, 60 116, 62 120" /></g>),
  9: (<g><path d="M62 30 V 124" /><path d="M42 58 L52 52 L62 58 V 76 L52 82 L42 76 Z" /><polygon points={star(52, 67, 6, 6)} className="fill" /><path d="M52 52 V 44" /></g>),
  10: (<g><circle cx="50" cy="76" r="30" /><circle cx="50" cy="76" r="20" /><path d={rays(50, 76, 6, 30, 8)} /><circle cx="50" cy="76" r="5" className="fill" /></g>),
  11: (<g><path d="M50 36 V 116 M30 52 H70 M40 116 H60" /><path d="M30 52 L22 78 H38 Z M70 52 L62 78 H78 Z" /><circle cx="50" cy="34" r="4" className="fill" /></g>),
  12: (<g><path d="M24 40 H76 M50 40 V 54" /><path d="M50 54 L36 96 H64 Z" className="fill soft" /><circle cx="50" cy="108" r="10" /></g>),
  13: (<g><path d="M18 100 H82" /><path d="M32 100 A 18 18 0 0 1 68 100" className="fill" /><path d={upRays(50, 100, 24, 36, 7)} /><path d="M30 112 H70 M40 122 H60" /></g>),
  14: (<g><path d="M24 58 H42 L38 82 H28 Z M58 86 H76 L72 110 H62 Z" /><path d="M40 60 C 56 62, 58 72, 64 86" strokeDasharray="3 3" /><polygon points={star(50, 40, 5, 4, 0.4)} className="fill" /></g>),
  15: (<g><circle cx="40" cy="78" r="14" /><circle cx="60" cy="78" r="14" /><path d="M50 50 C 42 40, 50 34, 50 26 C 54 34, 60 38, 50 50 Z" className="fill" /></g>),
  16: (<g><path d="M38 126 V 66 H62 V 126 M38 66 V 58 H43 V 63 H48 V 58 H52 V 63 H57 V 58 H62 V 66" /><path d="M46 90 H54 V 102 H46 Z" /><path d="M70 32 L58 52 H67 L56 74" className="bolt" /></g>),
  17: (<g><polygon points={star(50, 66, 24, 8, 0.38)} className="fill" /><polygon points={star(26, 36, 5, 4, 0.4)} className="fill" /><polygon points={star(76, 40, 4, 4, 0.4)} className="fill" /><polygon points={star(24, 106, 4, 4, 0.4)} className="fill" /><polygon points={star(78, 104, 5, 4, 0.4)} className="fill" /><path d="M30 122 C 40 116, 60 116, 70 122" /></g>),
  18: (<g><path d="M60 40 A 26 26 0 1 0 60 92 A 20 20 0 1 1 60 40 Z" className="fill" /><path d="M20 108 C 30 102, 40 114, 50 108 S 70 102, 80 108 M20 120 C 30 114, 40 126, 50 120 S 70 114, 80 120" /></g>),
  19: (<g><circle cx="50" cy="72" r="16" className="fill" /><path d={rays(50, 72, 22, 34, 12)} /><path d="M24 118 H76" /></g>),
  20: (<g><path d="M26 98 L56 68 L64 76 L34 106 Z" className="fill soft" /><path d="M56 68 L66 52 L80 66 L64 76" /><path d="M74 44 C 80 46, 84 52, 86 58 M72 36 C 80 36, 88 44, 90 54" /><path d="M24 120 H60" /></g>),
  21: (<g><ellipse cx="50" cy="78" rx="24" ry="34" /><path d={Array.from({ length: 12 }, (_, i) => { const a = (Math.PI * 2 * i) / 12; const x = 50 + 24 * Math.cos(a), y = 78 + 34 * Math.sin(a); return `M${x.toFixed(1)} ${y.toFixed(1)} l ${(4 * Math.cos(a + 1.2)).toFixed(1)} ${(4 * Math.sin(a + 1.2)).toFixed(1)}`; }).join(' ')} /><polygon points={star(50, 78, 9)} className="fill" /></g>),
};

export default function TarotArt({ n, name, size = 60 }) {
  return (
    <svg className="tarot-art" width={size} height={size * 1.5} viewBox="0 0 100 150" role="img" aria-label={`${n}번 ${name ?? ''} 카드 그림`}>
      <defs>
        <linearGradient id={`tg${n}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#3b2a8a" />
          <stop offset="1" stopColor="#1e1640" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="146" rx="10" fill={`url(#tg${n})`} />
      <rect x="7" y="7" width="86" height="136" rx="7" className="frame" />
      <text x="50" y="22" textAnchor="middle" className="roman">{ROMAN[n]}</text>
      <g className="sym">{SYMBOLS[n]}</g>
    </svg>
  );
}
