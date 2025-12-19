
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'library' | 'attendance' | 'profile' | 'team' | 'financial') => void;
  currentView: string;
  notificationCount?: number;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentView, notificationCount = 0 }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-sm shadow-inner">OSS</div>
          OSS FLOW
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${currentView === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <span className="text-lg">📊</span> Dashboard
          </button>
          <button 
            onClick={() => onNavigate('library')}
            className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${currentView === 'library' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <span className="text-lg">📚</span> Biblioteca Técnica
          </button>
          {user.role === 'admin' && (
            <>
              <button 
                onClick={() => onNavigate('attendance')}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${currentView === 'attendance' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
              >
                <span className="text-lg">📅</span> Chamada
              </button>
              <button 
                onClick={() => onNavigate('team')}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between group ${currentView === 'team' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">👥</span> Gestão de Equipe
                </div>
                {notificationCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => onNavigate('financial')}
                className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${currentView === 'financial' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
              >
                <span className="text-lg">💰</span> Financeiro
              </button>
            </>
          )}
          <button 
            onClick={() => onNavigate('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${currentView === 'profile' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}
          >
            <span className="text-lg">👤</span> Meu Perfil
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user.photoUrl || 'https://picsum.photos/100/100'} 
              className="w-10 h-10 rounded-full bg-gray-700 object-cover ring-2 ring-blue-600/30" 
              alt="Profile"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role === 'admin' ? 'Professor' : 'Aluno'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition"
          >
            SAIR DO SISTEMA
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
