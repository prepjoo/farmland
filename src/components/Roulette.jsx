// 행운 룰렛 연출. 칸(labels) 중 target 칸이 맨 위 화살표 아래에 멈춘다. 결과는 미리 계산되어 있다.
// 22칸 카드 룰렛이면 칸의 각도가 곧 그 카드의 행운 방향(0번 정북, 시계 방향)이다.
import { useEffect, useState } from 'react';

export default function Roulette({ labels, target, play = true, duration = 3800, onDone, caption, highlight }) {
  const n = labels.length;
  const step = 360 / n;
  // 칸 i는 시계 방향 i*step 위치에 있다. target 칸을 맨 위(0도)로 오게 하려면 원판을 -target*step 돌린다.
  const final = 360 * 5 - target * step;
  const [angle, setAngle] = useState(play ? 0 : final);

  useEffect(() => {
    if (!play) { setAngle(final); onDone?.(); return undefined; }
    setAngle(0);
    const t1 = setTimeout(() => setAngle(final), 50);
    const t2 = setTimeout(() => onDone?.(), duration + 150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, n, play]);

  const C = 110, R = 100;
  const pt = (deg, r) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];
  return (
    <figure className="roulette">
      <svg viewBox="0 0 220 236" role="img" aria-label={caption}>
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C + 16}px`, transition: play ? `transform ${duration}ms cubic-bezier(.12,.7,.15,1)` : 'none' }}>
          <g transform="translate(0 16)">
            {labels.map((label, i) => {
              const a0 = i * step - step / 2, a1 = i * step + step / 2;
              const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
              const [tx, ty] = pt(i * step, R - 16);
              const on = i === target && highlight;
              return (
                <g key={i}>
                  <path d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} className={on ? 'slice on' : i % 2 ? 'slice alt' : 'slice'} />
                  <text x={tx} y={ty + 4} textAnchor="middle" className="slice-label" transform={`rotate(${i * step} ${tx} ${ty})`}>{label}</text>
                </g>
              );
            })}
            <circle cx={C} cy={C} r="18" className="hub" />
          </g>
        </g>
        <polygon points={`${C - 9},2 ${C + 9},2 ${C},20`} className="pointer" />
      </svg>
      {caption && <figcaption className="sr">{caption}</figcaption>}
    </figure>
  );
}
