/**
 * Mapeamento de departamentos oficiais da UFF baseado nas 3 letras do código das disciplinas.
 * Exemplo: TEE -> Depto. de Engenharia Elétrica, TCC -> Depto. de Ciência da Computação.
 */
export const UFF_DEPARTMENTS: Record<string, string> = {
  // Engenharias & Tecnologia (Niterói)
  TEE: 'Engenharia Elétrica',
  TCC: 'Ciência da Computação',
  TET: 'Engenharia de Telecomunicações',
  TEC: 'Engenharia Civil',
  TEM: 'Engenharia Mecânica',
  TEP: 'Engenharia de Produção',
  TEQ: 'Engenharia Química',
  TDT: 'Desenho Técnico',
  TER: 'Engenharia Agrícola e Meio Ambiente',
  TGE: 'Engenharia (Coordenação)',

  // Ciências Exatas & Naturais
  GMA: 'Matemática Aplicada',
  GAN: 'Análise Matemática',
  GGE: 'Geometria',
  GGM: 'Matemática Geral',
  GFI: 'Física',
  GQI: 'Química Inorgânica',
  GQO: 'Química Orgânica',
  GQA: 'Química Analítica',
  GQF: 'Físico-Química',
  GEO: 'Geologia e Geofísica',
  GET: 'Estatística',
  STA: 'Estatística',

  // Ciências Humanas, Sociais e Filosofia
  GHT: 'História',
  GLE: 'Letras Estrangeiras Modernas',
  GLC: 'Letras Clássicas e Vernáculas',
  GLI: 'Letras e Linguística',
  GSO: 'Sociologia',
  GAP: 'Antropologia',
  GFL: 'Filosofia',
  GCI: 'Ciência da Informação',
  GCO: 'Comunicação Social',
  GCV: 'Cinema e Audiovisual',
  GCP: 'Ciência Política',
  GAG: 'Arte e Estudos Culturais',
  GAT: 'Artes',
  GCL: 'Estudos Culturais',
  GSI: 'Segurança Pública',

  // Ciências Sociais Aplicadas
  SEN: 'Economia',
  SAD: 'Administração',
  SDI: 'Direito Público',
  SDB: 'Direito Privado',
  SDV: 'Direito (Volta Redonda)',
  STT: 'Turismo',
  SSE: 'Serviço Social',
  SSN: 'Serviço Social (Niterói)',
  SFP: 'Finanças Públicas e Contabilidade',
  RIR: 'Relações Internacionais',

  // Biologia & Saúde
  GBG: 'Biologia Geral',
  GMB: 'Microbiologia e Parasitologia',
  GNE: 'Neurobiologia',
  MEC: 'Medicina Clínica',
  MCX: 'Cirurgia',
  MIP: 'Doenças Infecciosas',
  MMS: 'Saúde Coletiva',
  MGM: 'Genética Médica',
  MDI: 'Diagnóstico por Imagem',
  MFO: 'Fonoaudiologia',
  MTO: 'Terapia Ocupacional',
  MEN: 'Enfermagem',
  MTO2: 'Nutrição',
  MFA: 'Farmácia',
  FTO: 'Farmácia e Tecnologia de Medicamentos',
  ODO: 'Odontologia',

  // Veterinária
  VDI: 'Medicina Veterinária',
  VMD: 'Morfologia Veterinária',
  VMT: 'Patologia Veterinária',
  VAD: 'Zootecnia',
  VPA: 'Parasitologia Veterinária',

  // Educação & Psicologia
  PCH: 'Psicologia',
  RPS: 'Psicologia (Polo)',
  DED: 'Didática e Educação',
  PEB: 'Educação Básica',
  EAD: 'Educação a Distância',
  FPS: 'Fundamentos Pedagógicos',

  // Polos Regionais (Campos, Angra, Volta Redonda, Pádua, Macaé, Santo Antônio de Pádua)
  CHT: 'Ciências Humanas (Campos)',
  COC: 'Ciências Sociais (Campos)',
  CPS: 'Ciências da Saúde (Pólos)',
  VMT2: 'Metalurgia (Volta Redonda)',
  VAD2: 'Administração (Volta Redonda)',
  DGP: 'Engenharia de Produção (VR)',
};

/**
 * Retorna o nome por extenso do departamento oficial da UFF pelo código de 3 letras.
 * Se não constar no dicionário, retorna "Depto. XXX".
 */
export function getDepartmentName(deptCode: string): string {
  if (!deptCode) return 'Departamento Geral';
  const clean = deptCode.trim().toUpperCase();
  return UFF_DEPARTMENTS[clean] || `Depto. ${clean}`;
}
