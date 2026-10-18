// 첫 화면: 주요 기능 두 개(오늘 · 이번 주)를 크게 (2026-10-18 구조 변경)
import { HEADLINE, LEAD } from '../lib/brand.js';

export default function Home() {
  return (
    <div className="home">
      <h1>{HEADLINE}</h1>
      <p className="lead">{LEAD}</p>
      <div className="feature-grid">
        <a href="#/today" className="feature today-card">
          <span className="feature-tag">오늘</span>
          <strong>오늘의 행운 카드와 행운 장소</strong>
          <span>타로나 주역으로 오늘의 카드를 뽑고, 고른 곳 주변의 볼 만한 곳 3곳을 추천해요.</span>
          <span className="feature-go">오늘의 행운 보기 →</span>
        </a>
        <a href="#/week" className="feature week-card">
          <span className="feature-tag">이번 주</span>
          <strong>이번 주 행운번호와 행운 장소</strong>
          <span>추첨기로 이번 주 행운번호를 뽑고, 고른 곳 주변의 1등 나온 판매점 3곳을 보여 드려요.</span>
          <span className="feature-go">이번 주 행운 보기 →</span>
        </a>
      </div>
      <ol className="how">
        <li>생년월일·전화번호·MBTI 중 하나를 넣어요 <span className="muted">(이 기기 안에서만 계산)</span></li>
        <li>그 숫자가 국가지점번호로 들어 있는 전국 9~12곳 중 한 곳을 골라요</li>
        <li>그곳을 중심으로 오늘·이번 주의 행운을 봐요</li>
      </ol>
    </div>
  );
}
