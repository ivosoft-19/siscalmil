
import React, { useState, useRef } from 'react';
import { Absence, Personnel } from '../types';

interface AbsenceManagerProps {
  absences: Absence[];
  personnel: Personnel[];
  onAdd: (a: Absence) => void;
  onDelete: (id: string) => void;
}

const AbsenceManager: React.FC<AbsenceManagerProps> = ({ absences, personnel, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAbsence, setNewAbsence] = useState<Partial<Absence>>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: 'Férias'
  });

  const handleAdd = () => {
    if (newAbsence.personnelId && newAbsence.startDate && newAbsence.endDate) {
      onAdd({
        ...newAbsence as Absence,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsAdding(false);
    }
  };

  const exportToCSV = () => {
    if (absences.length === 0) {
      alert("Não há afastamentos para exportar.");
      return;
    }
    const headers = ['ID Militar', 'Patente', 'Nome Guerra', 'Motivo', 'Início', 'Fim'];
    const rows = absences.map(abs => {
      const p = personnel.find(per => per.id === abs.personnelId);
      return [
        abs.personnelId,
        p?.rank || '-',
        p?.name || '-',
        abs.reason,
        abs.startDate,
        abs.endDate
      ];
    });
    const csvContent = "\ufeff" + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Afastamentos_SiscalMil_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return;

      let count = 0;
      lines.slice(1).forEach((line) => {
        const parts = line.split(/[;,]/);
        if (parts.length >= 6) {
          const [pId, , , reason, start, end] = parts.map(p => p.trim());
          // Verifica se o militar existe no sistema
          if (personnel.some(p => p.id === pId)) {
            onAdd({
              id: Math.random().toString(36).substr(2, 9),
              personnelId: pId,
              reason: reason || 'Importado',
              startDate: start,
              endDate: end
            });
            count++;
          }
        }
      });
      alert(`Importação concluída: ${count} afastamentos registrados.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Afastamentos</h2>
          <p className="text-slate-500">Controle de licenças, férias e dispensas médicas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv,.txt" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-slate-200 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm hover:bg-slate-50 transition-all"
          >
            <i className="fas fa-file-import"></i>
            <span>Importar</span>
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm hover:bg-slate-50 transition-all"
          >
            <i className="fas fa-download"></i>
            <span>Exportar</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <i className="fas fa-calendar-plus"></i>
            <span>Novo Afastamento</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Militar</th>
              <th className="px-6 py-4">Motivo</th>
              <th className="px-6 py-4">Início</th>
              <th className="px-6 py-4">Fim</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {absences.map(abs => {
              const person = personnel.find(p => p.id === abs.personnelId);
              return (
                <tr key={abs.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{person?.rank} {person?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{person?.id}</p>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded uppercase text-slate-600">{abs.reason}</span></td>
                  <td className="px-6 py-4 font-medium text-slate-600">{new Date(abs.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">{new Date(abs.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDelete(abs.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
            {absences.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <i className="fas fa-calendar-day text-4xl mb-3 opacity-20 block"></i>
                  Nenhum registro de afastamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-widest">Lançar Afastamento</h3>
              <button onClick={() => setIsAdding(false)} className="hover:rotate-90 transition-transform"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Militar</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  onChange={(e) => setNewAbsence({...newAbsence, personnelId: e.target.value})}
                  value={newAbsence.personnelId || ''}
                >
                  <option value="">Selecione o militar...</option>
                  {[...personnel].sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.rank} {p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Data Início</label>
                  <input 
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                    value={newAbsence.startDate}
                    onChange={(e) => setNewAbsence({...newAbsence, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Data Fim</label>
                  <input 
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                    value={newAbsence.endDate}
                    onChange={(e) => setNewAbsence({...newAbsence, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Motivo / Tipo</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                  placeholder="Ex: Férias Regulamentares"
                  value={newAbsence.reason}
                  onChange={(e) => setNewAbsence({...newAbsence, reason: e.target.value})}
                />
              </div>

              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-xs rounded-2xl transition-all shadow-lg shadow-amber-900/20 active:scale-95"
              >
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceManager;
