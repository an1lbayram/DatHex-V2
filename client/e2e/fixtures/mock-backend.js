const SERVER_URL = 'http://localhost:3001';

const SAMPLE_APPS = [
  { name: 'Google Chrome', id: 'Google.Chrome', version: '120.0.1', available: '121.0.2', source: 'winget' },
  { name: '7-Zip', id: 'Igor.7zip', version: '23.00', available: '23.01', source: 'winget' },
];

// The app (127.0.0.1:4173) and SERVER_URL (localhost:3001) are different
// origins, so the mocked responses need a permissive CORS header — Chromium's
// CDP-based route interception tolerates its absence, but Firefox/WebKit
// enforce real cross-origin CORS even on a fulfilled route and the fetch()
// call fails silently without it.
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

// The client hard-codes SERVER_URL to a local DatHex backend that isn't
// running in CI, so every e2e test mocks the HTTP + socket.io endpoints
// instead of spinning up the real Express/winget server.
async function mockBackend(page, { apps = SAMPLE_APPS } = {}) {
  await page.route(`${SERVER_URL}/api/check**`, (route) =>
    route.fulfill({ json: { apps }, headers: CORS_HEADERS })
  );
  await page.route(`${SERVER_URL}/api/search**`, (route) =>
    route.fulfill({ json: { apps: [] }, headers: CORS_HEADERS })
  );
  await page.route(`${SERVER_URL}/api/list**`, (route) =>
    route.fulfill({ json: { apps: [] }, headers: CORS_HEADERS })
  );
  // Fail the socket.io handshake immediately instead of leaving it hanging;
  // the app degrades gracefully to a "can't reach server" banner without
  // hiding the already-mocked upgrade list.
  await page.route(`${SERVER_URL}/socket.io/**`, (route) => route.abort());
}

export { mockBackend, SAMPLE_APPS, SERVER_URL };
