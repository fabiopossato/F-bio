
import React, { useState, useMemo } from 'react';
import { Student, BeltColor, Technique } from '../types';
import { BELT_COLORS_HEX } from '../constants';

interface TeamManagementProps {
  students: Student[];
  techniques: Technique[];
  onAddProfessor: (data: Partial<Student>) => void;
  onUpdateRole: (id: string, newRole: 'student' | 'admin') => void;
  onDeleteUser: (id: string) => void;
  onUpdateGraduation: (id: string, belt: BeltColor, stripes: number) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ 
  students, 
  techniques,
  onAddProfessor, 
  onUpdateRole, 
  onDeleteUser,
  onUpdateGraduation
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const ADULT_BELTS: BeltColor[] = [
    'Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 
    'Vermelha e Preta', 'Vermelha e Branca', 'Vermelha'
  ];
  
  const YOUTH_BELTS: BeltColor[] = [
    'Branca', 
    'Cinza e Branca', 'Cinza', 'Cinza e Preta',
    'Amarela e Branca', 'Amarela', 'Amarela e Preta',
    'Laranja e Branca', 'Laranja', 'Laranja e Preta',
    'Verde e Branca', 'Verde', 'Verde e Preta'
  ];

  const professors = useMemo(() => students.filter(s => s.role === 'admin'), [students]);
  const onlyStudents = useMemo(() => students.filter(s => s.role === 'student'), [students]);

  const filteredStudents = useMemo(() => {
    return onlyStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [onlyStudents, searchTerm]);

  const eligibleStudents = useMemo(() => {
    return onlyStudents.map(student => {
      const classesForNextStripe = (student.currentStripes + 1) * 20;
      const stripeProgress = Math.min(Math.round((student.attendanceHistory.length / classesForNextStripe) * 100), 100);
      const isReadyForStripe = student.attendanceHistory.length >= classesForNextStripe && student.currentStripes < 4;

      const techInCurrentBelt = techniques.filter(t => t.beltRequired === student.currentBelt);
      const masteredInCurrentBelt = student.masteredTechniques.filter(id => 
        techInCurrentBelt.some(t => t.id === id)
      );
      const techProgress = techInCurrentBelt.length > 0 ? Math.round((masteredInCurrentBelt.length / techInCurrentBelt.length) * 100) : 0;
      const isReadyForBelt = student.currentStripes === 4 && techProgress >= 80;

      const currentList = student.category === 'Infantil' ? YOUTH_BELTS : ADULT_BELTS;
      const currentIndex = currentList.indexOf(student.currentBelt);
      const nextBelt = currentIndex < currentList.length - 1 ? currentList[currentIndex + 1] : null;

      // Reason for notification
      let reason = "";
      if (isReadyForBelt) reason = "Requisitos de Faixa atingidos (4 Graus + Técnicas)";
      else if (isReadyForStripe) reason = `Meta de ${classesForNextStripe} aulas atingida (${student.currentStripes + 1}º Grau)`;

      return {
        ...student,
        stripeProgress,
        techProgress,
        isReadyForStripe,
        isReadyForBelt,
        nextBelt,
        reason
      };
    }).filter(s => s.isReadyForStripe || s.isReadyForBelt);
  }, [onlyStudents, techniques]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return alert('Preencha todos os campos');
    onAddProfessor({ ...formData, role: 'admin' });
    setIsAdding(false);
    setFormData({ name: '', email: '', password: '' });
  };

  const handleQuickPromote = (student: any) => {
    if (student.isReadyForBelt && student.nextBelt) {
      if (confirm(`Graduar ${student.name} para a Faixa ${student.nextBelt}?`)) {
        onUpdateGraduation(student.id, student.nextBelt, 0);
      }
    } else if (student.isReadyForStripe) {
      if (confirm(`Adicionar o ${student.currentStripes + 1}º Grau para ${student.name}?`)) {
        onUpdateGraduation(student.id, student.currentBelt, student.currentStripes + 1);
      }
    }
  };

  const GraduationSelector = ({ person }: { person: Student }) => {
    const beltOptions = person.category === 'Infantil' ? YOUTH_BELTS : ADULT_BELTS;
    const isReady = eligibleStudents.some(es => es.id === person.id);
    
    return (
      <div className="flex items-center gap-2">
        <select 
          value={person.currentBelt}
          onChange={(e) => onUpdateGraduation(person.id, e.target.value as BeltColor, person.currentStripes)}
          className={`text-xs border rounded p-1 font-bold outline-none focus:ring-1 focus:ring-blue-500 max-w-[120px] ${isReady ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
        >
          {beltOptions.map(belt => <option key={belt} value={belt}>{belt}</option>)}
        </select>
        <select 
          value={person.currentStripes}
          onChange={(e) => onUpdateGraduation(person.id, person.currentBelt, parseInt(e.target.value))}
          className={`text-xs border rounded p-1 font-bold outline-none focus:ring-1 focus:ring-blue-500 ${isReady ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>{s} Graus</option>)}
        </select>
        {isReady && <span className="text-red-500 animate-pulse" title="Pronto para graduar!">🔔</span>}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestão da Academia</h2>
          <p className="text-gray-500">Administre sua equipe e acompanhe as graduações.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
        >
          {isAdding ? 'Cancelar' : '➕ Novo Professor'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Professor</label>
            <input 
              type="text" 
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Rickson Gracie"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
            <input 
              type="email" 
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="professor@bjj.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha Inicial</label>
            <input 
              type="password" 
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••"
            />
          </div>
          <button type="submit" className="bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition">
            Confirmar Cadastro
          </button>
        </form>
      )}

      {/* Graduation Notifications Section */}
      {eligibleStudents.length > 0 && (
        <section className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 animate-in fade-in slide-in-from-left-4">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">🔔</div>
             <div>
               <h3 className="text-xl font-bold text-blue-900">Alunos Prontos para Graduar ({eligibleStudents.length})</h3>
               <p className="text-blue-700/70 text-sm font-medium">Requisitos oficiais IBJJF/CBJJ atingidos.</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleStudents.map(student => (
              <div key={student.id} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <img src={student.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" />
                    <div>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{student.currentBelt} - {student.currentStripes} Graus</p>
                    </div>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg mb-4 border border-red-100">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-tight">Motivo do Alerta:</p>
                    <p className="text-[11px] font-medium text-red-800">{student.reason}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-5">
                   <div>
                     <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className="text-gray-400">Progresso de Aulas</span>
                        <span className="text-blue-600">{student.attendanceHistory.length} / {(student.currentStripes + 1) * 20}</span>
                     </div>
                     <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all" style={{ width: `${student.stripeProgress}%` }} />
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                        <span className="text-gray-400">Domínio Técnico</span>
                        <span className="text-green-600">{student.techProgress}%</span>
                     </div>
                     <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full transition-all" style={{ width: `${student.techProgress}%` }} />
                     </div>
                   </div>
                </div>

                <button 
                  onClick={() => handleQuickPromote(student)}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 active:scale-95"
                >
                  {student.isReadyForBelt && student.nextBelt ? `Graduar para Faixa ${student.nextBelt}` : 'Confirmar Próximo Grau'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Professors List */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-1">
          👨‍🏫 Corpo Docente <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{professors.length}</span>
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Professor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Graduação</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {professors.map(prof => (
                <tr key={prof.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={prof.photoUrl} className="w-10 h-10 rounded-full object-cover bg-gray-100 shadow-sm" />
                      <div>
                        <span className="font-bold text-gray-800 block">{prof.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{prof.academyName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <GraduationSelector person={prof} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase border border-blue-100">
                      Administrador
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    {prof.email !== 'admin@bjj.com' && (
                      <button 
                        onClick={() => onDeleteUser(prof.id)}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Students List */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🥋 Alunos <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{onlyStudents.length}</span>
          </h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar aluno..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none w-full md:w-80 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Aluno</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Graduação</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">Frequência</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.photoUrl} className="w-10 h-10 rounded-full object-cover bg-gray-100 shadow-sm" />
                      <div>
                        <span className="font-bold text-gray-800 block text-sm">{student.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px] block">{student.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <GraduationSelector person={student} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-50 text-green-700 font-bold px-2 py-1 rounded text-xs border border-green-100">
                      {student.attendanceHistory.length} aulas
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button 
                      onClick={() => onUpdateRole(student.id, 'admin')}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Promover
                    </button>
                    <button 
                      onClick={() => onDeleteUser(student.id)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TeamManagement;
