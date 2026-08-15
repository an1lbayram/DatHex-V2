const path = require('path');
const notifier = require('node-notifier');
const cron = require('node-cron');
const { exec } = require('child_process');

const { buildApp } = require('./app');
const { parseWingetOutput } = require('./lib/winget-parser');

const PORT = process.env.PORT || 3001;

const { server } = buildApp();

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DatHex Server running on http://localhost:${PORT}`);
});

// Auto-Updater Cron Job (Runs every 6 hours)
cron.schedule('0 */6 * * *', () => {
  console.log('[Auto-Updater] Checking for winget upgrades in the background...');
  exec('powershell -NoProfile -Command "winget upgrade --accept-source-agreements"', { encoding: 'utf8', timeout: 120000 }, (error, stdout) => {
    if (error || !stdout) return;

    const out = stdout || '';
    if (out.includes('No installed package found') || out.includes('No upgrades available') || out.includes('Bulunamadı') || out.includes('yükseltme yok')) {
      return;
    }

    const parsed = parseWingetOutput(out);
    if (parsed.apps && parsed.apps.length > 0) {
      notifier.notify({
        title: 'DatHex V2 - Güncelleme Mevcut',
        message: `${parsed.apps.length} adet uygulama için güncelleme bulundu. DatHex'i açarak tek tıkla güncelleyebilirsiniz.`,
        icon: path.join(__dirname, '../client/public/favicon.svg'),
        appID: 'DatHex V2'
      });
    }
  });
});
