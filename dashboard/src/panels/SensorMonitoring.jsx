import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = 'http://localhost:8000';
const NODES = ['node-01', 'node-02', 'node-03', 'node-04', 'node-05'];

export default function SensorMonitoring() {
  const [activeNode, setActiveNode] = useState('node-01');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/sensors/${activeNode}/history?limit=40`);
        const data = await res.json();
        setHistory(data.readings || []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [activeNode]);

  const labels = history.map(r => new Date(r.ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { 
        grid: { color: '#e2e8f0' }, 
        ticks: { color: '#64748b' } 
      },
      'y-moisture': { 
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Soil Moisture (%)', color: '#3b82f6' },
        grid: { color: '#e2e8f0' }, 
        ticks: { color: '#3b82f6' },
        suggestedMin: 0,
        suggestedMax: 100
      },
      'y-temp': { 
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Temperature (°C)', color: '#ef4444' },
        grid: { drawOnChartArea: false },
        ticks: { color: '#ef4444' },
        suggestedMin: 0,
        suggestedMax: 50
      }
    },
    plugins: {
      legend: { labels: { color: '#0f172a', usePointStyle: true } },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1
      }
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: history.map(r => r.soil_moisture * 100),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y-moisture'
      },
      {
        label: 'Temp (°C)',
        data: history.map(r => r.temp_c),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        tension: 0.4,
        yAxisID: 'y-temp'
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Sensor Monitoring</h2>
          <p style={{ color: 'var(--text-muted)' }}>Continuous multi-modality telemetry per node.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Period 1: Continuous (15 min)</span>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Low-power sensing loop capturing soil moisture, temp, and NPK baseline.</p>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Period 2: Scheduled (1 hr)</span>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>High-power Edge-AI wake capturing images and precise gas signature.</p>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Soil & Environment Trends</h3>
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
  );
}
