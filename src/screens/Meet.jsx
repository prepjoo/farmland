// ‘우리 어디?’: 두 사람 만남 장소 3곳 (행복 ‘추천장소’와 같은 부품)
import MeetPlaces from '../components/MeetPlaces.jsx';

export default function Meet() {
  return (
    <div className="luck-page sub-page">
      <h1>우리 어디?</h1>
      <p className="lead">나는 지금 있는 곳, 상대는 있는 동네를 고르면 두 사람이 비슷하게 갈 수 있는 만남 장소 3곳을 추천해요.</p>
      <section className="sub-panel" aria-labelledby="meet-only-h">
        <h2 id="meet-only-h" className="sub-label">만남 장소</h2>
        <MeetPlaces idPrefix="meet" />
      </section>
    </div>
  );
}
