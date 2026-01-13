
import React, { useState, useEffect } from 'react';
import { Personnel, Absence, DailyScale } from './types';
import { MOCK_PERSONNEL } from './constants';
import Dashboard from './components/Dashboard';
import PersonnelList from './components/PersonnelList';
import AbsenceManager from './components/AbsenceManager';
import ScaleGenerator from './components/ScaleGenerator';

type TabType = 'dashboard' | 'personnel' | 'absences' | 'scale';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    const saved = localStorage.getItem('mil_personnel');
    // Se saved for null, usa Mock. Se for "[]", usa [].
    return saved !== null ? JSON.parse(saved) : MOCK_PERSONNEL;
  });
  const [absences, setAbsences] = useState<Absence[]>(() => {
    const saved = localStorage.getItem('mil_absences');
    return saved ? JSON.parse(saved) : [];
  });
  const [scales, setScales] = useState<DailyScale[]>(() => {
    const saved = localStorage.getItem('mil_scales');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mil_personnel', JSON.stringify(personnel));
  }, [personnel]);

  useEffect(() => {
    localStorage.setItem('mil_absences', JSON.stringify(absences));
  }, [absences]);

  useEffect(() => {
    localStorage.setItem('mil_scales', JSON.stringify(scales));
  }, [scales]);

  const addPersonnel = (p: Personnel) => setPersonnel([...personnel, p]);
  const bulkAddPersonnel = (list: Personnel[]) => setPersonnel([...personnel, ...list]);
  const updatePersonnel = (p: Personnel) => setPersonnel(personnel.map(item => item.id === p.id ? p : item));
  const removePersonnel = (id: string) => setPersonnel(personnel.filter(p => p.id !== id));
  
  const clearAllData = () => {
    // Limpeza "Nuclear": apaga tudo para garantir que o sistema reinicie limpo
    setPersonnel([]);
    setAbsences([]);
    setScales([]);
    localStorage.removeItem('mil_personnel');
    localStorage.removeItem('mil_absences');
    localStorage.removeItem('mil_scales');
  };

  const addAbsence = (a: Absence) => setAbsences([...absences, a]);
  const removeAbsence = (id: string) => setAbsences(absences.filter(a => a.id !== id));

  const upsertScale = (s: DailyScale) => {
    const exists = scales.findIndex(item => item.date === s.date);
    if (exists > -1) {
      const newScales = [...scales];
      newScales[exists] = s;
      setScales(newScales);
    } else {
      setScales([...scales, s]);
    }
  };

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0 sticky top-0 md:h-screen z-50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <i className="fas fa-shield-halved text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">SiscalMil</h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Gestão de Escalas</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon="fa-chart-line" 
            label="Visão Geral" 
          />
          <NavItem 
            active={activeTab === 'scale'} 
            onClick={() => setActiveTab('scale')} 
            icon="fa-calendar-check" 
            label="Escala Diária" 
          />
          <NavItem 
            active={activeTab === 'personnel'} 
            onClick={() => setActiveTab('personnel')} 
            icon="fa-users" 
            label={`Efetivo (${personnel.length})`} 
          />
          <NavItem 
            active={activeTab === 'absences'} 
            onClick={() => setActiveTab('absences')} 
            icon="fa-calendar-times" 
            label="Afastamentos" 
          />
        </div>

        <div className="p-4 bg-slate-800/50 text-xs text-slate-400 border-t border-slate-800">
          <p>© 2024 SiscalMil 24/96h</p>
          <p>Unidade Militar Modelo</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <Dashboard 
            personnel={personnel} 
            absences={absences} 
            scales={scales} 
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === 'personnel' && (
          <PersonnelList 
            personnel={personnel} 
            onAdd={addPersonnel} 
            onBulkAdd={bulkAddPersonnel}
            onUpdate={updatePersonnel} 
            onDelete={removePersonnel}
            onClearAll={clearAllData}
          />
        )}
        {activeTab === 'absences' && (
          <AbsenceManager 
            absences={absences} 
            personnel={personnel} 
            onAdd={addAbsence} 
            onDelete={removeAbsence} 
          />
        )}
        {activeTab === 'scale' && (
          <ScaleGenerator 
            personnel={personnel} 
            absences={absences} 
            scales={scales} 
            onSaveScale={upsertScale} 
          />
        )}
      </main>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
        : 'hover:bg-slate-800 text-slate-400 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} w-5`}></i>
    <span className="font-medium">{label}</span>
  </button>
);

export default App;
