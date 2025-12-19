
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { Student } from '../types';
import { BELT_COLORS_HEX } from '../constants';

interface AttendanceManagerProps {
  students: Student[];
  onRecordAttendance: (studentIds: string[]) => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ students, onRecordAttendance }) => {
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [selectedForRecord, setSelectedForRecord] = useState<string[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // History Mode states
  const [historySearch, setHistorySearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedForRecord(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSaveAttendance = () => {
    if (selectedForRecord.length === 0) return alert('Selecione ao menos um aluno.');
    onRecordAttendance(selectedForRecord);
    alert(`${selectedForRecord.length} presenças registradas com sucesso!`);
    setSelectedForRecord([]);
  };

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(historySearch.toLowerCase()) || 
      s.email.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [students, historySearch]);

  const studentStats = useMemo(() => {
    if (!selectedStudent) return null;

    const totalClasses = selectedStudent.attendanceHistory.length;
    const classesForNextStripe = (selectedStudent.currentStripes + 1) * 20;
    const remaining = Math.max(0, classesForNextStripe - totalClasses);
    const progressPercent = Math.min(100, Math.round((totalClasses / classesForNextStripe) * 100));

    // Attendance by month data
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    const chartData = months.map((m, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      const count = selectedStudent.attendanceHistory.filter(d => d.startsWith(`${currentYear}-${monthStr}`)).length;
      return { name: m, aulas: count };
    });

    return { totalClasses, remaining, progressPercent, chartData, classesForNextStripe };
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('record')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'record' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          REGISTRAR CHAMADA
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          ANALISAR FREQUÊNCIA
        </button>
      </div>

      {activeTab === 'record' ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Chamada do Dia</h2>
            <p className="text-gray-500 text-sm">Selecione os guerreiros que estão no tatame.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 tracking-widest">Data da Aula</label>
              <input 
                type="date" 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-1">
              <button 
                onClick={() => setSelectedForRecord(students.map(s => s.id))}
                className="text-blue-600 text-xs font-black uppercase hover:underline p-2"
              >
                Selecionar Todos
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {students.map(s => (
              <div 
                key={s.id} 
                onClick={() => toggleSelect(s.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedForRecord.includes(s.id) ? 'bg-blue-50 border-blue-200 shadow-sm scale-[1.01]' : 'bg-white border-gray-50 hover:border-gray-200'}`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedForRecord.includes(s.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                  {selectedForRecord.includes(s.id) && <span className="text-white text-xs">✓</span>}
                </div>
                <img src={s.photoUrl} className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200" />
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm leading-tight">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                     <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: BELT_COLORS_HEX[s.currentBelt] }} />
                     <p className="text-[10px] text-gray-400 font-bold uppercase">{s.currentBelt} • {s.currentStripes} Graus</p>
                  </div>
                </div>
                {s.attendanceHistory.includes(attendanceDate) && (
                   <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">JÁ REGISTRADO</span>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleSaveAttendance}
            disabled={selectedForRecord.length === 0}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 active:scale-95"
          >
            Finalizar Chamada ({selectedForRecord.length})
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">Pesquisar Histórico de Aluno</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Digite o nome do aluno..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  if (selectedStudentId) setSelectedStudentId(null);
                }}
              />
              <span className="absolute left-4 top-4.5 text-xl">🔍</span>
              
              {!selectedStudentId && historySearch.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 max-h-60 overflow-y-auto">
                  {filteredStudents.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setHistorySearch(s.name);
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                    >
                      <img src={s.photoUrl} className="w-8 h-8 rounded-full border border-gray-200" />
                      <div>
                        <p className="text-sm font-black text-gray-800">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{s.currentBelt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedStudent && studentStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
              {/* Left Column: Stats Cards */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={selectedStudent.photoUrl} className="w-16 h-16 rounded-full border-2 border-blue-500 shadow-lg" />
                    <div>
                      <h4 className="font-black text-xl leading-tight">{selectedStudent.name}</h4>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{selectedStudent.currentBelt}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Graus</span>
                        <span className="text-blue-400 font-black">{studentStats.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${studentStats.progressPercent}%` }} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Aulas</p>
                        <p className="text-xl font-black">{studentStats.totalClasses}</p>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                        <p className="text-[9px] font-black text-amber-500/70 uppercase mb-1">Faltam</p>
                        <p className="text-xl font-black text-amber-500">{studentStats.remaining}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Análise Técnica de Presença</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-500">Média Mensal</span>
                      <span className="text-sm font-black text-gray-900">
                        {(studentStats.totalClasses / 12).toFixed(1)} aulas
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-500">Próximo Grau</span>
                      <span className="text-sm font-black text-gray-900">{selectedStudent.currentStripes + 1}º Grau</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs font-bold text-gray-500">Requisito</span>
                      <span className="text-sm font-black text-blue-600">{studentStats.classesForNextStripe} aulas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Chart */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Frequência Evolutiva</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Consistência no Tatame em {new Date().getFullYear()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase">Aulas / Mês</span>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentStats.chartData}>
                      <defs>
                        <linearGradient id="colorAulas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="aulas" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAulas)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                     Último Treino: {selectedStudent.attendanceHistory.length > 0 ? new Date(selectedStudent.attendanceHistory[selectedStudent.attendanceHistory.length - 1]).toLocaleDateString() : 'Nenhum'}
                   </p>
                   <p className="text-xs font-black text-blue-600">OSS!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
