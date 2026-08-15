const {
  parseWingetOutput,
  parseWingetListOutput,
  parseWingetSearchOutput,
} = require('../../lib/winget-parser');

describe('parseWingetOutput (winget upgrade)', () => {
  it('returns an empty result for empty/undefined input', () => {
    expect(parseWingetOutput('')).toEqual({ apps: [], raw: '' });
    expect(parseWingetOutput(undefined)).toEqual({ apps: [], raw: '' });
  });

  it('returns raw output untouched when no separator line is found', () => {
    const out = 'No installed package found matching input criteria.';
    expect(parseWingetOutput(out)).toEqual({ apps: [], raw: out });
  });

  it('parses app rows into structured objects and skips the summary line', () => {
    const out = [
      'Name                 Id                     Version      Available    Source',
      '--------------------------------------------------------------------------------',
      'Google Chrome        Google.Chrome          120.0.1      121.0.2      winget',
      'Microsoft Edge       Microsoft.Edge         119.0.0      120.0.0      winget',
      '2 upgrades available.',
    ].join('\n');

    const result = parseWingetOutput(out);

    expect(result.apps).toHaveLength(2);
    expect(result.apps[0]).toEqual({
      name: 'Google Chrome',
      id: 'Google.Chrome',
      version: '120.0.1',
      available: '121.0.2',
      source: 'winget',
    });
    expect(result.apps[1]).toEqual({
      name: 'Microsoft Edge',
      id: 'Microsoft.Edge',
      version: '119.0.0',
      available: '120.0.0',
      source: 'winget',
    });
    expect(result.raw).toBe(out);
  });

  it('handles multi-word app names correctly', () => {
    const out = [
      'Name                            Id                       Version   Available  Source',
      '--------------------------------------------------------------------------------------',
      'Microsoft Visual Studio Code    Microsoft.VisualStudioCode 1.85.0   1.86.0     winget',
    ].join('\n');

    const result = parseWingetOutput(out);
    expect(result.apps[0].name).toBe('Microsoft Visual Studio Code');
    expect(result.apps[0].id).toBe('Microsoft.VisualStudioCode');
  });

  it('ignores lines that only contain the Turkish "yükseltme var" summary', () => {
    const out = [
      'Name         Id            Version   Available  Source',
      '--------------------------------------------------------',
      'App Uno      Vendor.App    1.0       2.0        winget',
      '1 yükseltme var.',
    ].join('\n');

    const result = parseWingetOutput(out);
    expect(result.apps).toHaveLength(1);
  });
});

describe('parseWingetListOutput (winget list)', () => {
  it('returns an empty result for empty input', () => {
    expect(parseWingetListOutput('')).toEqual({ apps: [], raw: '' });
  });

  it('parses installed apps including ones with no source', () => {
    const out = [
      'Name              Id                   Version      Source',
      '-----------------------------------------------------------',
      '7-Zip             Igor.7zip            23.01        winget',
      'Notepad++         Notepad++.Notepad++  8.6.2        winget',
      'Mozilla Firefox   Mozilla.Firefox      121.0',
    ].join('\n');

    const result = parseWingetListOutput(out);

    expect(result.apps).toHaveLength(3);
    expect(result.apps[0]).toEqual({ name: '7-Zip', id: 'Igor.7zip', version: '23.01', source: 'winget' });
    expect(result.apps[2]).toEqual({ name: 'Mozilla Firefox', id: 'Mozilla.Firefox', version: '121.0', source: '' });
  });
});

describe('parseWingetSearchOutput (winget search)', () => {
  it('returns an empty result for empty input', () => {
    expect(parseWingetSearchOutput('')).toEqual({ apps: [], raw: '' });
  });

  it('parses search results with name, id, version, match and source', () => {
    const out = [
      'Name             Id                     Version         Match     Source',
      '---------------------------------------------------------------------------',
      'Google Chrome    Google.Chrome          121.0.6167.85   browser   winget',
    ].join('\n');

    const result = parseWingetSearchOutput(out);

    expect(result.apps).toHaveLength(1);
    expect(result.apps[0]).toEqual({
      name: 'Google Chrome',
      id: 'Google.Chrome',
      version: '121.0.6167.85',
      match: 'browser',
      source: 'winget',
    });
  });

  it('returns no apps when the separator line is missing', () => {
    const out = 'No package found matching input criteria.';
    expect(parseWingetSearchOutput(out).apps).toEqual([]);
  });
});
