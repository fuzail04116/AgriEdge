import React, { useState, useEffect } from 'react';
import { Droplets, Settings2, Play, Square } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function IrrigationActions() {
  const [zones, setZones] = useState([]);

  const fetchIrrigation = async () => {
    try {
      const res = await fetch(`${API_BASE}/field/irrigation`);
      const data = await res.json();
      setZones(data.zones || []);
    } catch (err) {
      console.error("Failed to fetch irrigation", err);
    }
  };

  useEffect(() => {
    fetchIrrigation();
    const interval = setInterval(fetchIrrigation, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOverride = async (nodeId, state) => {
    try {
      await fetch(`${API_BASE}/irrigation/${nodeId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      });
      fetchIrrigation(); // Refresh immediately
    } catch (err) {
      console.error("Failed to set override", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Irrigation & Actions</h2>
        <p style={{ color: 'var(--text-muted)' }}>Condition-based, zone-targeted precision irrigation.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {zones.map(zone => {
          const isIrrigating = zone.recommendation.includes('IRRIGATE');
          const isCritical = zone.recommendation.includes('CRITICAL');
          
          let cardBorder = 'var(--card-border)';
          let iconColor = 'var(--text-muted)';
          
          if (isCritical) {
            cardBorder = 'var(--color-danger)';
            iconColor = 'var(--color-danger)';
          } else if (isIrrigating) {
            cardBorder = 'var(--color-info)';
            iconColor = 'var(--color-info)';
          }

          return (
            <div key={zone.node_id} className="glass-card fade-in" style={{ 
              borderTop: `4px solid ${cardBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', color: 'var(--color-secondary)' }}>
                  <Droplets size={20} color={iconColor} />
                  {zone.node_id.toUpperCase()}
                </div>
                {zone.override_state && zone.override_state !== 'auto' && (
                  <div style={{ background: 'var(--bg-page)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: 'var(--color-warning)' }}>
                    MANUAL OVERRIDE
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>CURRENT CONDITION</div>
                <div style={{ background: 'var(--bg-page)', padding: '12px', borderRadius: '8px', fontSize: '14px', minHeight: '60px' }}>
                  {zone.recommendation}
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Moisture</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{Math.round(zone.soil_moisture * 100)}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Temperature</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{zone.temp_c.toFixed(1)}°C</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Settings2 size={14} /> MANUAL OVERRIDE
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleOverride(zone.node_id, 'FORCE IRRIGATE')}
                    style={{ 
                      flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#2563eb', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    <Play size={14} /> START
                  </button>
                  <button 
                    onClick={() => handleOverride(zone.node_id, 'FORCE STOP')}
                    style={{ 
                      flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    <Square size={14} /> STOP
                  </button>
                  <button 
                    onClick={() => handleOverride(zone.node_id, 'auto')}
                    style={{ 
                      flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-page)', color: 'var(--text-main)', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    AUTO
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
