// 씨앗값과 결정적 난수
// 씨앗값 = SHA-256(규칙 버전 | 지역 코드 | MBTI | 숫자 4자리 | 한국 날짜)
// 같은 씨앗값이면 브라우저·기기와 상관없이 같은 난수 순서가 나온다.

export function seedText({ ruleVersion, regionCode, mbti, digits, date }) {
  return [ruleVersion, regionCode, mbti, digits, date].join('|');
}

/** 씨앗값 32바이트 (Uint8Array). Web Crypto 사용 → 브라우저 밖으로 나가지 않음 */
export async function makeSeed(parts) {
  const data = new TextEncoder().encode(typeof parts === 'string' ? parts : seedText(parts));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

/** 씨앗값 → 0 이상 1 미만 난수를 차례로 내는 함수 (sfc32) */
export function createRng(seedBytes) {
  const view = new DataView(seedBytes.buffer, seedBytes.byteOffset, seedBytes.byteLength);
  let a = view.getUint32(0), b = view.getUint32(4), c = view.getUint32(8), d = view.getUint32(12);
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const r = (t + d) | 0;
    c = (c + r) | 0;
    return (r >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next(); // 처음 몇 개는 버려 고르게 섞는다
  return next;
}
