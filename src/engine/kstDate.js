// 한국 시간(UTC+9, 서머타임 없음) 날짜를 'YYYY-MM-DD'로
export function kstDateString(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
