import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Settings, RefreshCw, Download, TerminalSquare, AlertCircle, Sun, Moon, ArrowUp, PackageOpen } from 'lucide-react';
import Terminal from './components/Terminal';
import Sidebar from './components/Sidebar';
import UpgradesTab from './components/UpgradesTab';
import StoreTab from './components/StoreTab';
import InstalledTab from './components/InstalledTab';
import BackupTab from './components/BackupTab';
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
  const [activeTab, setActiveTab] = useState('upgrades');
  const [isProcessing, setIsProcessing] = useState(false);

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
      subtitle: 'Gelişmiş Windows Paket ve Sistem Yöneticisi',
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
      serverError: 'Sunucuya bağlanılamadı. Lütfen DatHex arkaplan servisinin çalıştığından emin olun.',
      menuUpgrades: 'Güncellemeler',
      menuStore: 'Uygulama Mağazası',
      menuInstalled: 'Yüklü Uygulamalar',
      menuBackup: 'Yedekle & Geri Yükle',
      searchPlaceholder: 'Uygulama ara (örn. chrome, vscode)',
      search: 'Ara',
      noResults: 'Sonuç bulunamadı.',
      source: 'Kaynak',
      action: 'İşlem',
      install: 'Yükle',
      confirmUninstall: 'Bu uygulamayı kaldırmak istediğinize emin misiniz?',
      backupDesc: 'Sisteminizdeki tüm yüklü uygulamaların bir listesini (.json formatında) dışa aktararak yedekleyebilirsiniz. Yeni bir bilgisayara geçtiğinizde bu dosyayı kullanarak uygulamalarınızı tek tıkla geri yükleyebilirsiniz.',
      exportBtn: 'Yedeği Dışa Aktar'
    },
    en: {
      title: 'DatHex',
      subtitle: 'Advanced Windows Package & System Manager',
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
      serverError: 'Could not connect to server. Please ensure the DatHex background service is running.',
      menuUpgrades: 'Upgrades',
      menuStore: 'App Store',
      menuInstalled: 'Installed Apps',
      menuBackup: 'Backup & Restore',
      searchPlaceholder: 'Search apps (e.g. chrome, vscode)',
      search: 'Search',
      noResults: 'No results found.',
      source: 'Source',
      action: 'Action',
      install: 'Install',
      confirmUninstall: 'Are you sure you want to uninstall this application?',
      backupDesc: 'Export a list of all your installed applications (.json format) to create a backup. You can use this file to quickly restore your apps on a new computer.',
      exportBtn: 'Export Backup'
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
      setIsProcessing(false);
      checkUpdates(); // Refresh list
    });

    return () => newSocket.close();
  }, [lang]);

  const checkUpdates = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/check${force ? '?force=true' : ''}`);
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
        <div className="glass-panel animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--error-color)', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <AlertCircle color="var(--error-color)" />
          <span style={{ color: 'var(--error-color)' }}>{error}</span>
        </div>
      )}

      <div className="main-layout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
        
        <div className="content-area">
          {activeTab === 'upgrades' && (
            <UpgradesTab 
              apps={apps} loading={loading} error={error} selectedApps={selectedApps}
              isUpgrading={isUpgrading} logs={logs} checkUpdates={checkUpdates}
              toggleSelect={toggleSelect} toggleSelectAll={toggleSelectAll}
              startUpgrade={startUpgrade} cancelUpgrade={cancelUpgrade} t={t}
            />
          )}
          {activeTab === 'store' && (
            <StoreTab 
              socket={socket} SERVER_URL={SERVER_URL} logs={logs} setLogs={setLogs}
              isProcessing={isProcessing} setIsProcessing={setIsProcessing} t={t}
            />
          )}
          {activeTab === 'installed' && (
            <InstalledTab 
              socket={socket} SERVER_URL={SERVER_URL} logs={logs} setLogs={setLogs}
              isProcessing={isProcessing} setIsProcessing={setIsProcessing} t={t}
            />
          )}
          {activeTab === 'backup' && (
            <BackupTab SERVER_URL={SERVER_URL} t={t} />
          )}
        </div>
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
