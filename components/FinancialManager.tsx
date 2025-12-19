
import React, { useMemo, useState } from 'react';
import { Student, PaymentPlan } from '../types';

interface FinancialManagerProps {
  students: Student[];
  onUpdateTuition: (studentId: string, value: number) => void;
  onUpdatePlanType: (studentId: string, plan: PaymentPlan) => void;
  onRecordPayment: (studentId: string, month: string) => void;
  onRemovePayment: (studentId: string, month: string) => void;
}

const FinancialManager: React.FC<FinancialManagerProps> = ({ 
  students, 
  onUpdateTuition, 
  onUpdatePlanType,
  onRecordPayment,
  onRemovePayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');
  
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

  // Fixed: Removed 'Diário' from planOptions to match PaymentPlan type definition in types.ts
  const planOptions: PaymentPlan[] = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

  const studentsList = useMemo(() => {
    return students.filter(s => s.role === 'student');
  }, [students]);

  const stats = useMemo(() => {
    const totalExpected = studentsList.reduce((acc, s) => acc + s.monthlyTuition, 0);
    const totalCollected = studentsList.reduce((acc, s) => {
      return s.payments.includes(currentMonth) ? acc + s.monthlyTuition : acc;
    }, 0);
    const pendingCount = studentsList.filter(s => !s.payments.includes(currentMonth)).length;
    
    return {
      totalExpected,
      totalCollected,
      pendingCount,
      complianceRate: studentsList.length > 0 ? Math.round(( (studentsList.length - pendingCount) / studentsList.length ) * 100) : 0
    };
  }, [studentsList, currentMonth]);

  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const isPaid = s.payments.includes(currentMonth);
      const matchesStatus = filterStatus === 'Todos' || (filterStatus === 'Pago' ? isPaid : !isPaid);
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [studentsList, searchTerm, filterStatus, currentMonth]);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">Financeiro</h2>
        <p className="text-gray-500">Gestão de mensalidades e planos - {monthName}</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Arrecadado ({monthName})</p>
          <p className="text-3xl font-bold text-green-600">R$ {stats.totalCollected.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Expectativa Total</p>
          <p className="text-3xl font-bold text-gray-800">R$ {stats.totalExpected.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Pendentes</p>
          <p className="text-3xl font-bold text-orange-500">{stats.pendingCount} alunos</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Adimplência</p>
          <p className="text-3xl font-bold text-blue-600">{stats.complianceRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Buscar aluno..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5">🔍</span>
          </div>
          <div className="flex gap-2">
            {(['Todos', 'Pago', 'Pendente'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4">Aluno</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Valor (R$)</th>
                <th className="px-6 py-4">Status {monthName}</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map(student => {
                const isPaid = student.payments.includes(currentMonth);
                return (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={student.photoUrl} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-gray-800 block">{student.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">{student.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={student.planType || 'Mensal'}
                        onChange={(e) => onUpdatePlanType(student.id, e.target.value as PaymentPlan)}
                        className="p-1 border border-gray-200 rounded text-xs font-bold bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        {planOptions.map(plan => (
                          <option key={plan} value={plan}>{plan}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className="text-gray-400 text-xs font-bold">R$</span>
                         <input 
                          type="number" 
                          className="w-20 p-1 border border-gray-200 rounded text-sm font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                          value={student.monthlyTuition}
                          onChange={(e) => onUpdateTuition(student.id, parseFloat(e.target.value))}
                         />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => isPaid ? onRemovePayment(student.id, currentMonth) : onRecordPayment(student.id, currentMonth)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all active:scale-95 ${
                          isPaid 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                        }`}
                        title={isPaid ? 'Clique para marcar como pendente' : 'Clique para marcar como pago'}
                      >
                        {isPaid ? '✓ Pago' : '⚠ Pendente'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => isPaid ? onRemovePayment(student.id, currentMonth) : onRecordPayment(student.id, currentMonth)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 ${
                          isPaid 
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isPaid ? 'Reverter para Pendente' : 'Marcar como Pago'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="py-20 text-center text-gray-400 italic">
            Nenhum aluno encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialManager;
