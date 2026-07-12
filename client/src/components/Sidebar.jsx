import React from 'react';
import { RefreshCw, Search, Trash2, HardDrive } from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, t }) {
  const navItems = [
    { id: 'upgrades', icon: <RefreshCw size={20} />, label: t.menuUpgrades },
    { id: 'store', icon: <Search size={20} />, label: t.menuStore },
    { id: 'installed', icon: <Trash2 size={20} />, label: t.menuInstalled },
    { id: 'backup', icon: <HardDrive size={20} />, label: t.menuBackup },
  ];

  return (
    <div className="sidebar glass-panel animate-fade-in">
      <nav>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
