import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Wind, AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const NODES = ['node-01', 'node-02', 'node-03', 'node-04'];

export default function GasSignature() {
  const [activeNode, setActiveNode] = useState('node-01');
  const [history, setHistory] = useState([]);
  const [latestGasLabel, setLatestGasLabel] = useState('normal');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/gas/${activeNode}/history?limit=40`);
        const data = await res.json();
        setHistory(data.history || []);
        
        // Also get latest image for the gas_label classification
        const imgRes = await fetch(`${API_BASE}/images/latest?limit=20`);
        const imgData = await imgRes.json();
        const latestForNode = (imgData.images || []).find(i => i.node_id === activeNode.replace('node-', 'cam-'));
        if (latestForNode && latestForNode.gas_label) {
          setLatestGasLabel(latestForNode.gas_label);
        }
      } catch (err) {
        console.error("Failed to fetch gas history", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeNode]);

  const labels = history.map(r => new Date(r.ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
      y: { 
        title: { display: true, text: 'Gas VOC (ppm)', color: '#1e3a8a' },
        grid: { color: '#e2e8f0' },
        suggestedMin: 0, suggestedMax: 800
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const chartData = {
    labels,
    datasets: [{
      label: 'Gas VOC',
      data: history.map(r => r.gas_voc),
      borderColor: '#1e3a8a',
      backgroundColor: 'rgba(30, 58, 138, 0.1)',
      fill: true,
      tension: 0.3
    }]
  };

  const isAnomalous = latestGasLabel === 'anomalous';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Gas/VOC Signature</h2>
          <p style={{ color: 'var(--text-muted)' }}>BME688/MQ135 telemetry + Edge Impulse classification.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px', flex: 1 }}>
        
        {/* Signature Classification Result */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Signature Analysis</h3>
          <div style={{ 
            background: isAnomalous ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${isAnomalous ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center'
          }}>
            {isAnomalous ? <AlertTriangle size={48} color="var(--color-danger)" /> : <CheckCircle size={48} color="var(--color-primary)" />}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Classification</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: isAnomalous ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                {latestGasLabel.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            The gas classifier uses a 1D-CNN trained via Edge Impulse to detect stress-induced volatile organic compounds (VOCs) beyond baseline fluctuations.
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>VOC Baseline vs Spikes</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            {history.length > 0 ? (
              <Line options={options} data={chartData} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Waiting for telemetry...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
