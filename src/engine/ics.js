// 휴대폰 달력에 넣을 일정 파일(.ics). 해마다 돌아오는 하루 종일 일정. 이 기기에서 바로 내려받는다(서버 없음).
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** title: 일정 이름, date: 'YYYY-MM-DD', url: 사이트 주소, now: 만든 시각(Date) */
export function buildIcs({ title, date, url, description = '', now = new Date() }) {
  const ymd = date.replaceAll('-', '');
  const desc = [description, url].filter(Boolean).join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//starland//byeolttang//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:byeolttang-${ymd}-${encodeURIComponent(title).slice(0, 40)}@starland`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${ymd}`,
    'RRULE:FREQ=YEARLY',
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(desc)}`,
    ...(url ? [`URL:${url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
