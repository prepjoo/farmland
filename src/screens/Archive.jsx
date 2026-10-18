import { useState } from 'react';
import { listLands, removeLand, clearLands } from '../lib/myLands.js';
import { maskNationalPoint } from '../engine/landNumber.js';
import { LAND_NAME, CTA } from '../lib/brand.js';

/** 보관함: 이 기기에만 저장된 내 별땅·받은 별땅 */
export default function Archive({ onOpen }) {
  const [items, setItems] = useState(listLands);
  const del = (id) => {
    removeLand(id);
    setItems(listLands());
  };
  const clearAll = () => {
    clearLands();
    setItems([]);
  };
  return (
    <section className="result">
      <h1>보관함</h1>
      <p className="lead">저장한 {LAND_NAME}이에요. 이 기기에만 저장되고 서버로 보내지 않아요. 브라우저 기록을 지우면 함께 지워져요.</p>
      {items.length === 0 ? (
        <article className="card">
          <p>아직 저장한 {LAND_NAME}이 없어요.</p>
          <a className="btn" href="#/mine/1">{CTA}</a>
        </article>
      ) : (
        <>
          <ul className="archive-list">
            {items.map((it) => (
              <li key={it.id} className="card">
                <span className="eyebrow">{it.label}{it.date ? ' · 기념일 기억 중' : ''}</span>
                <b>{it.place}</b>
                <span className="np-badge"><span className="np">{it.masked ? maskNationalPoint(it.np) : it.np}</span><span className="tag">계산값</span></span>
                <div className="links">
                  <button type="button" className="btn" onClick={() => onOpen(it)}>다시 보기</button>
                  <button type="button" className="btn" onClick={() => del(it.id)} aria-label={`${it.place} 삭제`}>삭제</button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="linkish" onClick={clearAll}>모두 지우기</button>
        </>
      )}
    </section>
  );
}
