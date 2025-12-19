
import React, { useMemo, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { Student, Technique, BeltColor } from '../types';
import { BELT_COLORS_HEX } from '../constants';

interface DashboardProps {
  user: Student;
  students: Student[];
  techniques: Technique[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, students, techniques }) => {
  const isStudent = user.role === 'student';
  const displayUser = user;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const monthsLabels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const masteredCount = useMemo(() => {
    return displayUser.masteredTechniques.length;
  }, [displayUser]);

  const totalTechniques = techniques.length;
  const masteredPercent = Math.round((masteredCount / totalTechniques) * 100);

  // Stats calculation for the student (Graduation Tracker)
  const studentGraduationStats = useMemo(() => {
    const totalClasses = displayUser.attendanceHistory.length;
    // Rule: Each stripe = 20 classes
    const classesForNextStripe = (displayUser.currentStripes + 1) * 20;
    const remaining = Math.max(0, classesForNextStripe - totalClasses);
    const progressPercent = Math.min(100, Math.round((totalClasses / classesForNextStripe) * 100));

    return { totalClasses, remaining, progressPercent, classesForNextStripe };
  }, [displayUser]);

  // Professor specific: Calculate students ready for graduation to show alerts
  const graduationAlerts = useMemo(() => {
    if (isStudent) return [];
    return students.filter(s => {
      if (s.role === 'admin') return false;
      const classesForNextStripe = (s.currentStripes + 1) * 20;
      const readyForStripe = s.attendanceHistory.length >= classesForNextStripe && s.currentStripes < 4;
      
      const techInCurrentBelt = techniques.filter(t => t.beltRequired === s.currentBelt);
      const masteredInCurrentBelt = s.masteredTechniques.filter(id => techInCurrentBelt.some(t => t.id === id));
      const techProgress = techInCurrentBelt.length > 0 ? (masteredInCurrentBelt.length / techInCurrentBelt.length) : 0;
      const readyForBelt = s.currentStripes === 4 && techProgress >= 0.8;
      
      return readyForStripe || readyForBelt;
    });
  }, [students, techniques, isStudent]);

  const attendanceData = useMemo(() => {
    if (selectedMonth === 'all') {
      return monthsLabels.map((label, index) => {
        const monthStr = (index + 1).toString().padStart(2, '0');
        const count = displayUser.attendanceHistory.filter(date => 
          date.startsWith(`${selectedYear}-${monthStr}`)
        ).length;
        return { name: label.substring(0, 3), aulas: count };
      });
    } else {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const data = [];
      const monthStr = (selectedMonth + 1).toString().padStart(2, '0');
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        const hasTrained = displayUser.attendanceHistory.some(date => 
          date === `${selectedYear}-${monthStr}-${dayStr}`
        );
        data.push({ 
          name: day.toString(), 
          aulas: hasTrained ? 1 : 0,
          label: `${day} de ${monthsLabels[selectedMonth]}`
        });
      }
      return data;
    }
  }, [displayUser.attendanceHistory, selectedYear, selectedMonth]);

  const beltDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      counts[s.currentBelt] = (counts[s.currentBelt] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const matRules = [
    { title: "Higiene em primeiro lugar", icon: "🧼", text: "Chegue limpo, com kimono lavado, unhas cortadas e bom cheiro." },
    { title: "Respeito sempre", icon: "🤝", text: "Trate todos com igualdade — do iniciante ao mestre. Humildade é a chave." },
    { title: "Técnica acima da força", icon: "🧠", text: "Use controle e inteligência. A técnica vence a força bruta." },
    { title: "Siga as regras", icon: "📜", text: "Disciplina no tatame: não saia sem avisar e mantenha o foco nas explicações." }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold text-gray-900">
              {isStudent ? `Olá, ${displayUser.name.split(' ')[0]}!` : `Olá, Mestre ${displayUser.name.split(' ')[0]}!`}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${displayUser.category === 'Infantil' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
              {displayUser.category}
            </span>
          </div>
          <p className="text-gray-500 font-medium">
            {user.academyName || 'Academia Independente'} • {displayUser.currentBelt} {displayUser.currentStripes} Graus
          </p>
        </div>
        
        {!isStudent && graduationAlerts.length > 0 && (
          <div className="flex animate-bounce">
            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
              <span>🔔</span> {graduationAlerts.length} Alunos prontos para graduar!
            </div>
          </div>
        )}
      </header>

      {/* Professor's Alert Section */}
      {!isStudent && graduationAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl shadow-sm">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
            <span className="text-xl">🔥</span> Alertas Prioritários de Graduação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {graduationAlerts.slice(0, 3).map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-red-200 flex items-center gap-3">
                <img src={s.photoUrl} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{s.name}</p>
                  <p className="text-[10px] text-red-600 font-bold uppercase">Meta atingida!</p>
                </div>
              </div>
            ))}
            {graduationAlerts.length > 3 && (
              <div className="flex items-center justify-center p-4 bg-white/50 rounded-2xl border border-dashed border-red-200">
                <span className="text-xs font-bold text-red-400">+{graduationAlerts.length - 3} outros alunos</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-widest">Domínio Técnico</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-blue-600">{masteredPercent}%</span>
            <span className="text-gray-400 mb-1 font-bold text-xs">CONCLUÍDO</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${masteredPercent}%` }}></div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold mt-2 text-right">{masteredCount} de {totalTechniques} técnicas</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
          <h3 className="text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest">Meta de Graus</h3>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-amber-400">{studentGraduationStats.progressPercent}%</span>
              <span className="text-slate-400 mb-1 font-bold text-xs uppercase tracking-tighter">PRÓXIMO GRAU</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-amber-400/50 uppercase">Faltam</p>
               <p className="text-lg font-black leading-tight">{studentGraduationStats.remaining} aulas</p>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-amber-400 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-700" style={{ width: `${studentGraduationStats.progressPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-widest">Análise Técnica de Presença</h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center py-1 border-b border-gray-50">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Média Mensal</span>
               <span className="text-xs font-black text-gray-900">{(studentGraduationStats.totalClasses / 12).toFixed(1)} aulas</span>
             </div>
             <div className="flex justify-between items-center py-1 border-b border-gray-50">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
               <span className="text-xs font-black text-green-600">ASSÍDUO</span>
             </div>
             <div className="flex justify-between items-center py-1">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Total Geral</span>
               <span className="text-xs font-black text-blue-600">{studentGraduationStats.totalClasses} aulas</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900">Frequência Evolutiva</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Seu ritmo no tatame em {selectedYear}</p>
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black text-gray-700 uppercase outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Ano Inteiro</option>
              {monthsLabels.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorAulasDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
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
                />
                <Area type="monotone" dataKey="aulas" stroke="#2563eb" fill="url(#colorAulasDash)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
               Última Presença: {displayUser.attendanceHistory.length > 0 ? new Date(displayUser.attendanceHistory[displayUser.attendanceHistory.length - 1]).toLocaleDateString('pt-BR') : 'Sem registros'}
             </p>
             <p className="text-xs font-black text-blue-600">OSS!</p>
          </div>
        </div>

        {isStudent ? (
          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 scale-150 pointer-events-none">
               <span className="text-9xl">🥋</span>
            </div>
            <h3 className="font-black text-amber-500 uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
              <span className="text-lg">📜</span> Regras do Tatame & Conduta
            </h3>
            <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {matRules.map((r, i) => (
                <div key={i} className="group border-l-2 border-slate-700 pl-4 hover:border-amber-500 transition-colors">
                  <p className="font-black text-xs text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="group-hover:scale-110 transition-transform">{r.icon}</span> 
                    {r.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1.5">{r.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
               <p className="text-[10px] text-slate-400 font-bold italic leading-tight">
                 "O Jiu-Jitsu é uma ratoeira. A ratoeira só funciona quando o rato entra nela. Quando o rato está fora, ele está seguro." - Hélio Gracie
               </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-gray-900 font-black text-lg mb-2">Censo da Academia</h3>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-8">Distribuição de Graduações na Equipe</p>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={beltDistribution}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {beltDistribution.map((e, i) => <Cell key={i} fill={BELT_COLORS_HEX[e.name] || '#000'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
