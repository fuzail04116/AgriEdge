import React, { useState, useEffect } from 'react';
import { Activity, Bell, Droplets, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function Overview() {
  const [healthData, setHealthData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [irrigation, setIrrigation] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, alertsRes, irriRes] = await Promise.all([
          fetch(`${API_BASE}/field/health`),
          fetch(`${API_BASE}/alerts/latest?limit=3`),
          fetch(`${API_BASE}/field/irrigation`)
        ]);
        setHealthData(await healthRes.json());
        
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
        
        const irriData = await irriRes.json();
        setIrrigation((irriData.zones || []).filter(z => z.recommendation.includes('IRRIGATE')));
      } catch (err) {
        console.error("Failed to fetch overview data", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const stages = ['SENSE', 'FUSE', 'INFER', 'VERIFY', 'ALERT'];
  const activeStage = Math.floor(Date.now() / 2000) % stages.length; // Fake live progression

  const displayScore = healthData ? Math.round(healthData.composite_score * 100) : 0;
  let color = 'var(--color-primary)';
  if (displayScore < 50) color = 'var(--color-danger)';
  else if (displayScore < 80) color = 'var(--color-warning)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>System Overview</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time Edge-AI pipeline and field health composite.</p>
      </div>

      {/* Pipeline Visualization */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        {stages.map((stage, idx) => (
          <React.Fragment key={stage}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: idx === activeStage ? 'var(--color-primary)' : 'var(--bg-page)',
                border: `2px solid ${idx === activeStage ? 'var(--color-primary)' : 'var(--card-border)'}`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: idx === activeStage ? 'white' : 'var(--text-muted)',
                fontWeight: '600',
                boxShadow: idx === activeStage ? '0 0 15px rgba(34, 197, 94, 0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {idx + 1}
              </div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: idx === activeStage ? '700' : '500', 
                color: idx === activeStage ? 'var(--text-main)' : 'var(--text-muted)' 
              }}>
                {stage}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div style={{ 
                flex: 1, 
                height: '4px', 
                background: idx < activeStage ? 'var(--color-primary)' : 'var(--card-border)',
                margin: '0 16px',
                borderRadius: '2px',
                transition: 'all 0.3s ease'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Gauge */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <h3 style={{ width: '100%', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-secondary)" /> Field Health Composite
          </h3>
          
          <div style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: `conic-gradient(${color} ${displayScore}%, var(--bg-page) 0)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background 1s ease-out'
          }}>
            <div style={{
              width: '210px',
              height: '210px',
              borderRadius: '50%',
              background: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontSize: '56px', fontWeight: '700', color: color, transition: 'color 1s ease-out' }}>{displayScore}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Score</span>
            </div>
          </div>
        </div>

        {/* Right side content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Zones</span>
              <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{healthData?.zone_count || 0}</span>
            </div>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recent Alerts</span>
              <span style={{ fontSize: '28px', fontWeight: '700', color: healthData?.recent_alert_count > 0 ? 'var(--color-warning)' : 'var(--text-main)' }}>
                {healthData?.recent_alert_count || 0}
              </span>
            </div>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Mode</span>
              <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--color-primary)' }}>Autonomous</span>
            </div>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Sync</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-main)' }}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
            {/* Recent Alerts Feed */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                <AlertTriangle size={16} /> Latest Critical Events
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {alerts.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No recent events.</span>
                ) : alerts.map(alert => (
                  <div key={alert.alert_id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: alert.confidence > 0.8 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(alert.ts * 1000).toLocaleTimeString()}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Zone: {alert.field_zone.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Irrigation */}
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                <Droplets size={16} /> Active Irrigation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {irrigation.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All zones adequately hydrated. No active irrigation.</span>
                ) : irrigation.map(zone => (
                  <div key={zone.node_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                    <div className="status-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-info)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--color-info)' }}>{zone.node_id.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Moisture: {Math.round(zone.soil_moisture * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
