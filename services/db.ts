
import { Student, Technique, Academy, DB, AcademyPricing } from '../types';
import { INITIAL_TECHNIQUES, MOCK_STUDENTS } from '../constants';

const DB_KEY = 'oss_flow_cloud_db';

// Simulação de latência de rede (ex: 500ms) para parecer um servidor real
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_PRICING: AcademyPricing = {
  Mensal: 299.90,
  Trimestral: 799.90,
  Semestral: 1499.90,
  Anual: 2499.90
};

export const getDB = async (): Promise<DB> => {
  await delay(800); // Simulando busca no servidor
  const data = localStorage.getItem(DB_KEY);
  
  if (!data) {
    const initialRenewal = new Date();
    initialRenewal.setDate(initialRenewal.getDate() + 30);
    
    const initialAcademies: Academy[] = [
      { 
        id: 'acc-1', 
        name: 'Gracie Barra Headquarters', 
        foundedDate: '2010-01-01', 
        ownerId: 's2',
        status: 'active',
        pricing: DEFAULT_PRICING,
        currentPlan: 'Mensal',
        subscriptionValue: 299.90,
        isTrial: false,
        nextRenewalDate: initialRenewal.toISOString()
      }
    ];
    const initial: DB = { 
      students: MOCK_STUDENTS, 
      techniques: INITIAL_TECHNIQUES,
      academies: initialAcademies 
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  
  const parsed = JSON.parse(data);
  
  // Garantir integridade dos dados migrados
  parsed.academies = (parsed.academies || []).map((acc: any) => ({
    ...acc,
    currentPlan: acc.currentPlan || 'Mensal',
    subscriptionValue: acc.subscriptionValue || (acc.pricing ? acc.pricing[acc.currentPlan || 'Mensal'] : 299.90),
    nextRenewalDate: acc.nextRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  return parsed;
};

export const saveDB = async (students: Student[], techniques: Technique[], academies: Academy[]): Promise<void> => {
  await delay(500); // Simulando upload para a nuvem
  localStorage.setItem(DB_KEY, JSON.stringify({ students, techniques, academies }));
};

export const updateStudent = async (updatedStudent: Student): Promise<Student[]> => {
  const db = await getDB();
  const newStudents = db.students.map((s: Student) => s.id === updatedStudent.id ? updatedStudent : s);
  await saveDB(newStudents, db.techniques, db.academies);
  return newStudents;
};
