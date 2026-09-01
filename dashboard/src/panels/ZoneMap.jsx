import React, { useState, useEffect } from 'react';
import { Map, X, Activity, Droplets, Thermometer, Wind, AlertCircle, Camera } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function ZoneMap() {
  const [healthData, setHealthData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetail, setNodeDetail] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/field/health`);
        setHealthData(await res.json());
      } catch (err) {
        console.error("Failed to fetch health data", err);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      setNodeDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${API_BASE}/zones/${selectedNode}/detail`);
        setNodeDetail(await res.json());
      } catch (err) {
        console.error("Failed to fetch node detail", err);
      }
    };
    fetchDetail();
    // Poll details if open
    const interval = setInterval(fetchDetail, 3000);
    return () => clearInterval(interval);
  }, [selectedNode]);

  if (!healthData) return <div>Loading Map...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', position: 'relative' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Zone Map</h2>
        <p style={{ color: 'var(--text-muted)' }}>Area-based field decision overview.</p>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', gap: '24px', position: 'relative', overflow: 'hidden' }}>
        
        {/* The Grid / Map */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignContent: 'start' }}>
          {healthData.zones.map((zone) => {
            let bgColor = 'rgba(34, 197, 94, 0.1)';
            let borderColor = 'var(--color-primary)';
            if (zone.status === 'warning') {
              bgColor = 'rgba(245, 158, 11, 0.1)';
              borderColor = 'var(--color-warning)';
            }
            if (zone.status === 'critical') {
              bgColor = 'rgba(239, 68, 68, 0.1)';
              borderColor = 'var(--color-danger)';
            }
            if (zone.status === 'no_data') {
              bgColor = 'var(--bg-page)';
              borderColor = 'var(--card-border)';
            }

            return (
              <div 
                key={zone.node_id}
                onClick={() => setSelectedNode(zone.node_id)}
                className="glass-card-interactive"
                style={{ 
                  background: selectedNode === zone.node_id ? bgColor : 'var(--card-bg)',
                  borderColor: selectedNode === zone.node_id ? borderColor : 'var(--card-border)',
                  borderTop: `4px solid ${borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{zone.node_id.toUpperCase()}</span>
                  <span className={`status-indicator ${zone.status === 'no_data' ? 'status-offline' : 'status-pulse'}`} style={{ backgroundColor: borderColor, boxShadow: `0 0 8px ${borderColor}` }}></span>
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Status: <strong style={{ color: borderColor }}>{zone.status.replace('_', ' ')}</strong>
                </div>
                
                {zone.status !== 'no_data' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Score</span>
                      <strong>{Math.round(zone.health_score * 100)}%</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Side Drawer */}
        {selectedNode && (
          <div className="fade-in" style={{ 
            width: '380px', 
            background: 'var(--bg-page)', 
            border: '1px solid var(--card-border)', 
            borderRadius: 'var(--radius)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-secondary)' }}>{selectedNode.toUpperCase()} Details</h3>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            {!nodeDetail ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading context...</div>
            ) : (
              <>
                {/* Latest Readings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16}/> Live Telemetry</h4>
                  {nodeDetail.sensor ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="glass-card" style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Moisture</div>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>{Math.round(nodeDetail.sensor.soil_moisture * 100)}%</div>
                      </div>
                      <div className="glass-card" style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Temp</div>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>{nodeDetail.sensor.temp_c.toFixed(1)}°C</div>
                      </div>
                      <div className="glass-card" style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>VOC</div>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>{nodeDetail.sensor.gas_voc.toFixed(0)} ppm</div>
                      </div>
                      <div className="glass-card" style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>NPK</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{nodeDetail.sensor.n}-{nodeDetail.sensor.p}-{nodeDetail.sensor.k}</div>
                      </div>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No telemetry available.</span>}
                </div>

                {/* Latest Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Camera size={16}/> Latest Image Capture</h4>
                  {nodeDetail.image ? (
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={`${API_BASE}/media/${nodeDetail.image.filename}`} alt="Zone capture" style={{ width: '100%', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{nodeDetail.image.disease_label?.toUpperCase() || 'HEALTHY'}</span>
                        <span>{new Date(nodeDetail.image.ts * 1000).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No image available.</span>}
                </div>

                {/* Latest Alert */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={16}/> Actionable Alert</h4>
                  {nodeDetail.alert ? (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--color-danger)' }}>{nodeDetail.alert.type.replace('_', ' ').toUpperCase()}</strong>
                      <p style={{ marginTop: '4px' }}>{nodeDetail.alert.recommended_action}</p>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No recent alerts. Zone is stable.</span>}
                </div>

              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
