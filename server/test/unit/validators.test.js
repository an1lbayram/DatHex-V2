const { isValidWingetId, isValidSearchQuery, isOriginAllowed } = require('../../lib/validators');

describe('isValidWingetId', () => {
  it('accepts typical winget package IDs', () => {
    expect(isValidWingetId('Google.Chrome')).toBe(true);
    expect(isValidWingetId('Microsoft.VisualStudioCode')).toBe(true);
    expect(isValidWingetId('7zip.7zip')).toBe(true);
    expect(isValidWingetId('some_id-with.mixed_chars')).toBe(true);
  });

  it('rejects non-string, empty and overlong values', () => {
    expect(isValidWingetId('')).toBe(false);
    expect(isValidWingetId(null)).toBe(false);
    expect(isValidWingetId(undefined)).toBe(false);
    expect(isValidWingetId(123)).toBe(false);
    expect(isValidWingetId(['Google.Chrome'])).toBe(false);
    expect(isValidWingetId('a'.repeat(201))).toBe(false);
    expect(isValidWingetId('a'.repeat(200))).toBe(true);
  });

  it('rejects shell metacharacters and command injection payloads', () => {
    const payloads = [
      'Google.Chrome; rm -rf /',
      'Google.Chrome && calc.exe',
      'Google.Chrome | notepad',
      'Google.Chrome`whoami`',
      '$(whoami)',
      'Google.Chrome\ncalc.exe',
      'Google.Chrome & powershell -c evil',
      '../../etc/passwd',
      'Google.Chrome"',
      "Google.Chrome'",
      'Google.Chrome ',
      ' Google.Chrome',
    ];
    for (const payload of payloads) {
      expect(isValidWingetId(payload), `expected "${payload}" to be rejected`).toBe(false);
    }
  });
});

describe('isValidSearchQuery', () => {
  it('accepts letters, digits, spaces, dashes, dots, underscores and accented chars', () => {
    expect(isValidSearchQuery('chrome')).toBe(true);
    expect(isValidSearchQuery('Visual Studio Code')).toBe(true);
    expect(isValidSearchQuery('7-zip_v2.0')).toBe(true);
    expect(isValidSearchQuery('İnternet Explorer')).toBe(true);
  });

  it('rejects non-string, empty and overlong values', () => {
    expect(isValidSearchQuery('')).toBe(false);
    expect(isValidSearchQuery(null)).toBe(false);
    expect(isValidSearchQuery(undefined)).toBe(false);
    expect(isValidSearchQuery(['chrome'])).toBe(false);
    expect(isValidSearchQuery('a'.repeat(201))).toBe(false);
  });

  it('rejects command injection and path traversal payloads', () => {
    const payloads = [
      'chrome; rm -rf /',
      'chrome && calc.exe',
      'chrome | notepad',
      'chrome`whoami`',
      '$(whoami)',
      'chrome\ncalc.exe',
      'chrome & powershell -c evil',
      '../../etc/passwd',
      '<script>alert(1)</script>',
      'chrome > out.txt',
      'chrome; winget install malware',
    ];
    for (const payload of payloads) {
      expect(isValidSearchQuery(payload), `expected "${payload}" to be rejected`).toBe(false);
    }
  });
});

describe('isOriginAllowed', () => {
  const allowed = ['http://localhost:5173', 'https://dathex.example.com'];

  it('allows requests with no origin (curl, same-origin, server-to-server)', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true);
    expect(isOriginAllowed(null, allowed)).toBe(true);
    expect(isOriginAllowed('', allowed)).toBe(true);
  });

  it('allows origins present in the whitelist', () => {
    expect(isOriginAllowed('http://localhost:5173', allowed)).toBe(true);
    expect(isOriginAllowed('https://dathex.example.com', allowed)).toBe(true);
  });

  it('rejects origins not present in the whitelist', () => {
    expect(isOriginAllowed('http://evil.com', allowed)).toBe(false);
    expect(isOriginAllowed('https://dathex.example.com.evil.com', allowed)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173.evil.com', allowed)).toBe(false);
  });
});
