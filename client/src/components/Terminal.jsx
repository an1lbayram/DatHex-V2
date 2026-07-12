import React, { useEffect, useRef } from 'react';

const Terminal = ({ logs, isRunning }) => {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="terminal-container animate-fade-in">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
        </div>
        <span style={{ color: '#a9b7c6', fontSize: '0.8rem', marginLeft: '10px' }}>
          DatHex Terminal {isRunning ? '(Running...)' : '(Idle)'}
        </span>
      </div>
      <div className="terminal-body">
        {logs.map((log, i) => (
          <span key={i} style={{ color: log.error ? '#ff5f56' : 'inherit' }}>
            {log.text}
          </span>
        ))}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
