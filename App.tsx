
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Technique, Academy, DB, BeltColor, StudentCategory, PaymentPlan, AcademyPricing } from './types';
import { getDB, updateStudent, saveDB } from './services/db';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TechniqueLibrary from './components/TechniqueLibrary';
import AttendanceManager from './components/AttendanceManager';
import ProfileEditor from './components/ProfileEditor';
import TeamManagement from './components/TeamManagement';
import FinancialManager from './components/FinancialManager';
import DeveloperPortal from './components/DeveloperPortal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [db, setDb] = useState<DB>({students: [], techniques: [], academies: []});
  const [view, setView] = useState<'dashboard' | 'library' | 'attendance' | 'profile' | 'team' | 'financial' | 'developer_portal'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Inicialização assíncrona do banco
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const data = await getDB();
      setDb(data);
      setIsLoading(false);
    };
    init();
  }, []);

  const calculateNextRenewal = (plan: PaymentPlan, startDate: Date = new Date()): string => {
    const date = new Date(startDate);
    switch (plan) {
      case 'Mensal': date.setDate(date.getDate() + 30); break;
      case 'Trimestral': date.setDate(date.getDate() + 90); break;
      case 'Semestral': date.setDate(date.getDate() + 180); break;
      case 'Anual': date.setDate(date.getDate() + 365); break;
    }
    return date.toISOString();
  };

  const syncData = async (newStudents: Student[], newTechniques: Technique[], newAcademies: Academy[]) => {
    setIsSyncing(true);
    await saveDB(newStudents, newTechniques, newAcademies);
    setDb({ students: newStudents, techniques: newTechniques, academies: newAcademies });
    setIsSyncing(false);
  };

  const visibleStudents = useMemo(() => {
    if (!currentUser || currentUser.role === 'developer') return [];
    return db.students.filter(s => s.academyName === currentUser.academyName);
  }, [db.students, currentUser]);

  const isAcademySuspended = useMemo(() => {
    if (!currentUser || currentUser.role === 'developer') return false;
    const academy = db.academies.find(a => a.name === currentUser.academyName);
    return academy?.status === 'suspended';
  }, [currentUser, db.academies]);

  const isDelinquent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return false;
    if (isAcademySuspended) return false;
    return !currentUser.payments.includes(currentMonth);
  }, [currentUser, currentMonth, isAcademySuspended]);

  const notificationCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'admin') return 0;
    return visibleStudents.filter(student => {
      if (student.role === 'admin') return false;
      const classesForNextStripe = (student.currentStripes + 1) * 20;
      return student.attendanceHistory.length >= classesForNextStripe && student.currentStripes < 4;
    }).length;
  }, [visibleStudents, currentUser]);

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'register_academy' | 'dev_login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [academyName, setAcademyName] = useState('');
  const [selectedAcademyName, setSelectedAcademyName] = useState('');
  const [selectedProfessorId, setSelectedProfessorId] = useState('');

  const resetAuthFields = () => {
    setEmail(''); setPassword(''); setName(''); setAge(''); setWeight(''); setAcademyName(''); setSelectedAcademyName(''); setSelectedProfessorId('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'dev_login') {
      if (email === 'fpo' && password === '2725') {
        const devUser: Student = {
          id: 'dev-master', name: 'Developer FPO', email: 'fpo@ossflow.com',
          age: 0, weight: 0, category: 'Adulto', currentBelt: 'Preta', currentStripes: 10,
          joinedDate: '2025-01-01', attendanceHistory: [], masteredTechniques: [],
          role: 'developer', monthlyTuition: 0, payments: [], planType: 'Anual'
        };
        setCurrentUser(devUser);
        setView('developer_portal');
        resetAuthFields();
      } else {
        alert('Credenciais Master inválidas.');
      }
      return;
    }

    const user = db.students.find(s => s.email === email && s.password === password);
    if (user) {
      setCurrentUser(user);
      resetAuthFields();
    } else {
      alert('Credenciais inválidas.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (db.students.some(s => s.email === email)) return alert('E-mail já cadastrado.');
    if (!selectedAcademyName || !selectedProfessorId) return alert('Selecione academia/professor.');
    
    const linkedProfessor = db.students.find(s => s.id === selectedProfessorId);
    const numericAge = parseInt(age);
    const numericWeight = parseFloat(weight);
    const category: StudentCategory = numericAge <= 15 ? 'Infantil' : 'Adulto';

    const newStudent: Student = {
      id: `s-${Date.now()}`, name, email, password,
      age: numericAge, weight: numericWeight, category,
      currentBelt: 'Branca', currentStripes: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      attendanceHistory: [], masteredTechniques: [], role: 'student',
      photoUrl: `https://picsum.photos/seed/${email}/200`,
      professorId: selectedProfessorId,
      academyName: linkedProfessor?.academyName || selectedAcademyName,
      monthlyTuition: category === 'Infantil' ? 120 : 150,
      payments: [], planType: 'Mensal'
    };

    const newStudents = [...db.students, newStudent];
    await syncData(newStudents, db.techniques, db.academies);
    setCurrentUser(newStudent);
    resetAuthFields();
  };

  const handleRegisterAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (db.students.some(s => s.email === email)) return alert('E-mail em uso.');
    const adminId = `admin-${Date.now()}`;
    const newAdmin: Student = {
      id: adminId, name, email, password, age: 30, weight: 80, category: 'Adulto',
      currentBelt: 'Preta', currentStripes: 1, joinedDate: new Date().toISOString().split('T')[0],
      attendanceHistory: [], masteredTechniques: db.techniques.map(t => t.id),
      role: 'admin', photoUrl: `https://picsum.photos/seed/${email}/200`,
      academyName: academyName, monthlyTuition: 0, payments: [], planType: 'Mensal'
    };
    const newAcademy: Academy = {
      id: `acc-${Date.now()}`, name: academyName,
      foundedDate: new Date().toISOString().split('T')[0], ownerId: adminId,
      status: 'active',
      pricing: { Mensal: 299.90, Trimestral: 799.90, Semestral: 1499.90, Anual: 2499.90 },
      currentPlan: 'Mensal',
      subscriptionValue: 299.90,
      isTrial: false,
      nextRenewalDate: calculateNextRenewal('Mensal')
    };
    const newStudents = [...db.students, newAdmin];
    const newAcademies = [...db.academies, newAcademy];
    await syncData(newStudents, db.techniques, newAcademies);
    setCurrentUser(newAdmin);
    resetAuthFields();
  };

  const handleUpdateAcademyStatus = async (id: string, status: 'active' | 'suspended') => {
    const newAcademies = db.academies.map(a => a.id === id ? { ...a, status } : a);
    await syncData(db.students, db.techniques, newAcademies);
  };

  const handleUpdateAcademyPricing = async (id: string, pricing: AcademyPricing) => {
    const newAcademies = db.academies.map(a => {
      if (a.id === id) return { ...a, pricing, subscriptionValue: pricing[a.currentPlan] };
      return a;
    });
    await syncData(db.students, db.techniques, newAcademies);
  };

  const handleUpdateAcademyPlan = async (id: string, plan: PaymentPlan) => {
    const newAcademies = db.academies.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          currentPlan: plan, 
          subscriptionValue: a.pricing[plan],
          nextRenewalDate: calculateNextRenewal(plan)
        };
      }
      return a;
    });
    await syncData(db.students, db.techniques, newAcademies);
  };

  const handleToggleAcademyTrial = async (id: string) => {
    const newAcademies = db.academies.map(a => {
      if (a.id === id) {
        const isCurrentlyTrial = a.isTrial;
        if (isCurrentlyTrial) {
          return { ...a, isTrial: false, trialExpiration: undefined, nextRenewalDate: calculateNextRenewal(a.currentPlan) };
        } else {
          const expiration = new Date();
          expiration.setDate(expiration.getDate() + 30);
          return { 
            ...a, 
            isTrial: true, 
            trialExpiration: expiration.toISOString(),
            nextRenewalDate: calculateNextRenewal(a.currentPlan, expiration)
          };
        }
      }
      return a;
    });
    await syncData(db.students, db.techniques, newAcademies);
  };

  const handleLogout = () => {
    setCurrentUser(null); setView('dashboard'); setAuthMode('login');
  };

  const handleToggleMastery = async (techId: string) => {
    if (!currentUser) return;
    const isMastered = currentUser.masteredTechniques.includes(techId);
    const newMastered = isMastered ? currentUser.masteredTechniques.filter(id => id !== techId) : [...currentUser.masteredTechniques, techId];
    const updated = { ...currentUser, masteredTechniques: newMastered };
    const newStudents = await updateStudent(updated);
    setCurrentUser(updated);
    setDb({ ...db, students: newStudents });
  };

  const handleToggleStudentMastery = async (studentId: string, techId: string) => {
    const student = db.students.find(s => s.id === studentId);
    if (!student) return;
    const isMastered = student.masteredTechniques.includes(techId);
    const newMastered = isMastered ? student.masteredTechniques.filter(id => id !== techId) : [...student.masteredTechniques, techId];
    const updated = { ...student, masteredTechniques: newMastered };
    const newStudents = await updateStudent(updated);
    if (currentUser?.id === studentId) setCurrentUser(updated);
    setDb({ ...db, students: newStudents });
  };

  const handleRecordAttendance = async (studentIds: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newStudents = db.students.map(s => {
      if (studentIds.includes(s.id)) return { ...s, attendanceHistory: [...s.attendanceHistory, today] };
      return s;
    });
    await syncData(newStudents, db.techniques, db.academies);
    if (currentUser && studentIds.includes(currentUser.id)) {
      setCurrentUser({ ...currentUser, attendanceHistory: [...currentUser.attendanceHistory, today] });
    }
  };

  const handleUpdateProfile = async (updated: Student) => {
    const newStudents = await updateStudent(updated);
    setCurrentUser(updated);
    setDb({ ...db, students: newStudents });
  };

  const handleUpdateGraduation = async (id: string, belt: BeltColor, stripes: number) => {
    const newStudents = db.students.map(s => s.id === id ? { ...s, currentBelt: belt, currentStripes: stripes } : s);
    await syncData(newStudents, db.techniques, db.academies);
    if (currentUser?.id === id) setCurrentUser({ ...currentUser, currentBelt: belt, currentStripes: stripes });
  };

  const handleRecordPayment = async (id: string, month: string) => {
    const newStudents = db.students.map(s => {
      if (s.id === id && !s.payments.includes(month)) return { ...s, payments: [...s.payments, month] };
      return s;
    });
    await syncData(newStudents, db.techniques, db.academies);
    if (currentUser?.id === id) setCurrentUser(newStudents.find(ns => ns.id === id) || null);
  };

  const handleRemovePayment = async (id: string, month: string) => {
    const newStudents = db.students.map(s => {
      if (s.id === id) return { ...s, payments: s.payments.filter(p => p !== month) };
      return s;
    });
    await syncData(newStudents, db.techniques, db.academies);
    if (currentUser?.id === id) setCurrentUser(newStudents.find(ns => ns.id === id) || null);
  };

  const handleAddTechnique = async (tech: Omit<Technique, 'id'>) => {
    const newTech: Technique = { ...tech, id: `t-${Date.now()}` };
    const newTechniques = [...db.techniques, newTech];
    await syncData(db.students, newTechniques, db.academies);
  };

  const handleUpdateTechnique = async (updated: Technique) => {
    const newTechniques = db.techniques.map(t => t.id === updated.id ? updated : t);
    await syncData(db.students, newTechniques, db.academies);
  };

  // UI DE LOADING GLOBAL
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black uppercase tracking-[0.2em]">Conectando à Nuvem OSS...</h2>
        <p className="text-slate-500 text-xs mt-2 animate-pulse uppercase font-bold tracking-widest">Sincronizando banco de dados global</p>
      </div>
    );
  }

  if (!currentUser) {
    const professors = db.students.filter(s => s.role === 'admin');
    const availableAcademies = db.academies;
    const filteredProfessors = selectedAcademyName ? professors.filter(p => p.academyName === selectedAcademyName) : [];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 relative">
        {/* ÍCONE DE STATUS DE CONEXÃO NUVEM */}
        <div className="absolute top-6 right-8 flex items-center gap-2 group cursor-help">
          <div className="flex flex-col items-end">
            <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${isSyncing ? 'text-blue-500' : 'text-emerald-500'}`}>
              {isSyncing ? 'Sincronizando' : 'Nuvem Ativa'}
            </span>
            <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">OSS-SERVER-ID: CLOUD-BR-01</span>
          </div>
          <div className="relative">
             <div className={`text-2xl transition-all duration-500 ${isSyncing ? 'animate-pulse scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]'}`}>
               {isSyncing ? '🔄' : '☁️'}
             </div>
             <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white transition-colors duration-500 ${isSyncing ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
          </div>
          
          {/* TOOLTIP ON HOVER */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 text-white p-3 rounded-xl text-[9px] font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 border border-slate-800">
            <p className="font-black text-blue-400 uppercase mb-1 tracking-widest">Status do Servidor</p>
            Conectado via protocolo OSS-Flow-SaaS. Todas as alterações são sincronizadas em tempo real com o banco de dados mestre.
          </div>
        </div>

        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
          {authMode === 'dev_login' && <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg ring-4 ring-opacity-50 ${authMode === 'dev_login' ? 'bg-purple-600 ring-purple-100' : 'bg-blue-600 ring-blue-50'}`}>OSS</div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">{authMode === 'dev_login' ? 'Dev Master' : 'OSS FLOW'}</h1>
            <p className="text-gray-500 text-sm">{authMode === 'login' ? 'Acesse seu Portal' : authMode === 'signup' ? 'Novo por aqui?' : authMode === 'dev_login' ? 'Área Restrita: Desenvolvedor' : 'Fundar Nova Academia'}</p>
          </div>
          
          <form onSubmit={authMode === 'register_academy' ? handleRegisterAcademy : authMode === 'signup' ? handleSignUp : handleLogin} className="space-y-4">
            {authMode === 'register_academy' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome da Academia</label>
                <input type="text" required placeholder="Gracie Barra..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={academyName} onChange={(e) => setAcademyName(e.target.value)} />
              </div>
            )}
            {(authMode === 'signup' || authMode === 'register_academy') && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{authMode === 'register_academy' ? 'Nome do Mestre' : 'Nome Completo'}</label>
                <input type="text" required placeholder="Seu nome" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Idade</label>
                    <input type="number" required placeholder="Anos" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={age} onChange={(e) => setAge(e.target.value)} min="4" max="100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Peso (kg)</label>
                    <input type="number" step="0.1" required placeholder="75.5" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Academia</label>
                  <select required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50 appearance-none" value={selectedAcademyName} onChange={(e) => { setSelectedAcademyName(e.target.value); setSelectedProfessorId(''); }}>
                    <option value="">Escolha</option>
                    {availableAcademies.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Professor</label>
                  <select required disabled={!selectedAcademyName} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50 appearance-none disabled:opacity-50" value={selectedProfessorId} onChange={(e) => setSelectedProfessorId(e.target.value)}>
                    <option value="">{selectedAcademyName ? 'Selecione' : 'Aguardando...'}</option>
                    {filteredProfessors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">{authMode === 'dev_login' ? 'Usuário Master' : 'E-mail'}</label>
              <input type={authMode === 'dev_login' ? 'text' : 'email'} required placeholder={authMode === 'dev_login' ? 'Login Dev' : 'seu@email.com'} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Senha</label>
              <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none transition bg-gray-50" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className={`w-full text-white py-4 rounded-xl font-black uppercase tracking-widest transition transform active:scale-95 shadow-lg mt-2 ${authMode === 'dev_login' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
              {authMode === 'login' ? 'Entrar' : authMode === 'signup' ? 'Cadastrar' : authMode === 'dev_login' ? 'Autenticação Master' : 'Fundar'}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); resetAuthFields(); }} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-800 transition text-center">{authMode === 'login' ? 'Sou Aluno e quero me cadastrar' : 'Já sou membro? Fazer login'}</button>
            <div className="flex justify-between gap-4">
              <button onClick={() => { setAuthMode('register_academy'); resetAuthFields(); }} className="flex-1 text-slate-400 text-[9px] font-black hover:text-slate-800 transition text-center uppercase tracking-widest border border-slate-100 py-3 rounded-xl hover:bg-slate-50">🏫 Registrar Academia</button>
              <button onClick={() => { setAuthMode('dev_login'); resetAuthFields(); }} className="flex-1 text-purple-400 text-[9px] font-black hover:text-purple-600 transition text-center uppercase tracking-widest border border-purple-50 py-3 rounded-xl hover:bg-purple-50/50">⚙️ Acesso Dev</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAcademySuspended) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md space-y-8">
           <span className="text-8xl">🚫</span>
           <h1 className="text-4xl font-black uppercase tracking-tighter">Academia Suspensa</h1>
           <p className="text-xl font-medium opacity-80">Esta unidade do OSS Flow encontra-se com o licenciamento global suspenso. Por favor, entre em contato com o responsável pela academia.</p>
           <button onClick={handleLogout} className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-gray-100 transition">Sair do Sistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* SINALIZADOR DE SINCRONIZAÇÃO NUVEM (DENTRO DO APP) */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border border-blue-400">
           <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
           <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
        </div>
      )}

      {currentUser.role === 'developer' ? (
        <DeveloperPortal db={db} onUpdateAcademyStatus={handleUpdateAcademyStatus} onUpdateAcademyPricing={handleUpdateAcademyPricing} onUpdateAcademyPlan={handleUpdateAcademyPlan} onToggleAcademyTrial={handleToggleAcademyTrial} onLogout={handleLogout} />
      ) : (
        <Layout user={currentUser} onLogout={handleLogout} onNavigate={setView} currentView={view} notificationCount={notificationCount}>
          {view === 'dashboard' && <Dashboard user={currentUser} students={visibleStudents} techniques={db.techniques} />}
          {view === 'library' && (
            <TechniqueLibrary techniques={db.techniques} masteredTechniques={currentUser.masteredTechniques} onToggleMastery={handleToggleMastery} isAdmin={currentUser.role === 'admin'} students={visibleStudents} onToggleStudentMastery={handleToggleStudentMastery} onAddTechnique={handleAddTechnique} onUpdateTechnique={handleUpdateTechnique} />
          )}
          {view === 'attendance' && currentUser.role === 'admin' && <AttendanceManager students={visibleStudents} onRecordAttendance={handleRecordAttendance} />}
          {view === 'team' && currentUser.role === 'admin' && (
            <TeamManagement students={visibleStudents} techniques={db.techniques} onAddProfessor={() => {}} onUpdateRole={() => {}} onDeleteUser={() => {}} onUpdateGraduation={handleUpdateGraduation} />
          )}
          {view === 'financial' && currentUser.role === 'admin' && (
            <FinancialManager students={visibleStudents} onUpdateTuition={() => {}} onUpdatePlanType={() => {}} onRecordPayment={handleRecordPayment} onRemovePayment={handleRemovePayment} />
          )}
          {view === 'profile' && <ProfileEditor user={currentUser} onUpdate={handleUpdateProfile} onUpdateGraduation={handleUpdateGraduation} />}
        </Layout>
      )}
    </div>
  );
};

export default App;
