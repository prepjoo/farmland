// 행운 장소로 가는 길: [내 위치에서 거리 보기] 버튼과 장소별 [길찾기] 링크(카카오맵, 새 창).
import { fromMeText } from '../engine/route.js';

export function MyLocationBar({ pos }) {
  return (
    <div className="from-me" aria-live="polite">
      {pos.status !== 'found' && (
        <button type="button" className="ghost small" onClick={pos.locate} disabled={pos.status === 'finding'}>
          {pos.status === 'finding' ? '위치 찾는 중…' : '내 위치에서 거리 보기'}
        </button>
      )}
      {pos.status === 'found' && (
        <p className="tiny">
          내 위치에서 잰 직선거리를 함께 보여 드려요{pos.me.accuracy > 100 ? ` (오차 약 ${Math.round(pos.me.accuracy)}m)` : ''}.{' '}
          <button type="button" className="link-btn" onClick={pos.forget}>내 위치 지우기</button>
        </p>
      )}
      {pos.status === 'error' && <p className="tiny warn-soft" role="alert">{pos.message}</p>}
      {pos.status === 'idle' && <p className="tiny muted">누를 때만 위치를 찾아요. 거리 계산에만 쓰고 저장하거나 보내지 않아요.</p>}
    </div>
  );
}

export function FromMe({ km }) {
  if (km == null) return null;
  return <span className="from-me-km">{fromMeText(km)}</span>;
}

export function RouteLink({ href, name, search = false }) {
  if (!href) return null;
  return (
    <a className="route-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} ${search ? '카카오맵에서 찾기' : '길찾기'} (카카오맵, 새 창)`}>
      {search ? '카카오맵에서 찾기' : '길찾기'}
    </a>
  );
}

export const ROUTE_NOTE = '길찾기를 누르면 카카오맵이 새 창으로 열리고, 그 장소의 이름과 위치가 카카오맵에 전달돼요. 내 위치는 귀땅이 보내지 않고, 출발지는 카카오맵에서 정해요. 실제 길은 직선거리보다 멀 수 있어요.';
