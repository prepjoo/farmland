// 메인: 여기 · 행복 · 행운 카드 3개 (2026-10-19 사용자 시안). 카드마다 바로가기 단추와 할 수 있는 일 목록.
import { HEADLINE, LEAD } from '../lib/brand.js';

const CARDS = [
  {
    id: 'here', title: '여기',
    links: [['여긴 어디?', '#/here'], ['긴급 신고', '#/sos']],
    items: ['국가지점으로 현재 위치 알아보기', '현재 위치(국가지점)로 긴급 문자나 전화로 신고하기'],
  },
  {
    id: 'happy', title: '행복',
    links: [['행복위치', '#/happy/pos'], ['행복메시지', '#/happy/message'], ['추천장소', '#/happy/place']],
    items: ['생일·전화번호·MBTI로 의미 있는 위치 찾기', '타로·주역·점성술로 오늘의 운세와 조언 받기', '두 사람 만남 별자리로 만남 장소(3곳) 추천'],
  },
  {
    id: 'luck', title: '행운',
    links: [['행운위치', '#/luck/pos'], ['행운번호', '#/luck/number'], ['행운장소', '#/luck/place']],
    items: ['(선택) 국가지점으로 현재 위치 찾기', '(선택) 의미(생일·전화번호·MBTI)로 행운위치 찾기', '행운의 번호(6개) 추천', '행운의 장소(3곳, 1등 나온 판매점) 추천'],
    note: '만 19세 이상',
  },
];

export default function Home() {
  return (
    <div className="home">
      <h1>{HEADLINE}</h1>
      <p className="lead">{LEAD}</p>
      <div className="home-cards">
        {CARDS.map((c) => (
          <section key={c.id} className={`home-card ${c.id}`} aria-labelledby={`hc-${c.id}`}>
            <h2 id={`hc-${c.id}`} className="home-pill">{c.title}</h2>
            <nav className="home-links" aria-label={`${c.title} 바로가기`}>
              {c.links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
            <ul className="home-items">
              {c.items.map((t) => <li key={t} className={t.startsWith('(선택)') ? 'is-opt' : undefined}>{t}</li>)}
            </ul>
            {c.note && <p className="tiny muted">{c.note}</p>}
          </section>
        ))}
      </div>
      <p className="tiny muted home-privacy">🔒 생일·전화번호·MBTI와 위치는 이 기기 안에서만 계산하고 저장하거나 보내지 않아요.</p>
    </div>
  );
}
