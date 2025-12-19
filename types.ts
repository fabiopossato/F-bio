
export type BeltColor = 
  | 'Branca' 
  | 'Cinza e Branca' | 'Cinza' | 'Cinza e Preta'
  | 'Amarela e Branca' | 'Amarela' | 'Amarela e Preta'
  | 'Laranja e Branca' | 'Laranja' | 'Laranja e Preta'
  | 'Verde e Branca' | 'Verde' | 'Verde e Preta'
  | 'Azul' | 'Roxa' | 'Marrom' | 'Preta'
  | 'Vermelha e Preta' | 'Vermelha e Branca' | 'Vermelha';

export type StudentCategory = 'Adulto' | 'Infantil';
export type MediaType = 'image' | 'video';
export type PaymentPlan = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export interface Technique {
  id: string;
  name: string;
  category: 'Fundamentos' | 'Passagem' | 'Guarda' | 'Finalização' | 'Quedas' | 'Defesa Pessoal';
  beltRequired: BeltColor;
  description: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

export interface GraduationStep {
  belt: BeltColor;
  stripes: number; // 0 to 4
}

export interface AcademyPricing {
  Mensal: number;
  Trimestral: number;
  Semestral: number;
  Anual: number;
}

export interface Academy {
  id: string;
  name: string;
  foundedDate: string;
  ownerId: string;
  status: 'active' | 'suspended';
  pricing: AcademyPricing;
  currentPlan: PaymentPlan;
  subscriptionValue: number; 
  lastPaymentDate?: string;
  nextRenewalDate: string; // ISO Date
  isTrial?: boolean;
  trialExpiration?: string; // ISO Date
}

export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string;
  photoUrl?: string;
  age: number;
  weight: number;
  category: StudentCategory;
  currentBelt: BeltColor;
  currentStripes: number;
  joinedDate: string;
  attendanceHistory: string[]; 
  masteredTechniques: string[]; 
  role: 'student' | 'admin' | 'developer';
  professorId?: string; 
  academyName?: string; 
  monthlyTuition: number;
  payments: string[]; 
  planType: PaymentPlan;
}

export interface AttendanceRecord {
  date: string;
  studentId: string;
}

export interface DB {
  students: Student[];
  techniques: Technique[];
  academies: Academy[];
}
