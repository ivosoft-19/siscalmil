
import React, { useState, useRef, useMemo } from 'react';
import { Personnel, Rank, Role, RankOrder } from '../types';

interface PersonnelListProps {
  personnel: Personnel[];
  onAdd: (p: Personnel) => void;
  onBulkAdd: (list: Personnel[]) => void;
  onUpdate: (p: Personnel) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

type SortKey = 'rank' | 'fullName' | 'name' | 'canDrive';
type SortDir = 'asc' | 'desc';

const PersonnelList: React.FC<PersonnelListProps> = ({ personnel, onAdd, onBulkAdd, onUpdate, onDelete, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; dir: SortDir }>({ key: 'rank', dir: 'desc' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Personnel>>({
    fullName: '',
    name: '',
    rank: Rank.SOLDADO,
    roles: [Role.PATRULHEIRO],
    canDrive: false,
    active: true
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filtered = useMemo(() => {
    let result = personnel.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rank.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];

      if (sortConfig.key === 'rank') {
        valA = RankOrder[a.rank as Rank] || 0;
        valB = RankOrder[b.rank as Rank] || 0;
      }

      if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [personnel, searchTerm, sortConfig]);

  const exportToCSV = () => {
    if (personnel.length === 0) return false;
    try {
      const headers = ['Patente', 'Nome Completo', 'Nome de Guerra', 'Funções', 'Motorista'];
      const rows = personnel.map(p => [
        p.rank, 
        p.fullName, 
        p.name, 
        p.roles.join('|'), 
        p.canDrive ? 'Sim' : 'Não'
      ]);
      const csvContent = "\ufeff" + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Backup_Efetivo_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error("Erro ao exportar backup:", e);
      return false;
    }
  };

  const handleClearAll = () => {
    if (personnel.length === 0) {
      alert("O banco de dados já está vazio.");
      return;
    }
    const confirmClear = confirm("⚠️ ATENÇÃO: Esta ação apagará TODOS os militares, afastamentos e escalas salvas.\n\nUm backup em CSV será baixado automaticamente agora. Deseja prosseguir?");
    if (confirmClear) {
      const success = exportToCSV();
      if (success) {
        onClearAll();
        alert("Dados removidos com sucesso. O backup foi salvo na sua pasta de downloads.");
      } else {
        alert("Houve um erro ao gerar o backup. A limpeza foi cancelada por segurança.");
      }
    }
  };

  const openAddModal = () => {
    setEditingPerson(null);
    setFormData({ fullName: '', name: '', rank: Rank.SOLDADO, roles: [Role.PATRULHEIRO], canDrive: false, active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (person: Personnel) => {
    setEditingPerson(person);
    setFormData(person);
    setIsModalOpen(true);
  };

  const toggleRole = (role: Role) => {
    const currentRoles = formData.roles || [];
    setFormData({ ...formData, roles: currentRoles.includes(role) ? currentRoles.filter(r => r !== role) : [...currentRoles, role] });
  };

  const handleSubmit = () => {
    if (formData.name && formData.fullName && formData.roles && formData.roles.length > 0) {
      const finalCanDrive = formData.canDrive || formData.roles.includes(Role.MOTORISTA);
      const data = { ...formData, canDrive: finalCanDrive } as Personnel;
      if (editingPerson) onUpdate({ ...editingPerson, ...data });
      else onAdd({ ...data, id: Math.random().toString(36).substr(2, 9) });
      setIsModalOpen(false);
    } else alert("Preencha os campos obrigatórios.");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return;
      const newMembers: Personnel[] = [];
      lines.slice(1).forEach((line, index) => {
        const parts = line.split(/[;,]/);
        if (parts.length >= 4) {
          const [rankStr, fullName, warName, rolesStr, canDriveStr] = parts.map(p => p?.trim());
          const rank = Object.values(Rank).find(r => r.toLowerCase() === rankStr?.toLowerCase()) || Rank.SOLDADO;
          const roles = rolesStr?.split('|').map(r => r.trim()).map(r => Object.values(Role).find(e => e.toLowerCase() === r.toLowerCase())).filter(Boolean) as Role[];
          newMembers.push({
            id: `imp-${Date.now()}-${index}`,
            fullName: fullName || 'Militar Importado',
            name: warName || 'S/N',
            rank,
            roles: roles.length > 0 ? roles : [Role.PATRULHEIRO],
            canDrive: canDriveStr?.toUpperCase() === 'SIM' || roles.includes(Role.MOTORISTA),
            active: true
          });
        }
      });
      if (newMembers.length > 0) { onBulkAdd(newMembers); alert(`Sucesso: ${newMembers.length} militares importados.`); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const SortIcon = ({ column }: { column: SortKey }) => (
    <i className={`fas fa-sort${sortConfig.key === column ? (sortConfig.dir === 'asc' ? '-up' : '-down') : ''} ml-1 ${sortConfig.key === column ? 'text-emerald-600' : 'opacity-20'}`}></i>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Efetivo Militar</h2>
          <p className="text-slate-500">Gestão centralizada de {personnel.length} integrantes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,.txt" className="hidden" />
          <button onClick={handleClearAll} title="APAGAR TUDO E BAIXAR BACKUP" className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all border border-red-500 shadow-md active:scale-95">
            <i className="fas fa-trash-alt"></i>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm hover:bg-slate-50">
            <i className="fas fa-file-import"></i> <span>Importar</span>
          </button>
          <button onClick={exportToCSV} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm hover:bg-slate-50">
            <i className="fas fa-download"></i> <span>Exportar CSV</span>
          </button>
          <button onClick={openAddModal} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-all">
            <i className="fas fa-plus"></i> <span>Novo Militar</span>
          </button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Pesquisar por nome, guerra ou posto..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('rank')}>Posto <SortIcon column="rank" /></th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('fullName')}>Nome Completo <SortIcon column="fullName" /></th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>Guerra <SortIcon column="name" /></th>
              <th className="px-6 py-4">Aptidões</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-slate-700">{p.rank}</td>
                <td className="px-6 py-4 font-medium">{p.fullName}</td>
                <td className="px-6 py-4 italic text-slate-500">{p.name}</td>
                <td className="px-6 py-4 flex flex-wrap gap-1">
                  {p.roles.map(r => <span key={r} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase border border-indigo-100">{r}</span>)}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openEditModal(p)} className="text-slate-400 hover:text-emerald-600" title="Editar"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onDelete(p.id)} className="text-slate-400 hover:text-red-500" title="Remover"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
              <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                <h3 className="font-black uppercase text-sm tracking-widest">{editingPerson ? 'Editar' : 'Cadastrar'} Militar</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase">Nome Completo</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Guerra</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Patente</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value as Rank})}>{Object.values(Rank).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                </div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase">Aptidões Técnicas</label><div className="flex flex-wrap gap-2 mt-2">{Object.values(Role).map(r => <button key={r} onClick={() => toggleRole(r)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${formData.roles?.includes(r) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>{r}</button>)}</div></div>
                <button onClick={handleSubmit} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform">Finalizar Cadastro</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelList;
