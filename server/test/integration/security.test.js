const EventEmitter = require('events');
const { io: ioClient } = require('socket.io-client');
const request = require('supertest');
const { waitFor } = require('../helpers/wait-for');

const execMock = vi.fn();
const spawnMock = vi.fn();

// buildApp() takes exec/spawn as injectable dependencies (see app.js) rather
// than relying on vi.mock('child_process'): that mock does not reliably
// intercept require('child_process') calls made from inside a CommonJS
// module under this Node/Vitest combo (verified — it silently falls through
// to the real child_process, which would run the real winget binary).
const { buildApp, ALLOWED_ORIGINS } = require('../../app');

function makeFakeChildProcess() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();
  return proc;
}

describe('Security: CORS', () => {
  let app;

  beforeEach(() => {
    execMock.mockReset();
    spawnMock.mockReset();
    ({ app } = buildApp({ exec: execMock, spawn: spawnMock }));
  });

  it('allows a whitelisted origin and reflects it back', async () => {
    execMock.mockImplementation((_cmd, _opts, cb) => cb(null, 'No upgrades available.', ''));

    const res = await request(app)
      .get('/api/check')
      .set('Origin', ALLOWED_ORIGINS[0]);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGINS[0]);
  });

  it('rejects a non-whitelisted origin', async () => {
    execMock.mockImplementation((_cmd, _opts, cb) => cb(null, 'No upgrades available.', ''));

    const res = await request(app)
      .get('/api/check')
      .set('Origin', 'https://evil-attacker.example.com');

    // cors() surfaces the CORS error via the express error handler (500) and
    // must never echo the disallowed origin back in the response headers.
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Security: HTTP rate limiting on /api/*', () => {
  let app;

  beforeEach(() => {
    execMock.mockReset();
    ({ app } = buildApp({ exec: execMock, spawn: spawnMock }));
    execMock.mockImplementation((_cmd, _opts, cb) => cb(null, 'No upgrades available.', ''));
  });

  it('returns 429 once a client exceeds the per-minute request budget', async () => {
    const RATE_LIMIT_MAX_REQUESTS = 60;

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      const res = await request(app).get('/api/check?force=true');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/api/check?force=true');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many requests/i);
  }, 20000);
});

describe('Security: socket.io command injection & abuse regression', () => {
  let ctx;
  let baseUrl;
  let client;

  beforeEach(() => {
    execMock.mockReset();
    spawnMock.mockReset();
    ctx = buildApp({ exec: execMock, spawn: spawnMock });
    return new Promise((resolve) => {
      ctx.server.listen(0, '127.0.0.1', () => {
        const { port } = ctx.server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
      client = null;
    }
    ctx.isHttpRequestAllowed.stop();
    ctx.isSocketEventAllowed.stop();
    ctx.server.close();
  });

  function connectClient() {
    return new Promise((resolve, reject) => {
      const socket = ioClient(baseUrl, { transports: ['websocket'], forceNew: true });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', reject);
    });
  }

  it('rejects command-injection payloads in start-install without ever spawning winget', async () => {
    client = await connectClient();

    const logPromise = new Promise((resolve) => client.once('log', resolve));
    client.emit('start-install', { id: 'Google.Chrome; calc.exe' });

    const log = await logPromise;
    expect(log.error).toBe(true);
    expect(log.text).toMatch(/invalid package id/i);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('rejects command-injection payloads in start-uninstall without ever spawning winget', async () => {
    client = await connectClient();

    const logPromise = new Promise((resolve) => client.once('log', resolve));
    client.emit('start-uninstall', { id: '$(whoami)' });

    const log = await logPromise;
    expect(log.error).toBe(true);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('rejects the entire batch upgrade when any id in it is invalid, without spawning anything', async () => {
    client = await connectClient();

    const logPromise = new Promise((resolve) => client.once('log', resolve));
    client.emit('start-upgrade', { type: 'select', ids: ['Google.Chrome && calc.exe', 'Google.Chrome'] });

    const log = await logPromise;
    expect(log.error).toBe(true);
    expect(log.text).toMatch(/invalid/i);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('processes every id in a fully valid batch upgrade, one winget spawn per id', async () => {
    const fakeProcs = [makeFakeChildProcess(), makeFakeChildProcess()];
    spawnMock.mockImplementationOnce(() => fakeProcs[0]).mockImplementationOnce(() => fakeProcs[1]);
    client = await connectClient();

    const finishedPromise = new Promise((resolve) => client.once('upgrade-finished', resolve));

    client.emit('start-upgrade', { type: 'select', ids: ['Google.Chrome', '7zip.7zip'] });

    await waitFor(() => spawnMock.mock.calls.length >= 1);
    expect(spawnMock).toHaveBeenNthCalledWith(
      1,
      'winget',
      expect.arrayContaining(['--id', 'Google.Chrome']),
      expect.objectContaining({ windowsHide: true })
    );
    fakeProcs[0].emit('close', 0);

    await waitFor(() => spawnMock.mock.calls.length >= 2);
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'winget',
      expect.arrayContaining(['--id', '7zip.7zip']),
      expect.objectContaining({ windowsHide: true })
    );
    fakeProcs[1].emit('close', 0);

    await finishedPromise;
  });

  it('throttles a socket that fires too many privileged events in a window', async () => {
    spawnMock.mockImplementation(() => makeFakeChildProcess());
    client = await connectClient();

    const errors = [];
    client.on('log', (l) => {
      if (l.error) errors.push(l.text);
    });

    for (let i = 0; i < 25; i++) {
      client.emit('start-install', { id: 'Google.Chrome' });
    }

    await waitFor(() => errors.some((text) => /too many requests/i.test(text)));
    expect(errors.some((text) => /too many requests/i.test(text))).toBe(true);
  });
});
