// 긁는 카드: 은박을 손가락(또는 마우스)으로 긁으면 아래 내용이 보인다. [바로 보기]로도 열 수 있다.
import { useEffect, useRef, useState } from 'react';

export default function ScratchCard({ children, hint = '긁어서 ‘왜?’ 보기', onReveal }) {
  const canvasRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || open) return undefined;
    const box = c.parentElement.getBoundingClientRect();
    c.width = Math.max(1, Math.round(box.width));
    c.height = Math.max(1, Math.round(box.height));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#C9CCD1';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#DADDE1'; ctx.lineWidth = 3;
    for (let x = -c.height; x < c.width; x += 24) { ctx.beginPath(); ctx.moveTo(x, c.height); ctx.lineTo(x + c.height, 0); ctx.stroke(); }
    ctx.fillStyle = '#1F2A24'; ctx.font = '600 17px "Gothic A1", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(hint, c.width / 2, c.height / 2 + 6);
    ctx.globalCompositeOperation = 'destination-out';
    let down = false, moves = 0;
    const scratch = (e) => {
      if (!down) return;
      const r = c.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * c.width, y = ((e.clientY - r.top) / r.height) * c.height;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      moves += 1;
      if (moves % 12 === 0) {
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        let clear = 0;
        for (let i = 3; i < data.length; i += 4 * 16) if (data[i] === 0) clear += 1;
        if (clear / (data.length / (4 * 16)) > 0.45) reveal();
      }
    };
    const start = (e) => { down = true; c.setPointerCapture?.(e.pointerId); scratch(e); };
    const end = () => { down = false; };
    c.addEventListener('pointerdown', start);
    c.addEventListener('pointermove', scratch);
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    return () => {
      c.removeEventListener('pointerdown', start);
      c.removeEventListener('pointermove', scratch);
      c.removeEventListener('pointerup', end);
      c.removeEventListener('pointercancel', end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reveal() {
    setOpen(true);
    onReveal?.();
  }

  return (
    <div className={`scratch${open ? ' open' : ''}`}>
      <div className="scratch-body" aria-hidden={!open}>{children}</div>
      {!open && (
        <>
          <canvas ref={canvasRef} className="scratch-foil" aria-hidden="true" />
          <button type="button" className="scratch-now" onClick={reveal}>바로 보기</button>
        </>
      )}
    </div>
  );
}
