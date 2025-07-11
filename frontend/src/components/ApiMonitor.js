import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const MonitorContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  max-width: 300px;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const MonitorTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: #00ff00;
`;

const MonitorItem = styled.div`
  margin: 2px 0;
  font-size: 11px;
`;

const ToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  z-index: 10000;
  display: ${props => props.$show ? 'none' : 'block'};
`;

// Global stats
let apiStats = {
  totalRequests: 0,
  cacheHits: 0,
  deduplicationHits: 0,
  uniqueRequests: 0,
  lastReset: Date.now()
};

// Export function to update stats
export const updateApiStats = (type) => {
  apiStats.totalRequests++;
  
  switch (type) {
    case 'cache':
      apiStats.cacheHits++;
      break;
    case 'deduplication':
      apiStats.deduplicationHits++;
      break;
    case 'unique':
      apiStats.uniqueRequests++;
      break;
  }
};

export const ApiMonitor = () => {
  const [show, setShow] = useState(false);
  const [stats, setStats] = useState(apiStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...apiStats });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetStats = () => {
    apiStats = {
      totalRequests: 0,
      cacheHits: 0,
      deduplicationHits: 0,
      uniqueRequests: 0,
      lastReset: Date.now()
    };
    setStats(apiStats);
  };

  const cacheHitRate = stats.totalRequests > 0 
    ? ((stats.cacheHits + stats.deduplicationHits) / stats.totalRequests * 100).toFixed(1)
    : 0;

  const uptime = Math.floor((Date.now() - stats.lastReset) / 1000);

  return (
    <>
      <ToggleButton $show={show} onClick={() => setShow(!show)}>
        📊 API
      </ToggleButton>
      
      <MonitorContainer $show={show}>
        <MonitorTitle>API Monitor</MonitorTitle>
        <MonitorItem>Total Requests: {stats.totalRequests}</MonitorItem>
        <MonitorItem>Cache Hits: {stats.cacheHits}</MonitorItem>
        <MonitorItem>Deduplication: {stats.deduplicationHits}</MonitorItem>
        <MonitorItem>Unique Requests: {stats.uniqueRequests}</MonitorItem>
        <MonitorItem>Hit Rate: {cacheHitRate}%</MonitorItem>
        <MonitorItem>Uptime: {uptime}s</MonitorItem>
        <button 
          onClick={resetStats}
          style={{
            background: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          Reset
        </button>
      </MonitorContainer>
    </>
  );
}; 