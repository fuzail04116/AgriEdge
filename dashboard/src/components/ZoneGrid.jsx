import React from 'react';
import { Map, Droplets, Thermometer, Wind } from 'lucide-react';

const Sparkline = ({ value, color }) => {
  // Simple deterministic sparkline relative to value
  const points = [40, 60, 30, 70, 50, value * 100].map((v, i) => `${i * 10},${100 - v}`).join(' ');
  return (
    <svg width="50" height="20" viewBox="0 0 50 100" style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function ZoneGrid({ data, irrigation, onNodeClick }) {
  if (!data || !data.zones) return <div className="glass-card">Loading Zones...</div>;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Map size={18} /> Field Zones Overview
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {data.zones.map((zone) => {
          let statusColor = 'status-success';
          if (zone.status === 'warning') statusColor = 'status-warning';
          if (zone.status === 'critical') statusColor = 'status-danger';
          if (zone.status === 'no_data') statusColor = 'status-info';

          return (
            <div key={zone.node_id} 
              className="glass-card-interactive fade-in"
              onClick={() => onNodeClick(zone.node_id)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{zone.node_id}</span>
                <span className={`status-indicator ${statusColor}`}></span>
              </div>
              
              {zone.status === 'no_data' ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No data available</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={12}/> Moisture</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkline value={zone.soil_moisture} color="#3b82f6" />
                      <span>{(zone.soil_moisture * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={12}/> Temp</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkline value={zone.temp_c / 50} color="#ef4444" />
                      <span>{zone.temp_c.toFixed(1)}°C</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={12}/> VOC</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkline value={zone.gas_voc / 800} color="#f59e0b" />
                      <span>{zone.gas_voc.toFixed(0)}</span>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '6px', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    color: zone.irrigation.includes('CRITICAL') ? 'var(--color-danger)' : 'var(--text-muted)'
                  }}>
                    {zone.irrigation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
