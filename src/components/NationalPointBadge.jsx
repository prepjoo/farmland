/**
 * 국가지점번호 배지 (보여 주기만). 행운·사랑·우정 화면의 번호는 '그 장소'의 계산값이라
 * 누르면 신고로 이어지는 기능을 두지 않는다 (사용자 결정 2026-10-12). 긴급 신고는 상단 [긴급 신고]에서만.
 */
export default function NationalPointBadge({ np, large = false }) {
  if (!np) return null;
  return (
    <span className={`np-badge${large ? ' large' : ''}`} title="국가지점번호 계산값">
      <span className="sr">국가지점번호 </span>
      <span className="np">{np.text}</span>
      <span className="tag">계산값</span>
    </span>
  );
}
