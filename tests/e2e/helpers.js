import { expect } from '@playwright/test';
// 화면 테스트 공통 도구
export const FIXED_TIME = new Date('2026-10-12T05:00:00Z'); // 한국 시간 14시 (월요일, 1194회 주간)

/** 지도 그림(외부 서버)은 테스트에서 막고, 시간을 고정한다 */
export async function prepare(page) {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await page.clock.setFixedTime(FIXED_TIME);
}

/** 지금 화면의 입력 단계에서 방식을 고르고 값을 넣어 후보 목록까지 */
export async function enterMeaning(page, { method = 'phone', value = '010-5796-0488' } = {}) {
  if (method === 'phone') {
    await page.getByRole('radio', { name: '전화번호' }).click();
    await page.getByLabel('전화번호').fill(value);
  } else if (method === 'mbti') {
    await page.getByRole('radio', { name: 'MBTI' }).click();
    await page.getByLabel('MBTI').selectOption(value);
  } else {
    const [y, m, d] = value.split('-').map(Number);
    await page.getByLabel('생년월일 연대').selectOption(String(Math.floor(y / 10) * 10));
    await page.getByLabel('생년월일 년').selectOption(String(y));
    await page.getByLabel('생년월일 월').selectOption(String(m));
    await page.getByLabel('생년월일 일').selectOption(String(d));
  }
  await page.getByRole('button', { name: '맞는 지역 보기' }).click();
  await expect(page.locator('.cand-list button').first()).toBeVisible();
}

/** 후보 중 하나 고르기 */
export async function chooseCandidate(page, index = 0) {
  await page.locator('.cand-list button').nth(index).click();
  await expect(page.locator('.chosen-bar')).toBeVisible();
}

/** 이번 주: 19세 확인 → 입력 → 후보 고르기 → 번호 6개 */
export async function openWeek(page, opts = {}) {
  await prepare(page);
  await page.goto('/#/week');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await enterMeaning(page, opts);
  await chooseCandidate(page, opts.index ?? 0);
  await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
}

/** 오늘: 입력 → 후보 고르기 */
export async function openToday(page, opts = {}) {
  await prepare(page);
  await page.goto('/#/today');
  await enterMeaning(page, opts);
  await chooseCandidate(page, opts.index ?? 0);
}
