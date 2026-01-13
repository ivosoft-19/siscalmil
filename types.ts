
export enum Rank {
  SOLDADO = 'Soldado',
  CABO = 'Cabo',
  TERCEIRO_SARGENTO = '3º Sargento',
  SEGUNDO_SARGENTO = '2º Sargento',
  PRIMEIRO_SARGENTO = '1º Sargento',
  SUBTENENTE = 'Subtenente',
  SEGUNDO_TENENTE = '2º Tenente',
  PRIMEIRO_TENENTE = '1º Tenente',
  CAPITAO = 'Capitão',
  MAJOR = 'Major',
  TENENTE_CORONEL = 'Tenente-Coronel',
  CORONEL = 'Coronel'
}

export enum Role {
  COMANDANTE = 'Comandante',
  AUXILIAR = 'Auxiliar',
  MOTORISTA = 'Motorista',
  PATRULHEIRO = 'Patrulheiro',
  PERMANENCIA = 'Permanência'
}

export interface Personnel {
  id: string;
  fullName: string;
  name: string; // Nome de Guerra
  rank: Rank;
  roles: Role[]; // Lista de funções permitidas
  canDrive: boolean;
  active: boolean;
}

export interface Absence {
  id: string;
  personnelId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  reason: string;
}

export interface DailyScale {
  date: string; // YYYY-MM-DD
  assignments: Record<Role, string | null>; // Role -> Personnel ID
  notes?: string;
  isCustom: boolean;
  modifiedBy?: string; // Name or ID of the person who modified
  modifiedAt?: string; // ISO timestamp
}

export const REST_DAYS_REQUIRED = 4; // 96 horas = 4 dias de folga

export const RankOrder: Record<Rank, number> = {
  [Rank.SOLDADO]: 1,
  [Rank.CABO]: 2,
  [Rank.TERCEIRO_SARGENTO]: 3,
  [Rank.SEGUNDO_SARGENTO]: 4,
  [Rank.PRIMEIRO_SARGENTO]: 5,
  [Rank.SUBTENENTE]: 6,
  [Rank.SEGUNDO_TENENTE]: 7,
  [Rank.PRIMEIRO_TENENTE]: 8,
  [Rank.CAPITAO]: 9,
  [Rank.MAJOR]: 10,
  [Rank.TENENTE_CORONEL]: 11,
  [Rank.CORONEL]: 12,
};
