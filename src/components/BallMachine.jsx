// 행운 추첨기 연출 (docs/plan.md, 기획안 3장). 번호는 이미 계산되어 있고, 여기서는 보여 주기만 한다.
// 투명한 통 안에서 공이 섞이다가 하나씩 아래로 나온다. 공의 움직임은 연출용이라 Math.random을 써도 결과와 무관하다.
import { useEffect, useRef, useState } from 'react';
import Balls from './Balls.jsx';

const COLORS = ['#C9A24A', '#1F2F55', '#B8532F', '#6B7280', '#3E6B48'];
const colorOf = (n) => COLORS[Math.min(4, Math.floor(n / 10))];

export default function BallMachine({ drawn, interval = 900, play = true, onDone, label }) {
  const canvasRef = useRef(null);
  const [shown, setShown] = useState(play ? 0 : 6);
  const doneRef = useRef(false);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  // 공이 하나씩 나오는 시간표
  useEffect(() => {
    if (!play) { setShown(6); return undefined; }
    setShown(0);
    doneRef.current = false;
    const timers = drawn.map((_, i) => setTimeout(() => setShown(i + 1), interval * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [drawn, interval, play]);

  useEffect(() => {
    if (shown === 6 && !doneRef.current) {
      doneRef.current = true;
      const t = setTimeout(() => onDone?.(), play ? 400 : 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [shown, onDone, play]);

  // 통 안에서 섞이는 공 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !play) return undefined;
    const ctx = canvas.getContext('2d');
    const S = canvas.width, R = S / 2 - 6, C = S / 2, r = 9;
    const nums = Array.from({ length: 45 }, (_, i) => i + 1);
    const balls = nums.map((n) => {
      const a = Math.random() * Math.PI * 2, d = Math.random() * (R - r - 4);
      return { n, x: C + d * Math.cos(a), y: C + d * Math.sin(a), vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 };
    });
    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, S, S);
      ctx.beginPath(); ctx.arc(C, C, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#CBBF9F'; ctx.stroke();
      const gone = new Set(drawn.slice(0, shownRef.current));
      for (const b of balls) {
        if (gone.has(b.n)) continue;
        b.vy += 0.15; // 아래로 끌림 + 바람에 섞임
        b.vx += (Math.random() - 0.5) * 1.2; b.vy += (Math.random() - 0.5) * 1.2 - 0.12;
        b.x += b.vx; b.y += b.vy;
        const dx = b.x - C, dy = b.y - C, dist = Math.hypot(dx, dy);
        if (dist > R - r) {
          const nx = dx / dist, ny = dy / dist, dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
          b.vx *= 0.9; b.vy *= 0.9;
          b.x = C + nx * (R - r); b.y = C + ny * (R - r);
        }
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colorOf(b.n); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(C - R * 0.35, C - R * 0.45, R * 0.5, Math.PI * 1.1, Math.PI * 1.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.stroke();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [drawn, play]);

  return (
    <div className="machine">
      {play && shown < 6 && (
        <div className="drum-wrap" aria-hidden="true">
          <canvas ref={canvasRef} width="220" height="220" className="drum" />
          <div className="chute" />
        </div>
      )}
      <Balls numbers={shown === 6 ? [...drawn].sort((a, b) => a - b) : drawn} shown={shown} label={label} />
      <p className="sr" aria-live="polite">{shown === 6 ? `${label}: ${[...drawn].sort((a, b) => a - b).join(', ')}` : ''}</p>
    </div>
  );
}
