import React, { useState } from 'react';
import { Search, PackagePlus, AlertCircle } from 'lucide-react';
import Terminal from './Terminal';

function StoreTab({ socket, SERVER_URL, logs, setLogs, isProcessing, setIsProcessing, t }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchApps = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setResults(data.apps || []);
      if (!data.apps || data.apps.length === 0) {
        setError(t.noResults);
      }
    } catch (err) {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  const installApp = (id) => {
    if (!socket || isProcessing) return;
    setLogs([]);
    setIsProcessing(true);
    socket.emit('start-install', { id });
  };

  return (
    <div className="tab-content animate-fade-in">
      <div className="glass-panel p-4" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>{t.menuStore}</h2>
        
        <form onSubmit={searchApps} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || isProcessing || !query.trim()}>
            {loading ? <div className="loading-spinner" /> : t.search}
          </button>
        </form>

        {error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--error-color)', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle color="var(--error-color)" />
            <span style={{ color: 'var(--error-color)' }}>{error}</span>
          </div>
        )}

        {results.length > 0 && (
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
                {results.map((app, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '500' }}>{app.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{app.id}</td>
                    <td><span className="badge">{app.version}</span></td>
                    <td><span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{app.source}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => installApp(app.id)}
                        disabled={isProcessing}
                      >
                        <PackagePlus size={16} style={{ marginRight: '0.25rem' }} /> {t.install}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(isProcessing || logs.length > 0) && (
           <div style={{ marginTop: '2rem' }}>
             <Terminal logs={logs} isRunning={isProcessing} />
           </div>
        )}
      </div>
    </div>
  );
}

export default StoreTab;
