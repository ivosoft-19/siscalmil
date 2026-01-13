
import React from 'react';
import { Personnel, Absence, DailyScale, Rank, RankOrder } from '../types';

interface DashboardProps {
  personnel: Personnel[];
  absences: Absence[];
  scales: DailyScale[];
  onNavigate: (tab: 'dashboard' | 'personnel' | 'absences' | 'scale') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ personnel, absences, scales, onNavigate }) => {
  const activeAbsences = absences.filter(a => {
    const now = new Date();
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    return now >= start && now <= end;
  });

  const stats = [
    { 
      label: 'Efetivo Total', 
      value: personnel.length, 
      icon: 'fa-users', 
      color: 'bg-blue-500', 
      tab: 'personnel' as const,
      description: 'Gerenciar militares ativos'
    },
    { 
      label: 'Em Afastamento', 
      value: activeAbsences.length, 
      icon: 'fa-user-clock', 
      color: 'bg-amber-500', 
      tab: 'absences' as const,
      description: 'Ver dispensas e férias'
    },
    { 
      label: 'Escalas Salvas', 
      value: scales.length, 
      icon: 'fa-calendar-check', 
      color: 'bg-emerald-500', 
      tab: 'scale' as const,
      description: 'Acessar arquivo de escalas'
    },
    { 
      label: 'Militares Aptos', 
      value: personnel.filter(p => p.active).length, 
      icon: 'fa-user-shield', 
      color: 'bg-indigo-500', 
      tab: 'personnel' as const,
      description: 'Disponíveis para escala'
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Painel de Controle</h2>
        <p className="text-slate-500 mt-1">Visão geral do efetivo independente de guarnições fixas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate(stat.tab)}
            className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5 text-left transition-all hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-1"
          >
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110`}>
              <i className={`fas ${stat.icon} text-xl`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-none mb-1">{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {stat.description} <i className="fas fa-chevron-right ml-1"></i>
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center uppercase tracking-widest text-xs">
            <i className="fas fa-layer-group mr-2 text-emerald-600"></i>
            Distribuição por Patentes
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.values(Rank).reverse().map(rank => {
              const count = personnel.filter(p => p.rank === rank).length;
              if (count === 0) return null;
              const percentage = (count / (personnel.length || 1)) * 100;
              return (
                <div key={rank} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-600">{rank}</span>
                    <span className="text-slate-400">{count} militares</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3 border border-slate-100 p-0.5">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-sm" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-widest text-xs">
              <i className="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
              Afastamentos Hoje
            </h3>
            <button 
              onClick={() => onNavigate('absences')}
              className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline"
            >
              Ver Tudo
            </button>
          </div>
          
          {activeAbsences.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <i className="fas fa-check text-emerald-500"></i>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Efetivo Disponível</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Nenhum militar afastado hoje.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {activeAbsences.slice(0, 6).map(absence => {
                const person = personnel.find(p => p.id === absence.personnelId);
                return (
                  <div key={absence.id} className="py-4 flex items-center justify-between group cursor-pointer" onClick={() => onNavigate('absences')}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                        <i className="fas fa-user-clock"></i>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{person?.rank} {person?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{absence.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                         Até {new Date(absence.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
