import React, { useState } from 'react';
import Sidebar from './components/Sidebar';

// Panels
import Overview from './panels/Overview';
import ZoneMap from './panels/ZoneMap';
import SensorMonitoring from './panels/SensorMonitoring';
import DiseasePest from './panels/DiseasePest';
import GasSignature from './panels/GasSignature';
import FusionRisk from './panels/FusionRisk';
import AlertsVerification from './panels/AlertsVerification';
import IrrigationActions from './panels/IrrigationActions';
import ImpactComparison from './panels/ImpactComparison';
import SystemHealth from './panels/SystemHealth';

function App() {
  const [activePanel, setActivePanel] = useState('overview');

  const renderPanel = () => {
    switch(activePanel) {
      case 'overview': return <Overview />;
      case 'zonemap': return <ZoneMap />;
      case 'sensors': return <SensorMonitoring />;
      case 'diseasepest': return <DiseasePest />;
      case 'gas': return <GasSignature />;
      case 'fusion': return <FusionRisk />;
      case 'alerts': return <AlertsVerification />;
      case 'irrigation': return <IrrigationActions />;
      case 'impact': return <ImpactComparison />;
      case 'health': return <SystemHealth />;
      default: return <Overview />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      
      <main className="main-content fade-in" key={activePanel}>
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
