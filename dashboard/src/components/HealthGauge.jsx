import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export default function HealthGauge({ data }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (data && data.composite_score) {
      setDisplayScore(Math.round(data.composite_score * 100));
    }
  }, [data]);

  if (!data) return <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  let color = 'var(--color-success)';
  if (displayScore < 50) color = 'var(--color-danger)';
  else if (displayScore < 80) color = 'var(--color-warning)';

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} /> Field Health Composite
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `conic-gradient(${color} ${displayScore}%, rgba(255,255,255,0.05) 0)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: `0 0 30px ${color}33`,
          transition: 'background 1s ease-out, box-shadow 1s ease-out'
        }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'var(--card-bg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '48px', fontWeight: '700', color: color, transition: 'color 1s ease-out' }}>{displayScore}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Score</span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '600' }}>{data.zone_count}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Zones</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: data.recent_alert_count > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {data.recent_alert_count}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recent Alerts</div>
        </div>
      </div>
    </div>
  );
}
