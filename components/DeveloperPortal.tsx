
import React, { useMemo, useState } from 'react';
import { Academy, Student, DB, AcademyPricing, PaymentPlan } from '../types';

interface DeveloperPortalProps {
  db: DB;
  onUpdateAcademyStatus: (academyId: string, status: 'active' | 'suspended') => void;
  onUpdateAcademyPricing: (academyId: string, pricing: AcademyPricing) => void;
  onUpdateAcademyPlan: (academyId: string, plan: PaymentPlan) => void;
  onToggleAcademyTrial: (academyId: string) => void;
  onLogout: () => void;
}

const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ 
  db, 
  onUpdateAcademyStatus, 
  onUpdateAcademyPricing, 
  onUpdateAcademyPlan,
  onToggleAcademyTrial,
  onLogout 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [tempPricing, setTempPricing] = useState<AcademyPricing | null>(null);

  const stats = useMemo(() => {
    const totalAcademies = db.academies.length;
    const activeAcademies = db.academies.filter(a => a.status === 'active').length;
    const mrr = db.academies.filter(a => a.status === 'active' && !a.isTrial).reduce((acc, a) => acc + a.subscriptionValue, 0);
    const totalStudents = db.students.filter(s => s.role === 'student').length;
    const trialsCount = db.academies.filter(a => a.isTrial).length;
    
    return { totalAcademies, activeAcademies, mrr, totalStudents, trialsCount };
  }, [db]);

  const filteredAcademies = useMemo(() => {
    return db.academies.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [db.academies, searchTerm]);

  const handleStartEditPricing = (academy: Academy) => {
    setEditingPricingId(academy.id);
    setTempPricing({ ...academy.pricing });
  };

  const handleSavePricing = () => {
    if (editingPricingId && tempPricing) {
      onUpdateAcademyPricing(editingPricingId, tempPricing);
      setEditingPricingId(null);
      setTempPricing(null);
    }
  };

  const planOptions: PaymentPlan[] = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

  const getRenewalStatusColor = (renewalDate: string) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (diffDays <= 5) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Master */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">DEV</div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Network Master Control</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Gestão Global de Licenciamento SaaS</p>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase">Servidor Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 text-slate-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            Encerrar Sessão Mestre
          </button>
        </header>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">MRR Atual (Planos Ativos)</p>
            <p className="text-4xl font-black text-purple-400">R$ {stats.mrr.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Academias (Ativas/Total)</p>
            <p className="text-4xl font-black text-blue-400">{stats.activeAcademies} / {stats.totalAcademies}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Unidades em Teste</p>
            <p className="text-4xl font-black text-emerald-400">{stats.trialsCount}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem]">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Alunos na Rede</p>
            <p className="text-4xl font-black text-amber-400">{stats.totalStudents}</p>
          </div>
        </div>

        {/* Academies Table */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between gap-6">
            <h3 className="text-xl font-black text-white">Diretório de Unidades</h3>
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Pesquisar academia..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano / Renovação</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tabela de Preços</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAcademies.map(academy => {
                  const studentCount = db.students.filter(s => s.academyName === academy.name && s.role === 'student').length;
                  const isEditing = editingPricingId === academy.id;
                  
                  return (
                    <tr key={academy.id} className={`hover:bg-purple-500/5 transition-colors ${isEditing ? 'bg-purple-500/10' : ''}`}>
                      <td className="px-8 py-6">
                        <span className="font-black text-white text-lg block">{academy.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="bg-slate-800 px-2 py-0.5 rounded text-[9px] font-black text-blue-400 uppercase">{studentCount} Alunos</span>
                           <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Fund. {new Date(academy.foundedDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-3">
                           <select 
                             className="bg-slate-900 border border-slate-700 text-white text-xs font-black p-2 rounded-xl outline-none focus:ring-1 focus:ring-purple-500 appearance-none cursor-pointer w-40"
                             value={academy.currentPlan}
                             onChange={(e) => onUpdateAcademyPlan(academy.id, e.target.value as PaymentPlan)}
                           >
                             {planOptions.map(plan => (
                               <option key={plan} value={plan}>{plan}</option>
                             ))}
                           </select>
                           <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getRenewalStatusColor(academy.nextRenewalDate)}`}>
                               Próx. Renovação: {new Date(academy.nextRenewalDate).toLocaleDateString()}
                             </span>
                             <p className="text-emerald-400 font-black text-[11px]">R$ {academy.subscriptionValue.toLocaleString('pt-BR')}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {planOptions.map(plan => (
                            <div key={plan} className={`bg-slate-950/50 px-2.5 py-1 rounded-lg border transition-all ${academy.currentPlan === plan ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-slate-800'}`}>
                               <p className={`text-[7px] font-black uppercase mb-0.5 ${academy.currentPlan === plan ? 'text-purple-400' : 'text-slate-500'}`}>{plan}</p>
                               <p className={`text-[10px] font-black ${academy.currentPlan === plan ? 'text-white' : 'text-slate-400'}`}>R$ {academy.pricing[plan].toLocaleString('pt-BR')}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className={`w-fit px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            academy.isTrial 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : academy.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {academy.isTrial ? 'Período de Teste' : academy.status === 'active' ? 'Ativa' : 'Suspensa'}
                          </span>
                          {academy.isTrial && academy.trialExpiration && (
                            <span className="text-[9px] text-indigo-500 font-bold uppercase">Expira {new Date(academy.trialExpiration).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right space-x-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button 
                            onClick={() => onToggleAcademyTrial(academy.id)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              academy.isTrial 
                              ? 'bg-slate-800 text-slate-400 border-slate-700' 
                              : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                            }`}
                          >
                            {academy.isTrial ? 'Finalizar Teste' : '🎁 Teste 30d'}
                          </button>
                          <button 
                            onClick={() => handleStartEditPricing(academy)}
                            className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition"
                          >
                            💸 Preços
                          </button>
                          <button 
                            onClick={() => onUpdateAcademyStatus(academy.id, academy.status === 'active' ? 'suspended' : 'active')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              academy.status === 'active' 
                              ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' 
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {academy.status === 'active' ? 'Suspender' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Editor Modal */}
        {editingPricingId && tempPricing && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl shadow-purple-500/10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Configuração de Planos</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mb-8">Personalizar valores de licenciamento da unidade</p>
              
              <div className="grid grid-cols-2 gap-6">
                {planOptions.map(plan => (
                  <div key={plan} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{plan}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-600 font-bold">R$</span>
                      <input 
                        type="number" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white font-black outline-none focus:ring-2 focus:ring-purple-500 transition"
                        value={tempPricing[plan]}
                        onChange={(e) => setTempPricing({ ...tempPricing, [plan]: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex gap-4">
                <button 
                  onClick={() => setEditingPricingId(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSavePricing}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white hover:bg-purple-500 shadow-xl shadow-purple-600/20 transition active:scale-95"
                >
                  Salvar Tabela
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center pb-12">
          <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.5em]">OSS Flow • Master Developer Environment • v4.0 (Cloud Enabled)</p>
        </footer>
      </div>
    </div>
  );
};

export default DeveloperPortal;
