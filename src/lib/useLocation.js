// 지금 내 위치 찾기 (긴급 신고·내 위치 번호 화면에서만, 사용자가 버튼을 눌러 들어왔을 때만 쓴다)
// 위치는 화면에서만 쓰고 저장하거나 어디로도 보내지 않는다.
import { useEffect, useRef, useState } from 'react';
import { toNationalPoint } from '../engine/nationalPoint.js';

export const LOCATION_ERRORS = {
  1: '위치 권한이 꺼져 있어요. 휴대폰 설정에서 이 브라우저의 위치 접근을 허용한 뒤 다시 눌러 주세요.',
  2: '위치를 찾지 못했어요. 휴대폰의 위치(GPS)가 켜져 있는지 확인하고, 하늘이 보이는 곳에서 다시 눌러 주세요.',
  3: '위치를 찾는 데 시간이 오래 걸려요. 다시 눌러 주세요.',
};

/** 들어오자마자 위치를 찾기 시작한다. { state, locate, refining } */
export function useLocation() {
  const [state, setState] = useState({ status: 'idle' });
  const watchId = useRef(null);
  const [refining, setRefining] = useState(false);

  const stop = () => {
    if (watchId.current != null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
    setRefining(false);
  };

  function locate() {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: '이 브라우저에서는 위치를 찾을 수 없어요.' });
      return;
    }
    stop();
    setState((s) => ({ ...s, status: s.fix ? 'refining' : 'finding' }));
    const started = Date.now();
    setRefining(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        const np = toNationalPoint(lat, lon);
        setState({ status: 'found', fix: { lat, lon, accuracy, np: np?.text ?? null, at: new Date(pos.timestamp) } });
        // 충분히 정확해지거나 1분이 지나면 그만 찾는다 (배터리 아끼기)
        if (accuracy <= 15 || Date.now() - started > 60_000) stop();
      },
      (err) => {
        stop();
        setState((s) => ({ ...s, status: 'error', code: err.code, message: LOCATION_ERRORS[err.code] ?? LOCATION_ERRORS[2] }));
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  }

  useEffect(() => {
    locate();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, locate, refining };
}
