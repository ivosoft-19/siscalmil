
import { Rank, Personnel, Role } from './types';

const militaryFirstNames = [
  'João', 'Maria', 'José', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz',
  'Marcos', 'Rafael', 'Marcelo', 'Ricardo', 'Fernando', 'Rodrigo', 'Daniel', 'Gabriel', 'Bruno', 'Thiago'
];

const militaryLastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
  'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Melo', 'Castro', 'Resende', 'Borges', 'Cavalcante'
];

const enlistedRanks = [
  Rank.SOLDADO, Rank.SOLDADO, Rank.SOLDADO, 
  Rank.CABO, Rank.CABO,
  Rank.TERCEIRO_SARGENTO, Rank.SEGUNDO_SARGENTO, Rank.PRIMEIRO_SARGENTO,
  Rank.SUBTENENTE
];

const allRoles = Object.values(Role);

const generateMock = () => {
  const personnel: Personnel[] = [];
  
  for (let i = 1; i <= 80; i++) {
    const firstName = militaryFirstNames[i % militaryFirstNames.length];
    const lastName = militaryLastNames[i % militaryLastNames.length];
    const warName = lastName + " " + (100 + i);
    const fullName = `${firstName} ${lastName} de ${militaryLastNames[(i + 5) % militaryLastNames.length]}`;
    const rank = enlistedRanks[Math.floor(Math.random() * enlistedRanks.length)];
    
    // Atribui 1 a 3 funções aleatórias
    const numRoles = Math.floor(Math.random() * 2) + 1;
    const shuffledRoles = [...allRoles].sort(() => 0.5 - Math.random());
    const roles = shuffledRoles.slice(0, numRoles);
    
    const canDrive = roles.includes(Role.MOTORISTA) || Math.random() > 0.8;
    if (canDrive && !roles.includes(Role.MOTORISTA)) roles.push(Role.MOTORISTA);

    personnel.push({
      id: i.toString(),
      fullName: fullName,
      name: warName,
      rank: rank,
      roles: roles,
      canDrive: canDrive,
      active: true
    });
  }
  return personnel;
};

export const MOCK_PERSONNEL = generateMock();
