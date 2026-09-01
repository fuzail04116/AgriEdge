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
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = 'http://localhost:8000';
const NODES = ['node-01', 'node-02', 'node-03', 'node-04', 'node-05'];

export default function SensorCharts() {
  const [activeNode, setActiveNode] = useState('node-01');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/sensors/${activeNode}/history?limit=30`);
        const data = await res.json();
        setHistory(data.readings || []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // 5s polling
    return () => clearInterval(interval);
  }, [activeNode]);

  const labels = history.map(r => new Date(r.ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}));
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { color: '#94a3b8' } 
      },
      'y-axis-1': { 
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Moisture (%) / Temp (°C)', color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { color: '#94a3b8' },
        suggestedMin: 0,
        suggestedMax: 100
      },
      'y-axis-2': { 
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Gas VOC (ppm)', color: '#94a3b8' },
        grid: { drawOnChartArea: false }, // avoid overlapping grid lines
        ticks: { color: '#f59e0b' },
        suggestedMin: 0,
        suggestedMax: 800
      }
    },
    plugins: {
      legend: { 
        labels: { color: '#f8fafc', usePointStyle: true },
        onClick: ChartJS.defaults.plugins.legend.onClick // ensure default toggle behavior
      },
      tooltip: {
        backgroundColor: 'rgba(16, 24, 20, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
        yAxisID: 'y-axis-1'
      },
      {
        label: 'Temp (°C)',
        data: history.map(r => r.temp_c),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.4,
        yAxisID: 'y-axis-1'
      },
      {
        label: 'Gas VOC',
        data: history.map(r => r.gas_voc),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        tension: 0.4,
        yAxisID: 'y-axis-2'
      }
    ]
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>
          Sensor Trends
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {NODES.map(node => (
            <button
              key={node}
              onClick={() => setActiveNode(node)}
              style={{
                background: activeNode === node ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: activeNode === node ? '#fff' : 'var(--text-muted)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px'
              }}
            >
              {node}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        {history.length > 0 ? (
          <Line options={options} data={chartData} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Waiting for data...
          </div>
        )}
      </div>
    </div>
  );
}
