import { useState } from 'react';
import FlowIcon from '../components/FlowIcon.jsx';
import DailyLuck from '../components/DailyLuck.jsx';
import { FLOWS } from '../lib/flows.js';
import { SITE_NAME, HEADLINE, LEAD, MEANING, NP_SHORT } from '../lib/brand.js';
import { listLands, daysToNext } from '../lib/myLands.js';
import { dday } from '../engine/dday.js';
import { kstDateString } from '../engine/kstDate.js';
import { maskNationalPoint } from '../engine/landNumber.js';

/** 첫 화면: 별땅 소개 + 시작 버튼 + 기억하는 기념일 D-day */
export default function Home({ onOpen }) {
  const [lands] = useState(listLands);
  const today = kstDateString();
  const dated = lands.filter((x) => x.date);
  return (
    <div className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <h1 id="hero-title">{SITE_NAME}</h1>
          <p className="hero-head">{HEADLINE}</p>
          <p className="hero-meaning">{LEAD}</p>
        </div>
        <figure className="hero-deed">
          <img src={`${import.meta.env.BASE_URL}img/deed-sample.webp`} width="216" height="270" alt="별땅문서 예시: 상아색 종이에 ‘별땅문서’ 제목, 생일 축하 문장, 우리나라 지도 위 별, 국가지점번호와 붉은 기념 도장" />
          <figcaption>이런 별땅문서를 선물해요</figcaption>
        </figure>
      </section>

      <nav className="menu-grid three" aria-label="별땅 분양받기">
        {FLOWS.map((f) => (
          <a key={f.id} href={`#/${f.id}/1`} className={`menu-tile ${f.menu}`}>
            <span className="menu-name">{f.hook}</span>
            <span className="menu-desc">{f.desc}</span>
            <span className="menu-icon"><FlowIcon id={f.id} size={30} /></span>
          </a>
        ))}
      </nav>

      <DailyLuck />

      {dated.length > 0 && (
        <section className="card dday-list" aria-labelledby="dday-title">
          <h2 id="dday-title">기억하는 기념일</h2>
          <ul>
            {dated.map((x) => {
              const since = dday(x.date, today);
              const left = daysToNext(x.date, today);
              return (
                <li key={x.id}>
                  <button type="button" className="dday-item" onClick={() => onOpen(x)}>
                    <b>{x.label}</b>
                    <span>{left === 0 ? '오늘이에요!' : `D-${left}`}{since ? ` · D+${since.toLocaleString('ko-KR')}` : ''}</span>
                    <small>{x.place} · {x.masked ? maskNationalPoint(x.np) : x.np}</small>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="hint">이 기기에만 저장돼요. 지우려면 <a href="#/archive">보관함</a>에서 지울 수 있어요.</p>
        </section>
      )}

      <section className="how-steps" aria-labelledby="how-title">
        <h2 id="how-title">이렇게 해요</h2>
        <ol>
          <li><b>숫자 8자리 넣기</b><span>생일·기념일·전화번호·MBTI</span></li>
          <li><b>전국 후보 중 고르기</b><span>보통 별이 6~13개 떠요</span></li>
          <li><b>별땅문서로 선물하기</b><span>링크나 이미지로 보내요</span></li>
        </ol>
        <p className="np-note">{MEANING} ‘분양’은 놀이 표현이에요. 돈이 들지 않고, 실제 토지 소유권과 관계없는 기념 표시예요.</p>
        <p className="np-note">{NP_SHORT} <a href="#/learn">국가지점번호 더 알아보기</a></p>
      </section>
    </div>
  );
}
