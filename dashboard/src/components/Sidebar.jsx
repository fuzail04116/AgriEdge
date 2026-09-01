import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Activity, 
  Camera, 
  Wind, 
  GitMerge, 
  Bell, 
  Droplets, 
  BarChart, 
  Server 
} from 'lucide-react';

const PANELS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'zonemap', label: 'Zone Map', icon: Map },
  { id: 'sensors', label: 'Sensor Monitoring', icon: Activity },
  { id: 'diseasepest', label: 'Disease & Pest Detection', icon: Camera },
  { id: 'gas', label: 'Gas/VOC Signature', icon: Wind },
  { id: 'fusion', label: 'Fusion & Risk Engine', icon: GitMerge },
  { id: 'alerts', label: 'Alerts & Verification', icon: Bell },
  { id: 'irrigation', label: 'Irrigation & Actions', icon: Droplets },
  { id: 'impact', label: 'Impact & Comparison', icon: BarChart },
  { id: 'health', label: 'System Health', icon: Server },
];

export default function Sidebar({ activePanel, setActivePanel }) {
  return (
    <div className="sidebar" style={{ padding: '24px 0' }}>
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <h1 style={{ color: 'var(--color-secondary)', fontSize: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--color-primary)' }}>Agri</span>Edge
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Smart Farming Demonstrator</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
        {PANELS.map(panel => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s',
                width: '100%'
              }}
            >
              <Icon size={18} />
              {panel.label}
            </button>
          );
        })}
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <p>Team SIH1364</p>
        <p>SIH26180</p>
      </div>
    </div>
  );
}
