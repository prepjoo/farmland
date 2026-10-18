// ‘내 귀땅 마을’(가상 마을) — 1단계 뒤쪽에서 가볍게 만든다(그림 2종, 미션 2가지, docs/plan.md).
// 1팜은 그림 속 가상 칸(100㎡ 상징)이며 실제 땅·소유가 아니다.
export default function Village() {
  return (
    <div className="village">
      <h1>내 귀땅 마을</h1>
      <p className="lead">오늘의 행운을 보러 올 때마다 그림 속 내 마을 땅이 한 칸(1팜)씩 넓어지는 곳이에요.</p>
      <div className="soon-box">
        <p><strong>준비 중이에요.</strong> 곧 그림 마을과 내 캐릭터 핀, 오늘의 미션이 생겨요.</p>
        <p className="tiny muted">1팜은 그림 속 가상 칸으로 100㎡(약 30평)를 상징해요. 실제 땅이나 소유와는 관계없어요.</p>
      </div>
    </div>
  );
}
