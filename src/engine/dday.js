// 기념일 D+ 계산. 시작일을 1일째로 센다. 날짜는 'YYYY-MM-DD'
const toDays = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};

export function dday(start, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(today ?? '')) return null;
  const diff = toDays(today) - toDays(start);
  return diff < 0 ? null : diff + 1;
}
