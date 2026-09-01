import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function RecentDetections() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE}/images/latest?limit=6`);
        const data = await res.json();
        if (data.images) setImages(data.images);
      } catch (err) {
        console.error("Failed to fetch recent images", err);
      }
    };
    fetchImages();
    const interval = setInterval(fetchImages, 5000); // 5s poll
    return () => clearInterval(interval);
  }, []);

  if (images.length === 0) return null; // hide if no images yet

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Camera size={18} /> Recent Vision Detections
      </h3>
      
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {images.map((img) => {
          let badgeColor = 'rgba(34, 197, 94, 0.2)';
          let badgeText = '#22c55e';
          
          if (img.disease_label === 'diseased') {
            badgeColor = 'rgba(239, 68, 68, 0.2)';
            badgeText = '#ef4444';
          }

          return (
            <div key={img.filename} className="fade-in" style={{ 
              minWidth: '140px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <img 
                src={`${API_BASE}${img.image_url}`} 
                alt="Detection"
                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
              />
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{img.node_id}</span>
                  <span>{new Date(img.ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ 
                  background: badgeColor, 
                  color: badgeText, 
                  padding: '2px 4px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  {img.disease_label.toUpperCase()} ({Math.round(img.disease_conf * 100)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
