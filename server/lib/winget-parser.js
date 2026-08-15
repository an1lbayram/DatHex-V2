// Pure parsing helpers for winget CLI output. Kept side-effect free and
// dependency free so they can be unit tested in isolation.

function parseWingetOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));

  if (separatorIndex === -1) {
    return { apps: [], raw: output };
  }

  const startIndex = separatorIndex + 1;
  const apps = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('upgrades available') || line.match(/^[0-9]+ upgrades available/i) || line.includes('yükseltme var')) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      let source = parts[parts.length - 1];
      let available, version, id;

      if (source === 'winget' || source === 'msstore' || source.toLowerCase() === 'kullanılabilir' || !source.match(/[0-9]/)) {
        source = parts.pop();
        available = parts.pop();
        version = parts.pop();
        id = parts.pop();
      } else {
        source = '';
        available = parts.pop();
        version = parts.pop();
        id = parts.pop();
      }

      const name = parts.join(' ');

      apps.push({ name, id, version, available, source });
    }
  }

  return { apps, raw: output };
}

function parseWingetListOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));
  if (separatorIndex === -1) return { apps: [], raw: output };

  const apps = [];
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      let source = parts[parts.length - 1];
      let version, id;

      if (source === 'winget' || source === 'msstore') {
        source = parts.pop();
        if (parts[parts.length - 1].match(/^[0-9]/) && parts[parts.length - 2].match(/^[0-9]/)) {
          parts.pop();
        }
        version = parts.pop();
        id = parts.pop();
      } else {
        source = '';
        version = parts.pop();
        id = parts.pop();
      }

      const name = parts.join(' ');
      apps.push({ name, id, version, source });
    }
  }
  return { apps, raw: output };
}

function parseWingetSearchOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));
  if (separatorIndex === -1) return { apps: [], raw: output };

  const apps = [];
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      const source = parts.pop();
      const match = parts.pop();
      const version = parts.pop();
      const id = parts.pop();
      const name = parts.join(' ');
      apps.push({ name, id, version, match, source });
    }
  }
  return { apps, raw: output };
}

module.exports = { parseWingetOutput, parseWingetListOutput, parseWingetSearchOutput };
