import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
];

export default function AlertsVerification() {
  const [alerts, setAlerts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Keep track of announced alert IDs so we don't repeat them
  const announcedAlertsRef = useRef(new Set());

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/latest?limit=20`);
      const data = await res.json();
      const newAlerts = data.alerts || [];
      setAlerts(newAlerts);
      
      // Process new alerts for voice announcement
      if (newAlerts.length > 0) {
        const latestAlert = newAlerts[0]; // the feed is ordered by latest first
        
        if (!announcedAlertsRef.current.has(latestAlert.alert_id)) {
          announcedAlertsRef.current.add(latestAlert.alert_id);
          
          if (voiceEnabled && window.speechSynthesis) {
            let message = '';
            
            // Basic translation fallback for the alert speech based on language code
            if (language === 'hi-IN') {
              message = `ध्यान दें! ज़ोन ${latestAlert.field_zone} में ${latestAlert.type.replace('_', ' ')} का अलर्ट है। कृपया जाँच करें।`;
            } else if (language === 'ta-IN') {
              message = `கவனம்! மண்டலம் ${latestAlert.field_zone} இல் ${latestAlert.type.replace('_', ' ')} எச்சரிக்கை. தயவுசெய்து சரிபார்க்கவும்.`;
            } else if (language === 'te-IN') {
              message = `శ్రద్ధ వహించండి! జోన్ ${latestAlert.field_zone} లో ${latestAlert.type.replace('_', ' ')} హెచ్చరిక. దయచేసి తనిఖీ చేయండి.`;
            } else {
              message = `Attention! ${latestAlert.type.replace('_', ' ')} alert in zone ${latestAlert.field_zone}.`;
            }

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = language;
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => {
      clearInterval(interval);
      window.speechSynthesis?.cancel(); // cleanup speech on unmount
    };
  }, [language, voiceEnabled]);

  const handleConfirm = async (e, alertId, confirmed) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/alerts/${alertId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed })
      });
      fetchAlerts();
    } catch (err) {
      console.error("Failed to confirm alert", err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Alerts & Verification</h2>
          <p style={{ color: 'var(--text-muted)' }}>Confidence-tiered alert feed and farmer confirmation loop.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-bg)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <Volume2 size={18} color={voiceEnabled ? 'var(--color-primary)' : 'var(--text-muted)'} onClick={() => setVoiceEnabled(!voiceEnabled)} style={{ cursor: 'pointer' }} />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', overflowY: 'auto', flex: 1 }}>
        {alerts.length === 0 ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
            No recent alerts
          </div>
        ) : alerts.map(alert => {
          let badgeColor = 'rgba(59, 130, 246, 0.1)';
          let badgeText = 'var(--color-info)';
          let tierName = 'LOG ONLY';
          
          if (alert.confidence > 0.8) {
            badgeColor = 'rgba(239, 68, 68, 0.1)';
            badgeText = 'var(--color-danger)';
            tierName = 'AUTO ALERT';
          } else if (alert.confidence > 0.5) {
            badgeColor = 'rgba(245, 158, 11, 0.1)';
            badgeText = 'var(--color-warning)';
            tierName = 'FLAG FOR REVIEW';
          }

          const isExpanded = expandedId === alert.alert_id;
          const confPercent = Math.round(alert.confidence * 100);

          return (
            <div key={alert.alert_id} 
              className="glass-card-interactive fade-in"
              onClick={() => toggleExpand(alert.alert_id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                {alert.image_url && (
                  <img 
                    src={`${API_BASE}${alert.image_url}`} 
                    alt="Alert" 
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                )}
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        background: badgeColor, 
                        color: badgeText, 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '12px',
                        fontWeight: '700',
                        border: `1px solid ${badgeText}`
                      }}>
                        {tierName} ({confPercent}%)
                      </div>
                      {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Zone: <strong style={{ color: 'var(--color-secondary)' }}>{alert.field_zone.toUpperCase()}</strong> | {new Date(alert.ts * 1000).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                      <span>FUSION CONFIDENCE</span>
                      <span>{confPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-page)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${confPercent}%`, height: '100%', background: badgeText }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>RECOMMENDED ACTION:</span> {alert.recommended_action}
                  </div>

                  {alert.confirmed === null && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        onClick={(e) => handleConfirm(e, alert.alert_id, true)}
                        style={{ 
                          background: 'rgba(34, 197, 94, 0.1)', 
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          color: '#16a34a',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          flex: 1,
                          justifyContent: 'center'
                        }}
                      ><Check size={18} /> CONFIRM ALERT</button>
                      <button 
                        onClick={(e) => handleConfirm(e, alert.alert_id, false)}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#dc2626',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          flex: 1,
                          justifyContent: 'center'
                        }}
                      ><X size={18} /> DENY (FALSE ALARM)</button>
                    </div>
                  )}
                  {alert.confirmed === 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#16a34a', fontWeight: '600', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '6px' }}>
                      <Check size={18} /> Alert verified by farmer (reinforcement sent to fusion engine)
                    </div>
                  )}
                  {alert.confirmed === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#dc2626', fontWeight: '600', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
                      <X size={18} /> Alert denied by farmer (false positive logged)
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
