import React, { useState } from 'react';
import { Bell, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function AlertFeed({ alerts, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleConfirm = async (e, alertId, confirmed) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/alerts/${alertId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed })
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to confirm alert", err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '500px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bell size={18} /> Live Alert Feed
      </h3>
      
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
        {alerts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No recent alerts
          </div>
        ) : alerts.map(alert => {
          let badgeColor = 'rgba(59, 130, 246, 0.2)';
          let badgeText = '#3b82f6';
          
          if (alert.confidence > 0.8) {
            badgeColor = 'rgba(239, 68, 68, 0.2)';
            badgeText = '#ef4444';
          } else if (alert.confidence > 0.5) {
            badgeColor = 'rgba(245, 158, 11, 0.2)';
            badgeText = '#f59e0b';
          }

          const isExpanded = expandedId === alert.alert_id;
          const confPercent = Math.round(alert.confidence * 100);

          return (
            <div key={alert.alert_id} 
              className="glass-card-interactive fade-in"
              onClick={() => toggleExpand(alert.alert_id)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {alert.image_url && (
                  <img 
                    src={`${API_BASE}${alert.image_url}`} 
                    alt="Alert" 
                    style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                )}
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        background: badgeColor, 
                        color: badgeText, 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {confPercent}% CONF
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Zone: <strong>{alert.field_zone}</strong> | {new Date(alert.ts * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Confidence Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Confidence Score</span>
                      <span>{confPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${confPercent}%`, height: '100%', background: badgeText }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Action:</span> {alert.recommended_action}
                  </div>

                  {alert.confirmed === null && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        onClick={(e) => handleConfirm(e, alert.alert_id, true)}
                        style={{ 
                          background: 'rgba(34, 197, 94, 0.1)', 
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          flex: 1,
                          justifyContent: 'center'
                        }}
                      ><Check size={16} /> Confirm</button>
                      <button 
                        onClick={(e) => handleConfirm(e, alert.alert_id, false)}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          flex: 1,
                          justifyContent: 'center'
                        }}
                      ><X size={16} /> Deny</button>
                    </div>
                  )}
                  {alert.confirmed === 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#22c55e', padding: '6px', background: 'rgba(34,197,94,0.1)', borderRadius: '4px' }}>
                      <Check size={14} /> Verified by farmer
                    </div>
                  )}
                  {alert.confirmed === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', padding: '6px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>
                      <X size={14} /> Denied by farmer
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
