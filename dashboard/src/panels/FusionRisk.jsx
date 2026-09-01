import React, { useState, useEffect } from 'react';
import { GitMerge } from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const NODES = ['node-01', 'node-02', 'node-03', 'node-04'];

export default function FusionRisk() {
  const [activeNode, setActiveNode] = useState('node-01');
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/fusion/${activeNode}/breakdown`);
        const data = await res.json();
        setBreakdown(data.breakdown);
      } catch (err) {
        console.error("Failed to fetch fusion breakdown", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [activeNode]);

  if (!breakdown) return <div>Loading...</div>;

  const { score, tier, details } = breakdown;
  const { disease_score, gas_score, pest_score, sensor_bonus } = details || {};
  
  // Weights matching the backend engine
  const w_disease = 0.45;
  const w_gas = 0.30;
  const w_pest = 0.25;

  const calcWidth = (val, weight) => Math.max(0, Math.min(100, (val * weight) * 100));
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Fusion & Risk Engine</h2>
          <p style={{ color: 'var(--text-muted)' }}>Multimodal decision fusion combining all inputs.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {NODES.map(node => (
            <button
              key={node}
              onClick={() => setActiveNode(node)}
              style={{
                background: activeNode === node ? 'var(--color-secondary)' : 'var(--card-bg)',
                border: `1px solid ${activeNode === node ? 'var(--color-secondary)' : 'var(--card-border)'}`,
                color: activeNode === node ? '#fff' : 'var(--text-main)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {node.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '48px', padding: '48px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Combined Risk Score</h3>
            <p style={{ color: 'var(--text-muted)' }}>Auto-alert triggers at &gt;80%, flag for review at &gt;50%.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: score > 0.8 ? 'var(--color-danger)' : score > 0.5 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
              {Math.round(score * 100)}%
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Tier: {tier.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Breakdown visual */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-secondary)' }}>Score Breakdown</h4>
          <div style={{ width: '100%', height: '32px', background: 'var(--bg-page)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${calcWidth(disease_score, w_disease)}%`, background: '#22c55e', transition: 'width 0.5s' }} title={`Vision: ${Math.round(disease_score * w_disease * 100)}%`} />
            <div style={{ width: `${calcWidth(gas_score, w_gas)}%`, background: '#f59e0b', transition: 'width 0.5s' }} title={`Gas: ${Math.round(gas_score * w_gas * 100)}%`} />
            <div style={{ width: `${calcWidth(pest_score, w_pest)}%`, background: '#3b82f6', transition: 'width 0.5s' }} title={`Pest: ${Math.round(pest_score * w_pest * 100)}%`} />
            <div style={{ width: `${Math.min(100, sensor_bonus * 100)}%`, background: '#ef4444', transition: 'width 0.5s' }} title={`Sensor Bonus: ${Math.round(sensor_bonus * 100)}%`} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <div style={{ borderLeft: '3px solid #22c55e', paddingLeft: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>VISION (w={w_disease})</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>+{Math.round(disease_score * w_disease * 100)}</div>
            </div>
            <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>GAS (w={w_gas})</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>+{Math.round(gas_score * w_gas * 100)}</div>
            </div>
            <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PEST (w={w_pest})</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>+{Math.round(pest_score * w_pest * 100)}</div>
            </div>
            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>SENSOR DEVIATION</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>+{Math.round(sensor_bonus * 100)}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
