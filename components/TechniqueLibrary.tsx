
import React, { useState, useRef, useMemo } from 'react';
import { Technique, BeltColor, MediaType, Student } from '../types';
import { BELT_COLORS_HEX, BELT_TEXT_COLORS_HEX } from '../constants';

interface TechniqueLibraryProps {
  techniques: Technique[];
  masteredTechniques: string[];
  onToggleMastery: (id: string) => void;
  isAdmin: boolean;
  students: Student[];
  onToggleStudentMastery: (studentId: string, techId: string) => void;
  onAddTechnique?: (tech: Omit<Technique, 'id'>) => void;
  onUpdateTechnique?: (tech: Technique) => void;
}

const TechniqueLibrary: React.FC<TechniqueLibraryProps> = ({ 
  techniques, 
  masteredTechniques, 
  onToggleMastery, 
  isAdmin,
  students,
  onToggleStudentMastery,
  onAddTechnique,
  onUpdateTechnique
}) => {
  const [filterBelt, setFilterBelt] = useState<BeltColor | 'Todas'>('Todas');
  const [filterCategory, setFilterCategory] = useState<Technique['category'] | 'Todas'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<'Todas' | 'Concluidas' | 'Pendentes'>('Todas');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingTech, setEditingTech] = useState<Technique | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [newTechData, setNewTechData] = useState<Omit<Technique, 'id'>>({
    name: '',
    category: 'Fundamentos',
    beltRequired: 'Branca',
    description: '',
    mediaUrl: '',
    mediaType: 'image'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Admin feature: view specific student progress
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const belts: (BeltColor | 'Todas')[] = ['Todas', 'Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'];
  const categories: (Technique['category'] | 'Todas')[] = ['Todas', 'Fundamentos', 'Passagem', 'Guarda', 'Finalização', 'Quedas', 'Defesa Pessoal'];

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.role === 'student' && 
      (s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
       s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    );
  }, [students, studentSearchTerm]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === viewingStudentId);
  }, [students, viewingStudentId]);

  const effectiveMasteredTechniques = useMemo(() => {
    if (isAdmin && viewingStudentId && selectedStudent) {
      return selectedStudent.masteredTechniques;
    }
    return masteredTechniques;
  }, [isAdmin, viewingStudentId, selectedStudent, masteredTechniques]);

  const filtered = techniques.filter(t => {
    const matchesBelt = filterBelt === 'Todas' || t.beltRequired === filterBelt;
    const matchesCategory = filterCategory === 'Todas' || t.category === filterCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isMastered = effectiveMasteredTechniques.includes(t.id);
    const matchesMastery = masteryFilter === 'Todas' || 
                          (masteryFilter === 'Concluidas' ? isMastered : !isMastered);

    return matchesBelt && matchesCategory && matchesSearch && matchesMastery;
  });

  const resetFilters = () => {
    setFilterBelt('Todas');
    setFilterCategory('Todas');
    setSearchTerm('');
    setMasteryFilter('Todas');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const isVideo = file.type.startsWith('video/');
      if (mode === 'add') {
        setNewTechData(prev => ({
          ...prev,
          mediaUrl: reader.result as string,
          mediaType: isVideo ? 'video' : 'image'
        }));
      } else if (editingTech) {
        setEditingTech({
          ...editingTech,
          mediaUrl: reader.result as string,
          mediaType: isVideo ? 'video' : 'image'
        });
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewTech = () => {
    if (!newTechData.name || !newTechData.description) return alert('Preencha os campos obrigatórios.');
    onAddTechnique?.(newTechData);
    setIsAdding(false);
    setNewTechData({
      name: '',
      category: 'Fundamentos',
      beltRequired: 'Branca',
      description: '',
      mediaUrl: '',
      mediaType: 'image'
    });
  };

  const handleSaveEditTech = () => {
    if (!editingTech || !editingTech.name || !editingTech.description) return alert('Preencha os campos obrigatórios.');
    onUpdateTechnique?.(editingTech);
    setEditingTech(null);
  };

  const progressStats = useMemo(() => {
    if (!viewingStudentId || !selectedStudent) return null;
    const masteredTotal = techniques.filter(t => selectedStudent.masteredTechniques.includes(t.id)).length;
    const totalTechs = techniques.length;
    const techsForCurrentBelt = techniques.filter(t => t.beltRequired === selectedStudent.currentBelt);
    const masteredForCurrentBelt = techsForCurrentBelt.filter(t => selectedStudent.masteredTechniques.includes(t.id)).length;
    return {
      total: { mastered: masteredTotal, total: totalTechs, percent: totalTechs > 0 ? Math.round((masteredTotal / totalTechs) * 100) : 0 },
      belt: { mastered: masteredForCurrentBelt, total: techsForCurrentBelt.length, percent: techsForCurrentBelt.length > 0 ? Math.round((masteredForCurrentBelt / techsForCurrentBelt.length) * 100) : 0, name: selectedStudent.currentBelt }
    };
  }, [viewingStudentId, selectedStudent, techniques]);

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Biblioteca Técnica</h2>
          <p className="text-gray-500">
            {isAdmin && viewingStudentId && selectedStudent 
              ? `Acompanhando aprendizado de: ${selectedStudent.name}` 
              : 'Navegue pelo currículo oficial utilizando os filtros avançados.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={() => { setIsAdding(!isAdding); setEditingTech(null); }}
              className={`px-4 py-2 rounded-xl font-bold transition shadow-lg ${isAdding ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
            >
              {isAdding ? 'Cancelar' : '➕ Nova Técnica'}
            </button>
          )}
        </div>
      </header>

      {/* Formulário de Adição */}
      {isAdding && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-600/5 space-y-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-black text-gray-900">Cadastrar Nova Técnica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Técnica *</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                placeholder="Ex: Armlock da Guarda"
                value={newTechData.name}
                onChange={e => setNewTechData({...newTechData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                value={newTechData.category}
                onChange={e => setNewTechData({...newTechData, category: e.target.value as any})}
              >
                {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Faixa de Introdução</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                value={newTechData.beltRequired}
                onChange={e => setNewTechData({...newTechData, beltRequired: e.target.value as any})}
              >
                {belts.filter(b => b !== 'Todas').map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição / Detalhes *</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              placeholder="Explique os detalhes fundamentais da técnica..."
              value={newTechData.description}
              onChange={e => setNewTechData({...newTechData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mídia da Técnica (Imagem ou Vídeo)</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-50 transition font-bold text-sm ${uploading ? 'animate-pulse' : ''}`}
                >
                  {uploading ? 'Processando...' : newTechData.mediaUrl ? 'Alterar Arquivo' : 'Escolher Arquivo'}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={e => handleFileChange(e, 'add')}
                />
                {newTechData.mediaUrl && (
                  <button 
                    onClick={() => setNewTechData(prev => ({ ...prev, mediaUrl: '', mediaType: 'image' }))}
                    className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSaveNewTech}
                className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-xl shadow-slate-900/10 active:scale-95"
              >
                Salvar Técnica no Currículo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Edição */}
      {editingTech && (
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-blue-200 shadow-xl space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Editando: {editingTech.name}</h3>
             <button onClick={() => setEditingTech(null)} className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Cancelar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Técnica</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                value={editingTech.name}
                onChange={e => setEditingTech({...editingTech, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                value={editingTech.category}
                onChange={e => setEditingTech({...editingTech, category: e.target.value as any})}
              >
                {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faixa</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                value={editingTech.beltRequired}
                onChange={e => setEditingTech({...editingTech, beltRequired: e.target.value as any})}
              >
                {belts.filter(b => b !== 'Todas').map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              value={editingTech.description}
              onChange={e => setEditingTech({...editingTech, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atualizar Mídia</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => editFileInputRef.current?.click()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition font-bold text-sm ${uploading ? 'animate-pulse' : ''}`}
                >
                  {uploading ? 'Lendo...' : 'Carregar Imagem/Vídeo'}
                </button>
                <input 
                  type="file" 
                  ref={editFileInputRef}
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={e => handleFileChange(e, 'edit')}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSaveEditTech}
                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 active:scale-95"
              >
                Atualizar Registro Técnico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professor Selection Header */}
      {isAdmin && (
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-1/4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Avaliar Aluno</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nome do aluno..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-3.5">🔍</span>
                {!viewingStudentId && studentSearchTerm.length > 0 && filteredStudents.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
                    {filteredStudents.map(s => (
                      <div key={s.id} onClick={() => { setViewingStudentId(s.id); setStudentSearchTerm(s.name); }} className="p-3 hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-700 last:border-0">
                        <img src={s.photoUrl} className="w-8 h-8 rounded-full" />
                        <div><p className="text-sm font-bold">{s.name}</p><p className="text-[10px] text-slate-400 uppercase">{s.currentBelt}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedStudent && progressStats && (
              <div className="flex-1 flex flex-col xl:flex-row items-center gap-6">
                <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 w-full xl:w-auto min-w-[200px]">
                  <img src={selectedStudent.photoUrl} className="w-14 h-14 rounded-full border-2 border-blue-500 shadow-xl" />
                  <div><p className="font-bold text-lg">{selectedStudent.name}</p><p className="text-[10px] font-bold uppercase text-slate-400">Faixa {selectedStudent.currentBelt}</p></div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Progresso Geral: {progressStats.total.percent}%</p><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${progressStats.total.percent}%` }} /></div></div>
                  <div className="space-y-1"><p className="text-[10px] font-bold text-amber-400 uppercase">Meta Graduação: {progressStats.belt.percent}%</p><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-amber-400 h-full" style={{ width: `${progressStats.belt.percent}%` }} /></div></div>
                </div>
                <button onClick={() => { setViewingStudentId(null); setStudentSearchTerm(''); }} className="bg-red-500/10 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20">Sair</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAINEL DE FILTROS AVANÇADOS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Busca por Nome */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buscar Técnica</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ex: Armlock, Double Leg..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Categoria */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrar Categoria</label>
            <select 
              className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status de Domínio */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status de Aprendizado</label>
            <select 
              className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm appearance-none"
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value as any)}
            >
              <option value="Todas">Todos os Status</option>
              <option value="Concluidas">Dominadas ✓</option>
              <option value="Pendentes">Em Estudo ○</option>
            </select>
          </div>

          {/* Resetar */}
          <div className="lg:col-span-2">
            <button 
              onClick={resetFilters}
              className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition border border-dashed border-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Filtro de Faixas (Pills) */}
        <div className="pt-4 border-t border-gray-50">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3 block">Filtrar por Graduação</label>
          <div className="flex flex-wrap gap-2">
            {belts.map(b => (
              <button
                key={b}
                onClick={() => setFilterBelt(b)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border ${
                  filterBelt === b 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados Informativos */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-bold text-gray-400">
          Exibindo <span className="text-gray-900">{filtered.length}</span> técnicas
          {searchTerm && <span> para "<span className="text-blue-600">{searchTerm}</span>"</span>}
        </p>
      </div>

      {/* Grid de Técnicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(tech => {
          const isMastered = effectiveMasteredTechniques.includes(tech.id);
          
          return (
            <div key={tech.id} className={`group bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-500 hover:shadow-2xl ${isMastered ? 'border-green-100' : 'border-gray-100'}`}>
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                {tech.mediaType === 'video' ? (
                  <video 
                    src={tech.mediaUrl} 
                    className="w-full h-full object-cover" 
                    controls={false} 
                    muted 
                    loop 
                    autoPlay 
                    playsInline
                  />
                ) : (
                  <img src={tech.mediaUrl || `https://picsum.photos/seed/${tech.id}/400/250`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    {tech.category}
                  </span>
                </div>
                
                {/* Botão de Edição para Admin */}
                {isAdmin && !viewingStudentId && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingTech(tech); setIsAdding(false); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    ✏️
                  </button>
                )}

                {isMastered && (
                  <div className={`absolute top-4 ${isAdmin ? 'right-14' : 'right-4'} bg-green-500 text-white p-1.5 rounded-full shadow-lg`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1.5" style={{ backgroundColor: BELT_COLORS_HEX[tech.beltRequired] }} />
              </div>
              <div className="p-8">
                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{tech.name}</h3>
                <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6">{tech.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: BELT_COLORS_HEX[tech.beltRequired] }} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faixa {tech.beltRequired}</span>
                  </div>
                  <button 
                    onClick={() => isAdmin && viewingStudentId ? onToggleStudentMastery(viewingStudentId, tech.id) : onToggleMastery(tech.id)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isMastered ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                  >
                    {isMastered ? 'Dominado' : 'Concluir'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Nenhuma técnica encontrada com estes filtros</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold hover:underline">Resetar Filtros</button>
        </div>
      )}
    </div>
  );
};

export default TechniqueLibrary;
