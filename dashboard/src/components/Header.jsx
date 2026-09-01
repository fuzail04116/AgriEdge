import React from 'react';
import { Leaf, Wifi } from 'lucide-react';

export default function Header({ lastUpdated }) {
  return (
    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '10px', borderRadius: '12px' }}>
          <Leaf color="#22c55e" size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>AgriEdge</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Smart Agriculture Monitoring</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <span className="status-indicator status-success status-pulse"></span>
          <span>System Online</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
