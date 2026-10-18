// 별땅문서의 헌사 한 문장 (분양 사유 대신). kind·label은 내 별땅 화면의 값과 같다.
const END = '이 작은 땅에 별 하나를 새깁니다.';

export function dedication({ kind, label = '' }) {
  if (kind === 'birthday') {
    const who = label.replace(/\s*생일$/, '').trim();
    return !who || who === '내' ? `당신의 빛나는 탄생을 축하하며, ${END}` : `${who}의 소중한 탄생을 축하하며, ${END}`;
  }
  if (kind === 'anniv') {
    if (label === '첫 만난 날') return `두 사람이 처음 만난 그날을 기념하며, ${END}`;
    if (label === '결혼기념일') return `함께 걸어온 날들을 기념하며, ${END}`;
    if (label === '사귄 날') return `서로의 사람이 된 그날을 기념하며, ${END}`;
    if (label === '아이 생일') return `우리 아이의 소중한 탄생을 축하하며, ${END}`;
    return `‘${label || '우리의 날'}’을 기념하며, ${END}`;
  }
  if (kind === 'mbti') return `서로 다른 두 사람이 만나 하나의 별을 이룬 것을 기념하며, ${END}`;
  if (kind === 'phone') return `언제나 닿아 있는 번호에 마음을 담아, ${END}`;
  if (kind === 'number') return `나만의 의미 있는 숫자에 마음을 담아, ${END}`;
  return `소중한 마음을 담아, ${END}`;
}
