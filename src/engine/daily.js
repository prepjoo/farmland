// 오늘의 행운 (첫 화면): 하루 동안 같은 카드와 행운의 번호. 한국 날짜가 바뀌면 새로 뽑는다.
// 씨앗값 = SHA-256('v5-daily' | 날짜 | 기기 값). 기기 값은 이 기기에만 저장한 무작위 글자라 사람마다 다르게 나온다.
// 행운의 번호는 오락용이며 어떤 당첨 확률과도 관계없다(로또 기능은 만들지 않는다, CLAUDE.md 9번).
import { makeSeed, createRng } from './seed.js';

export async function dailyLuck({ date, salt }) {
  const rng = createRng(await makeSeed(['v5-daily', date, salt].join('|')));
  const card = Math.floor(rng() * 22);
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { card, numbers: pool.slice(0, 3).sort((a, b) => a - b) };
}
