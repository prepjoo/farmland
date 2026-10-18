// 주메뉴 아이콘: 내 별땅(별 하나) · 우리 별땅(별 두 개) · MBTI 별땅(네 칸 + 별)
export default function FlowIcon({ id, size = 24 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round' };
  if (id === 'us')
    return (
      <svg {...p}>
        <path d="M8 4.5l1.6 3.3 3.6.4-2.7 2.5.7 3.6L8 12.5l-3.2 1.8.7-3.6L2.8 8.2l3.6-.4z" />
        <path d="M16.5 9.5l1.4 2.9 3.1.4-2.3 2.1.6 3.1-2.8-1.6-2.8 1.6.6-3.1-2.3-2.1 3.1-.4z" />
      </svg>
    );
  if (id === 'mbti')
    return (
      <svg {...p}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        <path d="M17.25 13.6l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.3-2.3 1.3.5-2.5-1.8-1.7 2.5-.3z" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.3 1.2 6.3L12 16.9 6.3 20l1.2-6.3L2.9 9.4l6.3-.8z" />
    </svg>
  );
}
