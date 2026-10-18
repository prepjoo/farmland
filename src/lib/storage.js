// 이 기기 브라우저 저장소. 막혀 있거나 실패하면 조용히 넘어간다(사생활 모드 등).
const PREFIX = 'starland:';

export function load(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function remove(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* 무시 */
  }
}
