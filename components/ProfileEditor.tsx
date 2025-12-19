
import React from 'react';
import { Student, BeltColor } from '../types';
import { BELT_COLORS_HEX } from '../constants';

interface ProfileEditorProps {
  user: Student;
  onUpdate: (user: Student) => void;
  onUpdateGraduation?: (id: string, belt: BeltColor, stripes: number) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate, onUpdateGraduation }) => {
  const BELT_OPTIONS: BeltColor[] = [
    'Branca', 'Azul', 'Roxa', 'Marrom', 'Preta', 
    'Vermelha e Preta', 'Vermelha e Branca', 'Vermelha'
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...user, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onUpdate({ ...user, weight: val });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="relative inline-block mb-6">
          <img 
            src={user.photoUrl || 'https://picsum.photos/200/200'} 
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-100"
            alt="User Avatar"
          />
          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition">
            <span className="text-white text-lg">📷</span>
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
          </label>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-gray-500">{user.email}</p>
        <div className="flex justify-center gap-4 mt-6">
          <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Início</p>
            <p className="font-bold">{new Date(user.joinedDate).toLocaleDateString()}</p>
          </div>
          <div className="text-center px-4 py-2 bg-gray-50 rounded-xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
            <p className="font-bold text-green-600">Ativo</p>
          </div>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm space-y-4">
          <h3 className="font-bold text-blue-800 flex items-center gap-2">
            🎓 Autogestão de Graduação
          </h3>
          <p className="text-sm text-gray-500">Como professor, você pode atualizar sua própria faixa e graus.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Minha Faixa</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                value={user.currentBelt}
                onChange={(e) => onUpdateGraduation?.(user.id, e.target.value as BeltColor, user.currentStripes)}
              >
                {BELT_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                {!BELT_OPTIONS.includes(user.currentBelt) && <option value={user.currentBelt}>{user.currentBelt}</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Meus Graus</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                value={user.currentStripes}
                onChange={(e) => onUpdateGraduation?.(user.id, user.currentBelt, parseInt(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => <option key={s} value={s}>{s} Graus</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
             <div className="w-10 h-4 rounded shadow-inner" style={{ backgroundColor: BELT_COLORS_HEX[user.currentBelt] }} />
             <p className="text-xs font-bold text-gray-600 uppercase">Pré-visualização da Faixa</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 mb-4">Informações da Conta</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={user.name} disabled />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={user.weight} 
                onChange={handleWeightChange} 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
            <input type="email" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={user.email} disabled />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Deseja alterar a senha?</label>
            <button className="text-blue-600 text-sm font-semibold hover:underline">Solicitar alteração de senha</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
