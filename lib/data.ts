export interface Dependent {
  id: string;
  name: string;
  relationship: string;
  age: number;
  notes?: string;
  tag?: string;
  tagColor?: string;
}

export type FamilyStatus = 'em_acompanhamento' | 'promovida' | 'inativa';

export function getFamilyStatusLabel(status?: string): string {
  if (status === 'promovida') return 'Promovida';
  if (status === 'inativa') return 'Inativa';
  return 'Em acompanhamento';
}

export function normalizeFamilyStatus(status?: string): FamilyStatus {
  if (status === 'promovida') return 'promovida';
  if (status === 'inativa') return 'inativa';
  return 'em_acompanhamento';
}

export interface Family {
  id: string;
  name: string;
  cpf: string;
  nis?: string;
  rg?: string;
  birthDate?: string;
  phone: string;
  genderIdentity?: string;
  bairro: string;
  address: string;
  housingType: string;
  rentValue?: number;
  referencePoint?: string;
  dependents: Dependent[];
  monthlyIncome: number;
  benefitType: string;
  status: FamilyStatus;
  statusLabel: string;
  lastDeliveryDate: string;
  lastDeliveryDaysAgo: number;
  lastDeliveryBasketType?: string;
  recommendedBasket?: string;
  clinicalNotes?: string;
  pastoralNotes?: string;
  dependentsNotes?: string;
  hasScheduleVisit?: boolean;
  avatarUrl?: string;
  initials: string;
  perCapitaIncome: number;
  vulnerabilityLevel: 'extrema' | 'baixa' | 'moderada';
}

export interface DeliveryRecord {
  id: string;
  familyId: string;
  familyName: string;
  timestamp: string;
  timeFormatted: string;
  basketType?: string;
  volunteerName: string;
  parishUnit: string;
  status: 'Concluído' | 'Em Andamento' | 'Cancelado';
  pastoralVisitRequested: boolean;
  observation?: string;
  protocolNumber: string;
}

export type PeriodicVisitType = 'rotina' | 'acolhimento' | 'saude' | 'reavaliacao' | 'emergencial';

export interface PeriodicVisit {
  id: string;
  familyId: string;
  familyName: string;
  familyCpf?: string;
  familyBairro?: string;
  familyAddress?: string;
  date: string;
  dateFormatted: string;
  timeFormatted: string;
  visitors: string;
  visitType: PeriodicVisitType;
  visitTypeLabel: string;
  housingConditions: 'Boa' | 'Regular' | 'Precária' | 'Risco Iminente';
  summary: string;
  detectedNeeds: string[];
  nextVisitRecommendation?: string;
  protocolNumber: string;
  registeredBy?: string;
}

export function getVisitTypeLabel(type: PeriodicVisitType): string {
  switch (type) {
    case 'rotina': return 'Rotina Periódica';
    case 'acolhimento': return 'Acolhimento Inicial';
    case 'saude': return 'Saúde & Cuidados';
    case 'reavaliacao': return 'Reavaliação Socioeconômica';
    case 'emergencial': return 'Visita Emergencial';
    default: return 'Rotina Periódica';
  }
}

export interface BasketInventory {
  id: string;
  name: string;
  available: number;
  reserved: number;
  totalMonth: number;
  itemsSummary: string;
  weightKg: number;
}

export interface PastoralSettings {
  parishName: string;
  minIntervalDays: number;
  requireSignature: boolean;
}

export const DEFAULT_SETTINGS: PastoralSettings = {
  parishName: 'Paróquia São Vicente de Paulo',
  minIntervalDays: 30,
  requireSignature: true
};

export interface MonthlyDeliveryCheck {
  isBlocked: boolean;
  dateFormatted?: string;
  protocolNumber?: string;
  reason?: string;
}

export function checkMonthlyDeliveryLimit(
  family: Family,
  deliveries: DeliveryRecord[]
): MonthlyDeliveryCheck {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const dayOfMonth = now.getDate();

  // 1. Check in deliveries recorded for this family in current month
  const deliveryThisMonth = deliveries.find((d) => {
    if (d.familyId !== family.id) return false;
    if (d.status === 'Cancelado') return false;
    const dDate = new Date(d.timestamp);
    if (!isNaN(dDate.getTime())) {
      return dDate.getFullYear() === currentYear && dDate.getMonth() === currentMonth;
    }
    return true; // Recorded in current session's deliveries
  });

  if (deliveryThisMonth) {
    const dDate = new Date(deliveryThisMonth.timestamp);
    const dateFormatted = !isNaN(dDate.getTime())
      ? dDate.toLocaleDateString('pt-BR') + ' às ' + deliveryThisMonth.timeFormatted
      : deliveryThisMonth.timeFormatted;
    return {
      isBlocked: true,
      dateFormatted,
      protocolNumber: deliveryThisMonth.protocolNumber,
      reason: `Já recebeu a cesta básica deste mês em ${dateFormatted}. Regra paroquial: limite estrito de 1 cesta básica por mês.`
    };
  }

  // 2. Check if family was delivered today or has "Hoje" in lastDeliveryDate
  if (family.lastDeliveryDaysAgo === 0 || (family.lastDeliveryDate && family.lastDeliveryDate.toLowerCase().includes('hoje'))) {
    return {
      isBlocked: true,
      dateFormatted: family.lastDeliveryDate || 'Hoje',
      reason: `Já recebeu a cesta básica deste mês (${family.lastDeliveryDate || 'Hoje'}). Regra paroquial: limite estrito de 1 cesta básica por mês.`
    };
  }

  // 3. Check if lastDeliveryDaysAgo is within the current month (days elapsed since 1st of the month)
  if (typeof family.lastDeliveryDaysAgo === 'number' && family.lastDeliveryDaysAgo > 0 && family.lastDeliveryDaysAgo < dayOfMonth) {
    return {
      isBlocked: true,
      dateFormatted: family.lastDeliveryDate,
      reason: `Já realizou retirada neste mês (há ${family.lastDeliveryDaysAgo} dias). Regra paroquial: limite estrito de 1 cesta básica por mês.`
    };
  }

  return { isBlocked: false };
}

export const INITIAL_FAMILIES: Family[] = [
  {
    id: 'fam-1',
    name: 'Maria Francisca da Silva',
    cpf: '384.921.847-72',
    nis: '160.4491.229-8',
    rg: '42.910.223-1',
    birthDate: '1979-04-12',
    phone: '(11) 97120-4491',
    genderIdentity: 'Mulher',
    bairro: 'Vila Esperança',
    address: 'Rua dos Cravos, 84',
    housingType: 'Alugada',
    rentValue: 650,
    referencePoint: 'Próximo à padaria São Judas Tadeu, casa de fundos',
    dependents: [
      { id: 'dep-1', name: 'Lucas Gabriel da Silva', relationship: 'Filho', age: 7, notes: 'Matriculado na EMEF Castelo Branco', tag: '2 Crianças' },
      { id: 'dep-2', name: 'Beatriz da Silva', relationship: 'Filha', age: 4, notes: 'Aguardando vaga creche municipal', tag: 'Primeira Infância' },
      { id: 'dep-3', name: 'Dona Geralda Francisca', relationship: 'Mãe (Idosa)', age: 71, notes: 'Cardiopata em tratamento UBS', tag: '1 Idoso' },
      { id: 'dep-4', name: 'Paulo Silva', relationship: 'Irmão', age: 34, notes: 'Trabalho informal (diarista)', tag: '1 Adulto' }
    ],
    monthlyIncome: 650,
    perCapitaIncome: 130,
    benefitType: 'Bolsa Família Ativo',
    status: 'em_acompanhamento',
    statusLabel: 'Em acompanhamento',
    lastDeliveryDate: '24 de Setembro',
    lastDeliveryDaysAgo: 34,
    lastDeliveryBasketType: 'Cesta Básica',
    recommendedBasket: 'Cesta Básica',
    clinicalNotes: 'Sem restrições alimentares severas.',
    pastoralNotes: 'Família acolhida com carinho pela equipe vicentina.',
    hasScheduleVisit: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGcYT6HHXpk81Jaa1_qC2-ZA-jYq2fO9hL7mjZDJaeJsHHhQ0H01LxIqzOcYWnyBh35IwvWk7WyLTJ0uiIzqxGhpmZG6E8KrnBvkTG06LhneDlyHzeoDx8DkQsk9UTLGYqfaONvbEizaRqBczxvys-ubgiijJpR5JmIy_kY6Cj21b-V_xvLWaar9DRAAbBqUA64fdRamNBikqbckzKdLOhqZhM2w5-Un41RCD0WHhwsg5N5eK9wK_l',
    initials: 'MF',
    vulnerabilityLevel: 'extrema'
  },
  {
    id: 'fam-2',
    name: 'Maria do Socorro Alves',
    cpf: '482.903.118-20',
    nis: '160.8291.442-1',
    rg: '33.829.110-5',
    birthDate: '1982-11-20',
    phone: '(11) 98822-1093',
    genderIdentity: 'Mulher',
    bairro: 'Vila Esperança',
    address: 'Rua das Acácias, 142',
    housingType: 'Própria',
    referencePoint: 'Portão verde, em frente à oficina',
    dependents: [
      { id: 'dep-21', name: 'Mateus Alves', relationship: 'Filho', age: 11, notes: 'Escola Municipal', tag: '3 Menores escolar' },
      { id: 'dep-22', name: 'Julia Alves', relationship: 'Filha', age: 9, notes: 'Escola Municipal', tag: 'Criança' },
      { id: 'dep-23', name: 'Enzo Alves', relationship: 'Filho', age: 6, notes: 'Escola Municipal', tag: 'Criança' },
      { id: 'dep-24', name: 'Valdir Alves', relationship: 'Cônjuge', age: 41, notes: 'Desempregado', tag: 'Adulto' }
    ],
    monthlyIncome: 590,
    perCapitaIncome: 118,
    benefitType: 'Bolsa Família Ativo',
    status: 'em_acompanhamento',
    statusLabel: 'Em acompanhamento',
    lastDeliveryDate: '14/09/2024',
    lastDeliveryDaysAgo: 33,
    lastDeliveryBasketType: 'Cesta Básica',
    recommendedBasket: 'Cesta Básica',
    initials: 'MS',
    vulnerabilityLevel: 'extrema'
  },
  {
    id: 'fam-3',
    name: 'José Nogueira Santos',
    cpf: '198.441.722-09',
    nis: '201.7381.990-8',
    rg: '14.281.992-0',
    birthDate: '1950-02-15',
    phone: '(11) 97331-8840',
    genderIdentity: 'Homem',
    bairro: 'Jardim Alvorada',
    address: 'Travessa 4, 88',
    housingType: 'Alugada',
    rentValue: 500,
    referencePoint: 'Esquina com Rua 12',
    dependents: [
      { id: 'dep-31', name: 'Iraci Nogueira', relationship: 'Esposa', age: 72, notes: 'Diabética e celíaca', tag: 'Idosa' }
    ],
    monthlyIncome: 430,
    perCapitaIncome: 215,
    benefitType: 'Bolsa Família Ativo',
    status: 'em_acompanhamento',
    statusLabel: 'Em acompanhamento',
    lastDeliveryDate: '08/10/2024',
    lastDeliveryDaysAgo: 24,
    lastDeliveryBasketType: 'Cesta Básica',
    recommendedBasket: 'Cesta Básica',
    initials: 'JN',
    vulnerabilityLevel: 'baixa'
  },
  {
    id: 'fam-4',
    name: 'Cleide Luciana Ferreira',
    cpf: '832.100.955-40',
    nis: '122.9930.128-4',
    rg: '28.910.450-9',
    birthDate: '1989-08-03',
    phone: '(11) 96190-2211',
    genderIdentity: 'Mulher',
    bairro: 'Centro',
    address: 'Av. Brasil, 910 - Ap 3',
    housingType: 'Cedida',
    referencePoint: 'Em cima da bicicletaria',
    dependents: [
      { id: 'dep-41', name: 'Sophia Ferreira', relationship: 'Filha', age: 2, notes: 'Primeira infância', tag: 'Bebê' },
      { id: 'dep-42', name: 'Gabriel Ferreira', relationship: 'Filho', age: 13, notes: 'Estudante', tag: 'Adolescente' },
      { id: 'dep-43', name: 'Gestação em curso (7 meses)', relationship: 'Gestante', age: 0, notes: 'Acompanhamento pré-natal no posto', tag: '1 Gestante' }
    ],
    monthlyIncome: 720,
    perCapitaIncome: 180,
    benefitType: 'Bolsa Família Bloqueado / Cancelado',
    status: 'promovida',
    statusLabel: 'Promovida',
    lastDeliveryDate: '02/06/2024',
    lastDeliveryDaysAgo: 137,
    lastDeliveryBasketType: 'Cesta Básica',
    recommendedBasket: 'Cesta Básica',
    initials: 'CL',
    vulnerabilityLevel: 'baixa'
  },
  {
    id: 'fam-5',
    name: 'Raimundo Nonato Farias',
    cpf: '602.819.330-18',
    nis: '139.0041.552-7',
    rg: '19.450.812-7',
    birthDate: '1968-12-05',
    phone: '(11) 95543-9182',
    genderIdentity: 'Homem',
    bairro: 'Zona Rural',
    address: 'Sítio Boa Vista, Km 12',
    housingType: 'Cedida',
    referencePoint: 'Entrada após o pontilhão da ferrovia',
    dependents: [
      { id: 'dep-51', name: 'Marcos Farias', relationship: 'Filho (PCD)', age: 26, notes: 'Cadeirante, necessita visita domiciliar', tag: 'PCD Dependente' },
      { id: 'dep-52', name: 'Alzira Farias', relationship: 'Esposa', age: 58, notes: 'Cuidadora integral', tag: 'Adulto' }
    ],
    monthlyIncome: 285,
    perCapitaIncome: 95,
    benefitType: 'BPC / LOAS',
    status: 'inativa',
    statusLabel: 'Inativa',
    lastDeliveryDate: '11/09/2024',
    lastDeliveryDaysAgo: 36,
    lastDeliveryBasketType: 'Cesta Básica',
    recommendedBasket: 'Cesta Básica',
    initials: 'RF',
    vulnerabilityLevel: 'extrema'
  }
];

export const INITIAL_TODAY_DELIVERIES: DeliveryRecord[] = [
  {
    id: 'del-1',
    familyId: 'fam-101',
    familyName: 'Sebastião Ramos de Souza',
    timestamp: '2026-10-17T10:14:00',
    timeFormatted: '10:14',
    basketType: 'Cesta Básica',
    volunteerName: 'Irmão Carlos (Vicentino)',
    parishUnit: 'Paróquia São Vicente',
    status: 'Concluído',
    pastoralVisitRequested: false,
    protocolNumber: '#ENT-202610-018'
  },
  {
    id: 'del-2',
    familyId: 'fam-102',
    familyName: 'Ana Lúcia dos Santos',
    timestamp: '2026-10-17T09:48:00',
    timeFormatted: '09:48',
    basketType: 'Cesta Básica',
    volunteerName: 'Claudilene (Voluntária)',
    parishUnit: 'Paróquia São Vicente',
    status: 'Concluído',
    pastoralVisitRequested: true,
    observation: 'Família pediu oração para o filho que fará cirurgia.',
    protocolNumber: '#ENT-202610-017'
  },
  {
    id: 'del-3',
    familyId: 'fam-103',
    familyName: 'Jorge Mendonça Alencar',
    timestamp: '2026-10-17T09:22:00',
    timeFormatted: '09:22',
    basketType: 'Cesta Básica',
    volunteerName: 'Irmã Tereza',
    parishUnit: 'Paróquia São Vicente',
    status: 'Concluído',
    pastoralVisitRequested: false,
    protocolNumber: '#ENT-202610-016'
  },
  {
    id: 'del-4',
    familyId: 'fam-104',
    familyName: 'Francisca Helena Braga',
    timestamp: '2026-10-17T08:50:00',
    timeFormatted: '08:50',
    basketType: 'Cesta Básica',
    volunteerName: 'Claudilene (Voluntária)',
    parishUnit: 'Paróquia São Vicente',
    status: 'Concluído',
    pastoralVisitRequested: false,
    protocolNumber: '#ENT-202610-015'
  }
];

export const BASKET_INVENTORIES: BasketInventory[] = [
  {
    id: 'cesta-1',
    name: 'Cesta Padrão Tipo 1 (Básica Familiar)',
    available: 184,
    reserved: 18,
    totalMonth: 420,
    itemsSummary: 'Arroz (5kg), Feijão carioca (2kg), Óleo, Açúcar, Café, Macarrão, Extrato de tomate, Leite pó, Fubá, Farinha de trigo, Biscoito e Sal.',
    weightKg: 19.5
  },
  {
    id: 'cesta-2',
    name: 'Cesta Padrão Tipo 2 (Família Numerosa / Proteína)',
    available: 92,
    reserved: 8,
    totalMonth: 210,
    itemsSummary: 'Arroz (10kg), Feijão (4kg), Sardinha/Atum em lata, Leite integral (4L), Farinha, Açúcar, Macarrão (2kg), Óleo (2 un), Biscoitos.',
    weightKg: 28.0
  },
  {
    id: 'cesta-3',
    name: 'Cesta Especial Diet / Sem Glúten & Lactose',
    available: 42,
    reserved: 4,
    totalMonth: 80,
    itemsSummary: 'Arroz integral, Feijão preto, Macarrão de arroz, Leite de soja/zero lactose, Aveia sem glúten, Biscoitos de arroz, Azeite, Farinha de mandioca.',
    weightKg: 16.0
  },
  {
    id: 'cesta-4',
    name: 'Kit Complementar Higiene & Acolhimento Infantil',
    available: 65,
    reserved: 6,
    totalMonth: 150,
    itemsSummary: 'Sabonete, Creme dental, Escovas dentais, Papel higiênico, Sabão em barra, Detergente, Fraldas infantis e lenço umedecido.',
    weightKg: 8.5
  }
];

export const INITIAL_PERIODIC_VISITS: PeriodicVisit[] = [
  {
    id: 'vis-1',
    familyId: 'fam-1',
    familyName: 'Maria Francisca da Silva',
    familyCpf: '384.921.847-72',
    familyBairro: 'Vila Esperança',
    familyAddress: 'Rua dos Cravos, 84',
    date: '2026-10-18',
    dateFormatted: '18/10/2026',
    timeFormatted: '14:30',
    visitors: 'Anderson & Claudilene',
    visitType: 'rotina',
    visitTypeLabel: 'Rotina Periódica',
    housingConditions: 'Regular',
    summary: 'Visita domiciliar mensal realizada com sucesso. Moradia limpa, porém com umidade nas paredes do quarto dos fundos. Dona Geralda está tomando os medicamentos para hipertensão com acompanhamento regular na UBS. As duas crianças estão assíduas na escola. Família acolhedora e grata pelo apoio da Conferência Vicentina.',
    detectedNeeds: ['Acompanhamento de Saúde', 'Apoio Escolar'],
    nextVisitRecommendation: '30 dias',
    protocolNumber: '#VIS-202610-001',
    registeredBy: 'Anderson'
  },
  {
    id: 'vis-2',
    familyId: 'fam-2',
    familyName: 'José Carlos de Oliveira',
    familyCpf: '192.481.092-34',
    familyBairro: 'Centro',
    familyAddress: 'Travessa da Glória, 12',
    date: '2026-10-16',
    dateFormatted: '16/10/2026',
    timeFormatted: '15:45',
    visitors: 'Anderson & Claudilene',
    visitType: 'saude',
    visitTypeLabel: 'Saúde & Cuidados',
    housingConditions: 'Regular',
    summary: 'Visita pastoral com foco na recuperação pós-cirúrgica de Seu José. Ele está em repouso e a filha Cristina tem sido o esteio da casa. Verificamos a receita do colírio especial e encaminhamos pedido à farmácia comunitária paroquial.',
    detectedNeeds: ['Medicamentos / Farmácia', 'Alimentos Especiais'],
    nextVisitRecommendation: '15 dias',
    protocolNumber: '#VIS-202610-002',
    registeredBy: 'Anderson'
  },
  {
    id: 'vis-3',
    familyId: 'fam-3',
    familyName: 'Antônia Mendes de Souza',
    familyCpf: '501.839.201-55',
    familyBairro: 'Jardim Alvorada',
    familyAddress: 'Av. das Palmeiras, 340',
    date: '2026-10-15',
    dateFormatted: '15/10/2026',
    timeFormatted: '10:00',
    visitors: 'Anderson & Paulo Henrique',
    visitType: 'reavaliacao',
    visitTypeLabel: 'Reavaliação Socioeconômica',
    housingConditions: 'Boa',
    summary: 'Visita de reavaliação periódica semestral. A família apresentou excelente evolução: Dona Antônia concluiu o curso de panificação paroquial e já começou a produzir salgados sob encomenda. O filho foi admitido como jovem aprendiz. Perspectiva favorável para promoção gradual da família nos próximos ciclos.',
    detectedNeeds: ['Capacitação Profissional / Feira Paroquial'],
    nextVisitRecommendation: '60 dias',
    protocolNumber: '#VIS-202610-003',
    registeredBy: 'Anderson'
  },
  {
    id: 'vis-4',
    familyId: 'fam-104',
    familyName: 'Francisca Helena Braga',
    familyCpf: '782.119.402-18',
    familyBairro: 'Vila Esperança',
    familyAddress: 'Beco da Paz, 45',
    date: '2026-10-12',
    dateFormatted: '12/10/2026',
    timeFormatted: '16:15',
    visitors: 'Claudilene & Irmã Tereza',
    visitType: 'acolhimento',
    visitTypeLabel: 'Acolhimento Inicial',
    housingConditions: 'Precária',
    summary: 'Primeira visita domiciliar para validação de cadastro e escuta pastoral. Situação de vulnerabilidade social confirmada: casa em terreno acidentado, sem reboco externo e com fiação aparente. Prestamos acolhimento, oramos juntos e orientamos sobre cadastro na rede de assistência.',
    detectedNeeds: ['Cesta Básica Emergencial', 'Roupas e Cobertores', 'Apoio Espiritual'],
    nextVisitRecommendation: '30 dias',
    protocolNumber: '#VIS-202610-004',
    registeredBy: 'Anderson'
  },
  {
    id: 'vis-5',
    familyId: 'fam-5',
    familyName: 'Roberto de Farias',
    familyCpf: '291.847.102-44',
    familyBairro: 'Zona Rural',
    familyAddress: 'Sítio Boa Vista, Km 12',
    date: '2026-09-28',
    dateFormatted: '28/09/2026',
    timeFormatted: '11:20',
    visitors: 'Anderson & Diácono Marcos',
    visitType: 'rotina',
    visitTypeLabel: 'Rotina Periódica',
    housingConditions: 'Regular',
    summary: 'Visita na zona rural. Marcos (filho PCD) está com a cadeira de rodas em pleno funcionamento após manutenção preventiva. Dona Alzira expressou profunda gratidão pela visita fraterna e pelo leite especial entregue no mês anterior.',
    detectedNeeds: ['Fraldas Geriátricas', 'Leite Integral'],
    nextVisitRecommendation: '30 dias',
    protocolNumber: '#VIS-202609-012',
    registeredBy: 'Anderson'
  }
];

export type UserRole = 'administrador' | 'voluntario';

export interface SystemUser {
  id: string;
  uid?: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  shift: string;
  initials: string;
}

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user-anderson',
    name: 'Anderson',
    username: 'anderson',
    email: 'anderson@paroquia.org',
    password: '123',
    role: 'administrador',
    roleLabel: 'Administrador',
    shift: 'Coordenação & Gestão Geral',
    initials: 'AN'
  },
  {
    id: 'user-claudilene',
    name: 'Claudilene',
    username: 'claudilene',
    email: 'claudilene@paroquia.org',
    password: '123',
    role: 'voluntario',
    roleLabel: 'Voluntário',
    shift: 'Pesquisa e Entrega de Cestas',
    initials: 'CL'
  }
];


