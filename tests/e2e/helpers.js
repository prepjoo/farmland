import { expect } from '@playwright/test';
// 화면 테스트 공통 도구
export const FIXED_TIME = new Date('2026-10-12T05:00:00Z'); // 한국 시간 14시

/** 지도 그림(외부 서버)은 테스트에서 막고, 시간을 고정한다 */
export async function prepare(page) {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await page.clock.setFixedTime(FIXED_TIME);
}

/** 첫 화면을 열고 [오늘의 행운번호 받기] → 19세 확인(adult)까지. 결과 화면이 뜰 때까지 기다린다(동작 줄이기 상태에서). */
export async function openToday(page, { adult = true } = {}) {
  await prepare(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: '오늘의 행운번호 받기' }).click();
  await page.getByRole('button', { name: adult ? '네, 만 19세 이상이에요' : '아니요' }).click();
  if (adult) await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
}

/** 행운 장소 화면에서 시·도/시·군·구를 고르고 찾기 */
export async function findPlace(page, sidoLabel, sggLabel) {
  await page.goto('/#/place');
  await page.getByLabel('시·도').selectOption({ label: sidoLabel });
  await page.getByLabel('시·군·구').selectOption({ label: sggLabel });
  await page.getByRole('button', { name: '오늘의 행운 장소 찾기' }).click();
  await expect(page.locator('.place-info')).toBeVisible();
}
