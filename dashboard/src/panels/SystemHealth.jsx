import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Power, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error("Failed to fetch system health", err);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleOfflineMode = async () => {
    if (!healthData) return;
    try {
      await fetch(`${API_BASE}/system/offline-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offline: !healthData.offline_simulation })
      });
      fetchHealth();
    } catch (err) {
      console.error("Failed to toggle offline mode", err);
    }
  };

  if (!healthData) return <div>Loading...</div>;

  const isOffline = healthData.offline_simulation;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>System Health & Connectivity</h2>
        <p style={{ color: 'var(--text-muted)' }}>Adaptive connectivity: Local Network → SMS → Cloud sync.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Node List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--color-primary)" /> Edge Node Fleet Status
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {healthData.nodes.map(node => {
              let statusColor = 'var(--text-muted)';
              let statusText = 'OFFLINE';
              let Icon = WifiOff;
              
              if (!isOffline && node.status === 'online') {
                statusColor = 'var(--color-primary)';
                statusText = 'ONLINE (LOCAL Wi-Fi)';
                Icon = Wifi;
              } else if (!isOffline && node.status === 'degraded') {
                statusColor = 'var(--color-warning)';
                statusText = 'DEGRADED (POOR SIGNAL)';
                Icon = RefreshCw;
              }

              return (
                <div key={node.node_id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px', background: 'var(--bg-page)', border: '1px solid var(--card-border)', borderRadius: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Icon size={20} color={statusColor} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>{node.node_id.toUpperCase()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firmware: v1.2.4 (ESP32-S3)</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: statusColor }}>{statusText}</div>
                    <span className={`status-indicator ${statusText === 'OFFLINE' ? 'status-offline' : 'status-pulse'}`} style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}`, margin: 0 }}></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Network & Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: isOffline ? '#fef2f2' : 'var(--card-bg)', borderColor: isOffline ? '#fca5a5' : 'var(--card-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: isOffline ? 'var(--color-danger)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Power size={18} /> Connectivity Simulation
            </h3>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Toggle the cloud connection to demonstrate the system's ability to operate autonomously on the local edge network. 
              Alerts and irrigation logic will continue to function without internet access.
            </p>
            
            <button 
              onClick={toggleOfflineMode}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: isOffline ? 'var(--color-primary)' : 'var(--color-danger)',
                color: 'white',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              <Power size={18} />
              {isOffline ? 'RESTORE CLOUD SYNC' : 'SIMULATE NETWORK FAILURE'}
            </button>
            
            {isOffline && (
              <div style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: '500', textAlign: 'center' }}>
                System is operating via local node mesh only.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
