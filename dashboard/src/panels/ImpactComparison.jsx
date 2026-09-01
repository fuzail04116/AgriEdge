import React from 'react';
import { Target, Leaf, CheckCircle, IndianRupee } from 'lucide-react';

export default function ImpactComparison() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Impact & Comparison</h2>
        <p style={{ color: 'var(--text-muted)' }}>AgriEdge competitive advantage, SDG alignment, and cost breakdown.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Comparison Table */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-page)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>AgriEdge vs. Conventional Methods</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg)', borderBottom: '2px solid var(--card-border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>Feature</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-secondary)' }}>AgriEdge (Edge-AI)</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>Conventional IoT</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: '500' }}>Decision Making</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-primary)', fontWeight: '600' }}>On-Node (Real-Time)</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>Cloud-Dependent (Latency)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: '500' }}>Data Bandwidth</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-primary)', fontWeight: '600' }}>Extremely Low (Metadata Only)</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>High (Streaming Video/Images)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: '500' }}>Multimodal Fusion</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-primary)', fontWeight: '600' }}>Yes (Vision + Gas + Sensors)</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>No (Siloed Sensors)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: '500' }}>Cost Profile</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-primary)', fontWeight: '600' }}>Low-Cost (ESP32)</td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>High-Cost (Raspberry Pi/Jetson)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost & SDG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-secondary)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
              <IndianRupee size={20} /> <span style={{ fontWeight: '600', fontSize: '14px' }}>UNIT ECONOMICS</span>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: '700' }}>₹7,000–9,000</div>
              <div style={{ fontSize: '14px', color: '#bfdbfe' }}>Prototype / Single Unit Cost</div>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-primary)' }}>~ ₹3,500</div>
              <div style={{ fontSize: '14px', color: '#bfdbfe' }}>Estimated Cost at 10,000+ Scale</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--color-primary)" /> SDG Alignment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div><strong>SDG 2: Zero Hunger</strong> — Securing crop yields by detecting disease and pest outbreaks before catastrophic spread.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="var(--color-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div><strong>SDG 6: Clean Water</strong> — Precision condition-based irrigation reduces agricultural water waste by 30-40%.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div><strong>SDG 9: Innovation</strong> — Democratising Edge-AI for smallholder farmers via low-cost microcontrollers.</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div><strong>SDG 13: Climate Action</strong> — Building resilient agriculture systems capable of adapting to erratic climate stressors.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
