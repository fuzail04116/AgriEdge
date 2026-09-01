import React, { useState, useEffect } from 'react';
import { Camera, Bug, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function DiseasePest() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE}/images/latest?limit=8`);
        const data = await res.json();
        if (data.images) setImages(data.images);
      } catch (err) {
        console.error("Failed to fetch recent images", err);
      }
    };
    fetchImages();
    const interval = setInterval(fetchImages, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Disease & Pest Detection</h2>
        <p style={{ color: 'var(--text-muted)' }}>Computer vision pipeline (EfficientNet-Lite + MobileNetV3) running on Edge Node.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {images.map(img => {
          const isDiseased = img.disease_label === 'diseased';
          const pestDetected = img.pest_count > 0;
          
          return (
            <div key={img.filename} className="glass-card fade-in" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '200px' }}>
                <img src={`${API_BASE}${img.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Leaf" />
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                  {img.node_id.toUpperCase()}
                </div>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Disease CNN output */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                    <ShieldAlert size={16} color={isDiseased ? 'var(--color-danger)' : 'var(--color-primary)'} />
                    Disease Model
                  </div>
                  <div style={{ 
                    background: isDiseased ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: isDiseased ? 'var(--color-danger)' : 'var(--color-primary)',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700'
                  }}>
                    {img.disease_label?.toUpperCase() || 'HEALTHY'} ({Math.round((img.disease_conf || 0.9)*100)}%)
                  </div>
                </div>

                {/* Pest detector output */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                    <Bug size={16} color={pestDetected ? 'var(--color-warning)' : 'var(--color-primary)'} />
                    Pest Model
                  </div>
                  <div style={{ 
                    background: pestDetected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: pestDetected ? 'var(--color-warning)' : 'var(--color-primary)',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700'
                  }}>
                    {img.pest_count || 0} DETECTED
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Captured: {new Date(img.ts * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        
        {images.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Awaiting vision inferences from the edge...
          </div>
        )}
      </div>
    </div>
  );
}
