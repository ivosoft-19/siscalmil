
import React, { useState, useEffect, useMemo } from 'react';
import { Personnel, Absence, DailyScale, Role, RankOrder, Rank, REST_DAYS_REQUIRED } from '../types';
import { getSmartScaleOptimization } from '../geminiService';

interface ScaleGeneratorProps {
  personnel: Personnel[];
  absences: Absence[];
  scales: DailyScale[];
  onSaveScale: (s: DailyScale) => void;
}

const ScaleGenerator: React.FC<ScaleGeneratorProps> = ({ personnel, absences, scales, onSaveScale }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentScale, setCurrentScale] = useState<DailyScale | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const existing = scales.find(s => s.date === selectedDate);
    if (existing) {
      setCurrentScale(existing);
    } else {
      generateAutoScaleForDate(selectedDate);
    }
  }, [selectedDate, scales]);

  const getDaysSinceLastService = (personId: string, targetDateStr: string) => {
    const targetDate = new Date(targetDateStr + 'T12:00:00');
    let lastServiceDate: Date | null = null;
    const sortedScales = [...scales]
      .filter(s => s.date < targetDateStr)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const scale of sortedScales) {
      const worked = Object.values(scale.assignments).includes(personId);
      if (worked) {
        lastServiceDate = new Date(scale.date + 'T12:00:00');
        break;
      }
    }
    if (!lastServiceDate) return Infinity;
    const diffTime = targetDate.getTime() - lastServiceDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEligiblePersonnel = (dateStr: string) => {
    return personnel.filter(p => {
      const onAbsence = absences.some(abs => {
        const start = new Date(abs.startDate + 'T00:00:00');
        const end = new Date(abs.endDate + 'T23:59:59');
        const d = new Date(dateStr + 'T12:00:00');
        return d >= start && d <= end && abs.personnelId === p.id;
      });
      if (onAbsence || !p.active) return false;
      const daysSince = getDaysSinceLastService(p.id, dateStr);
      return daysSince >= REST_DAYS_REQUIRED;
    });
  };

  const eligiblePersonnel = useMemo(() => getEligiblePersonnel(selectedDate), [personnel, absences, scales, selectedDate]);

  const generateAutoScaleForDate = (dateStr: string) => {
    const available = getEligiblePersonnel(dateStr);
    const sorted = [...available].sort((a, b) => RankOrder[b.rank] - RankOrder[a.rank]);
    const usedIds = new Set<string>();
    const getFirstApt = (role: Role) => {
      const found = sorted.find(p => p.roles.includes(role) && !usedIds.has(p.id));
      if (found) usedIds.add(found.id);
      return found?.id || null;
    };
    const assignments: Record<Role, string | null> = {
      [Role.COMANDANTE]: getFirstApt(Role.COMANDANTE),
      [Role.AUXILIAR]: getFirstApt(Role.AUXILIAR),
      [Role.MOTORISTA]: getFirstApt(Role.MOTORISTA),
      [Role.PATRULHEIRO]: getFirstApt(Role.PATRULHEIRO),
      [Role.PERMANENCIA]: getFirstApt(Role.PERMANENCIA),
    };
    setCurrentScale({
      date: dateStr,
      assignments,
      isCustom: false,
      modifiedBy: 'Sargentiante (Sistema)',
      modifiedAt: new Date().toISOString()
    });
  };

  const generateRandomScale = () => {
    const available = [...getEligiblePersonnel(selectedDate)];
    // Embaralhar aleatoriamente
    const shuffled = available.sort(() => Math.random() - 0.5);
    const usedIds = new Set<string>();
    
    const getFirstRandomApt = (role: Role) => {
      const found = shuffled.find(p => p.roles.includes(role) && !usedIds.has(p.id));
      if (found) usedIds.add(found.id);
      return found?.id || null;
    };

    const assignments: Record<Role, string | null> = {
      [Role.COMANDANTE]: getFirstRandomApt(Role.COMANDANTE),
      [Role.AUXILIAR]: getFirstRandomApt(Role.AUXILIAR),
      [Role.MOTORISTA]: getFirstRandomApt(Role.MOTORISTA),
      [Role.PATRULHEIRO]: getFirstRandomApt(Role.PATRULHEIRO),
      [Role.PERMANENCIA]: getFirstRandomApt(Role.PERMANENCIA),
    };

    setCurrentScale({
      date: selectedDate,
      assignments,
      isCustom: true,
      modifiedBy: 'Sargentiante (Sorteio)',
      modifiedAt: new Date().toISOString()
    });
    setAiAnalysis("Escala gerada via sorteio aleatório entre os militares aptos.");
  };

  const handleAiOptimize = async () => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const result = await getSmartScaleOptimization(eligiblePersonnel, selectedDate, "Equipe Operacional Dinâmica");
      setCurrentScale({
        date: selectedDate,
        assignments: result.assignments as Record<Role, string>,
        isCustom: true,
        modifiedBy: 'Sargentiante (IA)',
        modifiedAt: new Date().toISOString()
      });
      setAiAnalysis(result.reasoning);
    } catch (err) {
      alert("Erro ao otimizar escala via IA. Tente fazer a seleção manual.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualChange = (role: Role, personId: string) => {
    if (!currentScale) return;
    setCurrentScale({
      ...currentScale,
      assignments: { ...currentScale.assignments, [role]: personId === "" ? null : personId },
      isCustom: true,
      modifiedBy: 'Sargentiante (Manual)',
      modifiedAt: new Date().toISOString()
    });
  };

  const save = () => {
    if (currentScale) {
      onSaveScale(currentScale);
      alert("Escala de serviço salva com sucesso.");
    }
  };

  const handleEditPastScale = (date: string) => {
    setSelectedDate(date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedSavedScales = useMemo(() => {
    return [...scales].sort((a, b) => b.date.localeCompare(a.date));
  }, [scales]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg border-l-4 border-emerald-500">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/20 p-1.5 rounded-md"><i className="fas fa-history text-emerald-400"></i></div>
          <div>
            <span className="text-xs font-black uppercase block">Gestão de Folga 96h</span>
            <span className="text-[10px] text-slate-400">Escalando militares disponíveis há mais de {REST_DAYS_REQUIRED} dias.</span>
          </div>
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center">
            <i className="fas fa-calendar-check mr-3 text-emerald-600"></i>
            Configurar Serviço
          </h2>
          <p className="text-slate-500 mt-1">Selecione qualquer militar disponível no banco para compor a equipe.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Data:</label>
          <input type="date" className="p-1 outline-none font-bold text-slate-700 bg-transparent text-sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Disponibilidade Geral</span>
                <h3 className="text-3xl font-black">Equipe do Dia</h3>
                <p className="mt-3 text-slate-400 font-medium">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl text-right border border-white/5">
                <p className="text-[10px] font-bold uppercase text-emerald-400">Militares Aptos Hoje</p>
                <p className="text-3xl font-black">{eligiblePersonnel.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center bg-slate-50/30 gap-2">
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Escala de Postos</h4>
              <div className="flex space-x-2">
                <button 
                  onClick={generateRandomScale} 
                  disabled={eligiblePersonnel.length === 0}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50 transition-all flex items-center"
                >
                  <i className="fas fa-dice mr-2"></i>
                  Sorteio Aleatório
                </button>
                <button onClick={handleAiOptimize} disabled={loading || eligiblePersonnel.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50 transition-all flex items-center">
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-magic mr-2"></i>}
                  Otimizar via IA
                </button>
              </div>
            </div>

            <div className="p-8 space-y-4">
              {Object.values(Role).map(role => {
                const aptOptions = eligiblePersonnel.filter(p => p.roles.includes(role));
                return (
                  <div key={role} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center space-x-4 min-w-[200px]">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        role === Role.COMANDANTE ? 'bg-indigo-100 text-indigo-600' :
                        role === Role.MOTORISTA ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        <i className={`fas ${
                          role === Role.MOTORISTA ? 'fa-car' : 
                          role === Role.COMANDANTE ? 'fa-user-shield' : 
                          role === Role.AUXILIAR ? 'fa-user-plus' :
                          role === Role.PERMANENCIA ? 'fa-clock' : 'fa-crosshairs'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role}</p>
                        <p className="text-xs font-bold text-slate-700">Responsável 24h</p>
                      </div>
                    </div>
                    <div className="flex-1 md:max-w-md">
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        value={currentScale?.assignments[role] || ''}
                        onChange={(e) => handleManualChange(role, e.target.value)}
                      >
                        <option value="">-- Selecione o militar --</option>
                        {aptOptions.map(p => {
                          const daysSince = getDaysSinceLastService(p.id, selectedDate);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.rank} {p.name} - folga: {daysSince === Infinity ? 'Nova' : `${daysSince}d`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 text-right">
              <button onClick={save} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-900/20 transition-all active:scale-95">
                Salvar Escala Operacional
              </button>
            </div>
          </div>
          
          {aiAnalysis && (
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl animate-fadeIn">
              <h5 className="text-indigo-900 font-black text-xs uppercase mb-2 flex items-center">
                <i className="fas fa-comment-dots mr-2"></i> Notas da Geração
              </h5>
              <p className="text-indigo-800 text-sm italic">"{aiAnalysis}"</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Afastamentos de Hoje</h4>
            <div className="space-y-3">
              {absences.filter(abs => {
                 const d = new Date(selectedDate + 'T12:00:00');
                 return d >= new Date(abs.startDate) && d <= new Date(abs.endDate);
              }).map(abs => {
                const p = personnel.find(per => per.id === abs.personnelId);
                return (
                  <div key={abs.id} className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
                    <p className="font-black text-red-900">{p?.rank} {p?.name}</p>
                    <p className="text-red-700 uppercase font-bold text-[10px]">{abs.reason}</p>
                  </div>
                );
              })}
              {absences.filter(abs => {
                 const d = new Date(selectedDate + 'T12:00:00');
                 return d >= new Date(abs.startDate) && d <= new Date(abs.endDate);
              }).length === 0 && <p className="text-center text-slate-400 text-[10px] font-bold py-4">Nenhum afastamento</p>}
            </div>
          </div>
          
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
            <h4 className="font-black text-emerald-800 uppercase text-xs mb-3 flex items-center">
              <i className="fas fa-shield-alt mr-2"></i> Rodízio Justo
            </h4>
            <p className="text-emerald-700 text-[10px] leading-relaxed">
              O botão de sorteio utiliza os militares aptos no banco de dados, garantindo que ninguém trabalhe fora do intervalo de 96 horas. Utilize-o para criar escalas variadas.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-px bg-slate-200 flex-1"></div>
          <h3 className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Histórico de Escalas Salvas</h3>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedSavedScales.map(scale => (
            <div key={scale.date} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-slate-800 text-lg">
                    {new Date(scale.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {scale.modifiedBy || 'Sistema'} em {scale.modifiedAt ? new Date(scale.modifiedAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <button 
                  onClick={() => handleEditPastScale(scale.date)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                  title="Editar Escala"
                >
                  <i className="fas fa-edit"></i>
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(scale.assignments).map(([role, personId]) => {
                  const person = personnel.find(p => p.id === personId);
                  return (
                    <div key={role} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/50">
                      <span className="font-bold text-slate-400 uppercase text-[9px] tracking-tighter w-20">{role}</span>
                      <span className="font-black text-slate-700 truncate flex-1 text-right">
                        {person ? `${person.rank} ${person.name}` : 'NÃO ESCALADO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ScaleGenerator;
