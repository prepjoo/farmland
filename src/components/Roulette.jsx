// 회전판 연출(타로 22칸 · 주역 64칸 · 점성술 12칸). 결과(target)는 미리 계산되어 있고, 버튼을 누르면(go) 돌다가 그 칸에서 멈춘다.
// 누르기 전에는 멈춰 있고 결과를 드러내지 않는다. ‘동작 줄이기’면 돌지 않고 바로 그 칸을 보여 준다.
import { useEffect, useState } from 'react';

export default function Roulette({ labels, target, go = false, reduced = false, duration = 3800, onDone, caption, dense = false }) {
  const n = labels.length;
  const step = 360 / n;
  // 칸 i는 시계 방향 i*step 위치에 있다. target 칸을 맨 위(0도)로 오게 하려면 원판을 -target*step 돌린다.
  const final = 360 * 5 - target * step;
  const [angle, setAngle] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    setStopped(false);
    if (!go) { setAngle(0); return undefined; }
    if (reduced) { setAngle(final); setStopped(true); onDone?.(); return undefined; }
    setAngle(0);
    const t1 = setTimeout(() => setAngle(final), 50);
    const t2 = setTimeout(() => { setStopped(true); onDone?.(); }, duration + 150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, target, n, reduced]);

  const C = 110, R = 100;
  const pt = (deg, r) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)];
  return (
    <figure className={`roulette${dense ? ' dense' : ''}`}>
      <svg viewBox="0 0 220 236" role="img" aria-label={caption}>
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C + 16}px`, transition: go && !reduced ? `transform ${duration}ms cubic-bezier(.12,.7,.15,1)` : 'none' }}>
          <g transform="translate(0 16)">
            {labels.map((label, i) => {
              const a0 = i * step - step / 2, a1 = i * step + step / 2;
              const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
              const [tx, ty] = pt(i * step, R - (dense ? 10 : 16));
              const on = stopped && i === target;
              return (
                <g key={i}>
                  <path d={`M${C} ${C} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`} className={on ? 'slice on' : i % 2 ? 'slice alt' : 'slice'} />
                  <text x={tx} y={ty + (dense ? 2 : 4)} textAnchor="middle" className="slice-label" transform={`rotate(${i * step} ${tx} ${ty})`}>{label}</text>
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
