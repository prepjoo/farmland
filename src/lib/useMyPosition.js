// 행운 장소까지 거리를 보려고 [내 위치에서 거리 보기]를 눌렀을 때만 한 번 위치를 찾는다.
// 위치는 이 화면의 메모리에서 거리 계산에만 쓰고, 저장하거나 어디로도 보내지 않는다(길찾기 링크에도 넣지 않음).
import { useState } from 'react';
import { LOCATION_ERRORS } from './useLocation.js';

export function useMyPosition() {
  const [state, setState] = useState({ status: 'idle', me: null });
  function locate() {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', me: null, message: '이 브라우저에서는 위치를 찾을 수 없어요.' });
      return;
    }
    setState((s) => ({ ...s, status: 'finding' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'found', me: { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
      (err) => setState({ status: 'error', me: null, message: LOCATION_ERRORS[err.code] ?? LOCATION_ERRORS[2] }),
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 60_000 },
    );
  }
  const forget = () => setState({ status: 'idle', me: null });
  return { ...state, locate, forget };
}
