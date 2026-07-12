import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Settings, RefreshCw, Download, TerminalSquare, AlertCircle, Sun, Moon, ArrowUp, PackageOpen } from 'lucide-react';
import Terminal from './components/Terminal';
import './App.css';

const SERVER_URL = 'http://localhost:3001';

function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState(localStorage.getItem('dathex-theme') || 'dark');
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 300) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 300) {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dathex-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const texts = {
    tr: {
      title: 'DatHex',
      subtitle: 'Windows Winget Toplu Güncelleyici',
      totalUpdates: 'Toplam Güncelleme',
      selected: 'Seçilen',
      checkUpdates: 'Güncellemeleri Kontrol Et',
      upgradeSelected: 'Seçilenleri Güncelle',
      upgradeAll: 'Tümünü Güncelle',
      cancel: 'İptal Et',
      appName: 'Uygulama Adı',
      id: 'Kimlik (ID)',
      currentVer: 'Mevcut Sürüm',
      newVer: 'Yeni Sürüm',
      noUpdates: 'Güncellenebilir uygulama bulunamadı.',
      serverError: 'Sunucuya bağlanılamadı. Lütfen DatHex arkaplan servisinin çalıştığından emin olun.'
    },
    en: {
      title: 'DatHex',
      subtitle: 'Windows Winget Mass Upgrader',
      totalUpdates: 'Total Updates',
      selected: 'Selected',
      checkUpdates: 'Check Updates',
      upgradeSelected: 'Upgrade Selected',
      upgradeAll: 'Upgrade All',
      cancel: 'Cancel',
      appName: 'App Name',
      id: 'Identifier (ID)',
      currentVer: 'Current Version',
      newVer: 'New Version',
      noUpdates: 'No upgradable applications found.',
      serverError: 'Could not connect to server. Please ensure the DatHex background service is running.'
    }
  };

  const t = texts[lang];

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect_error', () => {
      setError(t.serverError);
      setLoading(false);
    });

    newSocket.on('log', (data) => {
      setLogs((prev) => [...prev, data]);
    });

    newSocket.on('upgrade-finished', () => {
      setIsUpgrading(false);
      checkUpdates(); // Refresh list
    });

    return () => newSocket.close();
  }, [lang]);

  const checkUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/check`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setApps(data.apps || []);
      // Auto select all by default
      const allIds = new Set((data.apps || []).map(a => a.id));
      setSelectedApps(allIds);
    } catch (err) {
      setError(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApps(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApps.size === apps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(apps.map(a => a.id)));
    }
  };

  const startUpgrade = (type) => {
    if (!socket || isUpgrading) return;
    setLogs([]);
    setIsUpgrading(true);
    
    const payload = { type };
    if (type === 'select') {
      payload.ids = Array.from(selectedApps);
    }
    socket.emit('start-upgrade', payload);
  };

  const cancelUpgrade = () => {
    if (socket) {
      socket.emit('cancel-upgrade');
      setIsUpgrading(false);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      <header>
        <div className="title-group">
          <h1><TerminalSquare color="#3b82f6" size={36} /> {t.title} V2</h1>
          <p>{t.subtitle}</p>
          <a href="https://an1lbayram.github.io/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', marginTop: '0.25rem', display: 'inline-block', fontWeight: '500' }}>
            &lt;/&gt; Created by an1lbayram
          </a>
        </div>
        <div className="language-switch" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`lang-btn ${lang === 'tr' ? 'active' : ''}`} onClick={() => setLang('tr')}>TR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </header>

      {error && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--error-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle color="var(--error-color)" />
          <span style={{ color: 'var(--error-color)' }}>{error}</span>
        </div>
      )}

      <div className="stats-grid animate-fade-in">
        <div className="glass-panel stat-card">
          <div className="stat-icon blue">
            <RefreshCw size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.totalUpdates}</h3>
            <p>{apps.length}</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon green">
            <Download size={24} />
          </div>
          <div className="stat-info">
            <h3>{t.selected}</h3>
            <p>{selectedApps.size}</p>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={checkUpdates} disabled={loading || isUpgrading}>
              {loading ? <div className="loading-spinner" /> : t.checkUpdates}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 animate-fade-in" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Uygulamalar</h2>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={checkUpdates} 
              disabled={loading || isUpgrading}
              title={t.checkUpdates}
            >
              <RefreshCw size={18} className={loading ? "spin-animation" : ""} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {isUpgrading ? (
               <button className="btn btn-secondary" onClick={cancelUpgrade} style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
                 {t.cancel}
               </button>
            ) : (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => startUpgrade('select')}
                  disabled={selectedApps.size === 0 || apps.length === 0}
                >
                  {t.upgradeSelected}
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => startUpgrade('all')}
                  disabled={apps.length === 0}
                >
                  {t.upgradeAll}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input 
                    type="checkbox" 
                    className="checkbox-custom"
                    checked={apps.length > 0 && selectedApps.size === apps.length}
                    onChange={toggleSelectAll}
                    disabled={apps.length === 0}
                  />
                </th>
                <th>{t.appName}</th>
                <th>{t.id}</th>
                <th>{t.currentVer}</th>
                <th>{t.newVer}</th>
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
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.7 }}>
                       <PackageOpen size={48} />
                       <span style={{ fontSize: '1.1rem' }}>{t.noUpdates}</span>
                     </div>
                   </td>
                 </tr>
              ) : (
                apps.map((app, index) => (
                  <tr key={app.id || index}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="checkbox-custom"
                        checked={selectedApps.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>{app.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{app.id}</td>
                    <td><span className="badge">{app.version}</span></td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)' }}>{app.available}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(isUpgrading || logs.length > 0) && (
           <Terminal logs={logs} isRunning={isUpgrading} />
        )}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '1rem', paddingBottom: '1rem', opacity: 0.8 }}>
        <a href="https://an1lbayram.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--accent-color)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
          &lt;/&gt; Created by an1lbayram
        </a>
      </footer>

      {showScroll && (
        <button 
          className="btn btn-primary animate-fade-in scroll-top-btn" 
          onClick={scrollTop} 
          title="Başa Dön"
        >
          <ArrowUp size={28} />
        </button>
      )}
    </div>
  );
}

export default App;
