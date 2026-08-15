const { createRateLimiter } = require('../../lib/rate-limiter');

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the configured max within the window', () => {
    const isAllowed = createRateLimiter(3, 60000);
    expect(isAllowed('client-1')).toBe(true);
    expect(isAllowed('client-1')).toBe(true);
    expect(isAllowed('client-1')).toBe(true);
    isAllowed.stop();
  });

  it('blocks requests once the max is exceeded within the window', () => {
    const isAllowed = createRateLimiter(3, 60000);
    isAllowed('client-1');
    isAllowed('client-1');
    isAllowed('client-1');
    expect(isAllowed('client-1')).toBe(false);
    expect(isAllowed('client-1')).toBe(false);
    isAllowed.stop();
  });

  it('tracks separate keys independently', () => {
    const isAllowed = createRateLimiter(1, 60000);
    expect(isAllowed('client-a')).toBe(true);
    expect(isAllowed('client-b')).toBe(true);
    expect(isAllowed('client-a')).toBe(false);
    expect(isAllowed('client-b')).toBe(false);
    isAllowed.stop();
  });

  it('resets the count after the window elapses', () => {
    const isAllowed = createRateLimiter(1, 1000);
    expect(isAllowed('client-1')).toBe(true);
    expect(isAllowed('client-1')).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(isAllowed('client-1')).toBe(true);
    isAllowed.stop();
  });
});
