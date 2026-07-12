import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import Terminal from './Terminal';

function InstalledTab({ socket, SERVER_URL, logs, setLogs, isProcessing, setIsProcessing, t }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstalled = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/list${force ? '?force=true' : ''}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setApps(data.apps || []);
    } catch (err) {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalled();
  }, []);

  const uninstallApp = (id) => {
    if (!socket || isProcessing) return;
    if (window.confirm(t.confirmUninstall)) {
      setLogs([]);
      setIsProcessing(true);
      socket.emit('start-uninstall', { id });
    }
  };

  return (
    <div className="tab-content animate-fade-in">
      <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{t.menuInstalled}</h2>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => fetchInstalled(true)} 
            disabled={loading || isProcessing}
            title={t.checkUpdates}
          >
            <RefreshCw size={18} className={loading ? "spin-animation" : ""} />
          </button>
        </div>

        {error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--error-color)', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle color="var(--error-color)" />
            <span style={{ color: 'var(--error-color)' }}>{error}</span>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.appName}</th>
                <th>{t.id}</th>
                <th>{t.currentVer}</th>
                <th>{t.source}</th>
                <th style={{ width: '100px', textAlign: 'center' }}>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {loading && apps.length === 0 ? (
                 <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                     <div className="loading-spinner"></div>
                   </td>
                 </tr>
              ) : apps.length === 0 ? (
                 <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                     {t.noResults}
                   </td>
                 </tr>
              ) : (
                apps.map((app, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '500' }}>{app.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{app.id}</td>
                    <td><span className="badge">{app.version}</span></td>
                    <td><span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{app.source}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                        onClick={() => uninstallApp(app.id)}
                        disabled={isProcessing}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(isProcessing || logs.length > 0) && (
           <div style={{ marginTop: '2rem' }}>
             <Terminal logs={logs} isRunning={isProcessing} />
           </div>
        )}
      </div>
    </div>
  );
}

export default InstalledTab;
