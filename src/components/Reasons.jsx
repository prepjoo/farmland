// ‘왜 이 번호와 장소인가요?’ — 실제로 쓴 규칙만 설명한다. 근거 없는 해석을 만들지 않는다.
import TarotArt from './TarotArt.jsx';
import { kDate } from '../lib/luck.js';

export default function Reasons({ date, game, card, place, saltStored }) {
  return (
    <div className="reasons">
      {card && (
        <div className="reason-card">
          <TarotArt n={card.n} name={card.name} size={64} />
          <div>
            <p className="muted tiny">오늘의 카드 (그날 전국이 같아요)</p>
            <p className="card-name">{card.n}번 {card.name}</p>
            <p className="tiny">{card.keywords.join(' · ')} — {card.tradition}</p>
            <p className="tiny muted">라이더-웨이트-스미스 정방향의 전통 의미를 요약했어요.</p>
          </div>
        </div>
      )}
      <h3>번호 이유</h3>
      <ol className="reason-list">
        <li>오늘 날짜({kDate(date)})와 이 휴대폰에만 있는 무작위 값으로 뽑았어요. 오늘 하루는 다시 와도 같은 번호예요.{!saltStored && ' (이 브라우저는 저장이 막혀 있어 창을 닫으면 번호가 바뀔 수 있어요.)'}</li>
        <li>이 조합({game.game})은 홀수 {game.odd} · 짝수 {game.even}, 합계 {game.sum}, 연속 번호 {game.hasConsecutive ? '있음' : '없음'}. 계산한 사실일 뿐 좋고 나쁨이 아니에요.</li>
        <li>모든 번호 조합의 1등 확률은 8,145,060분의 1로 같아요.</li>
      </ol>
      {place && place.mode !== 'unavailable' && (
        <>
          <h3>장소 이유</h3>
          <ol className="reason-list">
            {place.mode === 'base' ? (
              <>
                <li>오늘의 카드 {place.card}번의 행운 방향은 약 {Math.round(place.angle)}도, 16방위로 ‘{place.dirName}’이에요. 재미를 위한 규칙이에요.</li>
                <li>{place.fallback
                  ? `기준점에서 그 방향 60km 안에는 1등 판매점이 있는 시·군·구가 없어, 방향과 상관없이 가장 가까운 ${place.region.name}을(를) 골랐어요.`
                  : `기준점에서 그 방향 ${place.rangeKm}km 안에서 1등 판매점이 있는 가장 가까운 시·군·구가 ${place.region.name}(약 ${place.distanceKm}km)이에요.`}</li>
              </>
            ) : (
              <li>동네를 고르지 않아 ‘오늘의 전국 행운 장소’를 보여 드려요. 오늘 날짜로 시·도 → 시·군·구 → 가게를 차례로 골랐어요. 오늘은 전국 누구나 같은 장소예요.</li>
            )}
            <li>그 안의 1등 판매점 중 오늘 날짜로 한 곳을 골랐어요. ‘{place.store.name}’은(는) 최근 1년({place.basis.rounds?.[0]}~{place.basis.rounds?.[1]}회) 자동 1등이 {place.store.wins}회 나왔어요.</li>
            <li className="tiny muted">자료: {place.basis.source}. 수동 1등은 빠져 있어요.</li>
          </ol>
        </>
      )}
    </div>
  );
}
