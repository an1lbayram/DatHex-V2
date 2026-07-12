import React from 'react';
import { RefreshCw, Download, PackageOpen } from 'lucide-react';
import Terminal from './Terminal';

function UpgradesTab({ 
  apps, loading, error, selectedApps, isUpgrading, logs, 
  checkUpdates, toggleSelect, toggleSelectAll, startUpgrade, cancelUpgrade, t 
}) {
  return (
    <div className="tab-content animate-fade-in">
      <div className="stats-grid">
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

      <div className="glass-panel p-4" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{t.menuUpgrades}</h2>
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
    </div>
  );
}

export default UpgradesTab;
