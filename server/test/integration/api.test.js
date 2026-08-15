const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const request = require('supertest');

const execMock = vi.fn();
const spawnMock = vi.fn();

// NOTE: buildApp() takes exec/spawn as injectable dependencies rather than
// relying on vi.mock('child_process'), because vi.mock does not reliably
// intercept require('child_process') calls made from inside a CommonJS
// module under this Node/Vitest combo (verified: the mock silently falls
// through to the real child_process, which would run winget for real).
const { buildApp } = require('../../app');

const UPGRADE_OUTPUT = [
  'Name            Id               Version   Available  Source',
  '-------------------------------------------------------------',
  'Google Chrome   Google.Chrome    120.0.1   121.0.2    winget',
  '1 upgrades available.',
].join('\n');

const LIST_OUTPUT = [
  'Name       Id               Version   Source',
  '------------------------------------------------',
  '7-Zip      Igor.7zip        23.01     winget',
].join('\n');

function makeFakeChildProcess() {
  const proc = new EventEmitter();
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();
  return proc;
}

describe('API integration', () => {
  let app;

  beforeEach(() => {
    execMock.mockReset();
    spawnMock.mockReset();
    ({ app } = buildApp({ exec: execMock, spawn: spawnMock }));
  });

  describe('GET /api/check', () => {
    it('returns parsed upgrade data from winget output', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(null, UPGRADE_OUTPUT, ''));

      const res = await request(app).get('/api/check');

      expect(res.status).toBe(200);
      expect(res.body.apps).toHaveLength(1);
      expect(res.body.apps[0].id).toBe('Google.Chrome');
      expect(execMock).toHaveBeenCalledTimes(1);
    });

    it('serves cached results on a second request without hitting winget again', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(null, UPGRADE_OUTPUT, ''));

      await request(app).get('/api/check');
      const res2 = await request(app).get('/api/check');

      expect(res2.status).toBe(200);
      expect(execMock).toHaveBeenCalledTimes(1);
    });

    it('bypasses the cache when force=true is supplied', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(null, UPGRADE_OUTPUT, ''));

      await request(app).get('/api/check');
      await request(app).get('/api/check?force=true');

      expect(execMock).toHaveBeenCalledTimes(2);
    });

    it('returns an empty app list when winget reports no upgrades', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(null, 'No upgrades available.', ''));

      const res = await request(app).get('/api/check');

      expect(res.status).toBe(200);
      expect(res.body.apps).toEqual([]);
    });

    it('degrades gracefully when the winget command errors with no stdout', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(new Error('command failed'), '', 'boom'));

      const res = await request(app).get('/api/check');

      expect(res.status).toBe(200);
      expect(res.body.apps).toEqual([]);
      expect(res.body.raw).toContain('boom');
    });
  });

  describe('GET /api/list', () => {
    it('returns parsed installed apps', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(null, LIST_OUTPUT, ''));

      const res = await request(app).get('/api/list');

      expect(res.status).toBe(200);
      expect(res.body.apps).toHaveLength(1);
      expect(res.body.apps[0].name).toBe('7-Zip');
    });
  });

  describe('GET /api/search', () => {
    it('returns an empty result when no query is supplied', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ apps: [], raw: '' });
      expect(spawnMock).not.toHaveBeenCalled();
    });

    it('rejects invalid search queries with 400 before ever spawning a process', async () => {
      const res = await request(app).get('/api/search').query({ q: 'chrome; rm -rf /' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid search query/i);
      expect(spawnMock).not.toHaveBeenCalled();
    });

    it('spawns winget with array args (no shell string interpolation) and parses results', async () => {
      const fakeProc = makeFakeChildProcess();
      const searchOutput = [
        'Name           Id              Version   Match    Source',
        '-----------------------------------------------------------',
        'Google Chrome  Google.Chrome   121.0     browser  winget',
      ].join('\n');

      // request(app) is a lazy thenable: nothing is dispatched until it's
      // awaited, so spawn() only fires once the request below actually runs.
      // Since spawn() itself is called synchronously inside the route
      // handler, we can resolve the fake child process asynchronously (from
      // within the spawn call) and just await the whole request/response.
      spawnMock.mockImplementation(() => {
        setImmediate(() => {
          fakeProc.stdout.emit('data', Buffer.from(searchOutput));
          fakeProc.emit('close', 0);
        });
        return fakeProc;
      });

      const res = await request(app).get('/api/search').query({ q: 'chrome' });

      expect(spawnMock).toHaveBeenCalledWith(
        'winget',
        ['search', 'chrome', '--accept-source-agreements', '--disable-interactivity'],
        expect.objectContaining({ windowsHide: true })
      );

      expect(res.status).toBe(200);
      expect(res.body.apps).toHaveLength(1);
      expect(res.body.apps[0].id).toBe('Google.Chrome');
    });
  });

  describe('GET /api/export', () => {
    const exportPath = path.join(__dirname, '../../dathex-export.json');

    afterEach(() => {
      if (fs.existsSync(exportPath)) fs.unlinkSync(exportPath);
    });

    it('returns 500 when the winget export command fails', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => cb(new Error('export failed'), '', ''));

      const res = await request(app).get('/api/export');
      expect(res.status).toBe(500);
    });

    it('downloads and cleans up the export file on success', async () => {
      execMock.mockImplementation((_cmd, _opts, cb) => {
        fs.writeFileSync(exportPath, JSON.stringify({ Sources: [] }));
        cb(null, '', '');
      });

      const res = await request(app).get('/api/export');

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('dathex-apps.json');
      expect(fs.existsSync(exportPath)).toBe(false);
    });
  });
});
