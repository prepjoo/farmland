import { defineConfig, devices } from '@playwright/test';

// 화면 테스트: 배포용으로 빌드한 사이트를 띄워 실제 브라우저로 누른다.
// 작업 환경에 미리 깔린 Chromium이 있으면 그것을 쓴다 (PW_CHROMIUM 환경변수).
const executablePath = process.env.PW_CHROMIUM || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4400',
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
    { name: 'pc', use: { viewport: { width: 1280, height: 860 }, launchOptions: { executablePath } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4400 --strictPort',
    url: 'http://localhost:4400',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
