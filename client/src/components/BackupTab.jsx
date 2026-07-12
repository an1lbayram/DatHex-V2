import React, { useState } from 'react';
import { Download, AlertCircle, FileJson } from 'lucide-react';

function BackupTab({ SERVER_URL, t }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportBackup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dathex-apps.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content animate-fade-in">
      <div className="glass-panel p-4" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <FileJson size={64} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>{t.menuBackup}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '2rem', lineHeight: '1.6' }}>
          {t.backupDesc}
        </p>

        {error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--error-color)', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', width: '100%', maxWidth: '500px' }}>
            <AlertCircle color="var(--error-color)" />
            <span style={{ color: 'var(--error-color)' }}>{error}</span>
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={exportBackup}
          disabled={loading}
        >
          {loading ? <div className="loading-spinner" /> : <><Download size={20} /> {t.exportBtn}</>}
        </button>
      </div>
    </div>
  );
}

export default BackupTab;
