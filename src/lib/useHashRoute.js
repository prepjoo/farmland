import { useEffect, useState } from 'react';

// 해시 라우팅: #/(메인), #/mine|us|mbti/<단계>, #/land, #/g?…(선물), #/archive, #/learn, #/sos
export function readRoute(hash = window.location.hash) {
  const path = hash.replace(/^#/, '') || '/';
  const [pathname] = path.split('?');
  return pathname;
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute());
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
