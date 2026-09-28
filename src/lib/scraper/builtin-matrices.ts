import { MatrixRawData } from './uff-scraper';

export const BUILTIN_UFF_MATRICES: Record<string, MatrixRawData> = {
  'ciencia-da-computacao': {
    courseCode: 'TCC-CC',
    courseName: 'Ciência da Computação',
    matrixCode: '2023.1',
    matrixName: 'Matriz Curricular Ciência da Computação UFF (Niterói)',
    campus: 'Praia Vermelha - Niterói',
    degree: 'Bacharelado',
    totalHours: 3000,
    mandatoryHours: 2400,
    electiveHours: 600,
    subjects: [
      // 1º Período
      { code: 'TCC00288', name: 'Programação de Computadores I', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'GAN00021', name: 'Cálculo Diferencial e Integral I', period: 1, workload: 90, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'GAN00007', name: 'Álgebra Linear I', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TCC00287', name: 'Fundamentos de Ciência da Computação', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'GET00118', name: 'Estatística e Probabilidade I', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },

      // 2º Período
      { code: 'TCC00289', name: 'Programação de Computadores II', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00288'] },
      { code: 'TCC00290', name: 'Estrutura de Dados', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00288'] },
      { code: 'GAN00022', name: 'Cálculo Diferencial e Integral II', period: 2, workload: 90, type: 'OBRIGATORIA', prerequisites: ['GAN00021'] },
      { code: 'TCC00291', name: 'Matemática Discreta', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TCC00292', name: 'Circuitos Lógicos', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },

      // 3º Período
      { code: 'TCC00293', name: 'Análise de Algoritmos', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00290', 'TCC00291'] },
      { code: 'TCC00294', name: 'Organização e Arquitetura de Computadores', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00292'] },
      { code: 'TCC00295', name: 'Engenharia de Software I', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00289'] },
      { code: 'TCC00296', name: 'Linguagens de Programação', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00289', 'TCC00290'] },
      { code: 'GAN00023', name: 'Cálculo Numérico', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['GAN00021', 'GAN00007'] },

      // 4º Período
      { code: 'TCC00297', name: 'Sistemas Operacionais', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00294'] },
      { code: 'TCC00298', name: 'Banco de Dados I', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00290'] },
      { code: 'TCC00299', name: 'Redes de Computadores I', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00294'] },
      { code: 'TCC00300', name: 'Teoria da Computação', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00291'] },

      // 5º Período
      { code: 'TCC00301', name: 'Inteligência Artificial', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00293'] },
      { code: 'TCC00302', name: 'Computação Gráfica', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['GAN00007', 'TCC00290'] },
      { code: 'TCC00303', name: 'Sistemas Distribuídos', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00297', 'TCC00299'] },
      { code: 'TCC00304', name: 'Compiladores', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00296', 'TCC00300'] },

      // 6º Período
      { code: 'TCC00305', name: 'Segurança de Sistemas', period: 6, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00299'] },
      { code: 'TCC00306', name: 'Projeto Final de Curso I', period: 6, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00295'] },

      // 7º Período
      { code: 'TCC00307', name: 'Projeto Final de Curso II', period: 7, workload: 120, type: 'OBRIGATORIA', prerequisites: ['TCC00306'] },

      // Optativas
      { code: 'TCC00310', name: 'Tópicos Especiais em Machine Learning', period: 0, workload: 60, type: 'OPTATIVA', prerequisites: ['GET00118', 'TCC00288'] },
      { code: 'TCC00311', name: 'Desenvolvimento Web Moderno', period: 0, workload: 60, type: 'OPTATIVA', prerequisites: ['TCC00289'] },
      { code: 'TCC00312', name: 'Computação em Nuvem', period: 0, workload: 60, type: 'OPTATIVA', prerequisites: ['TCC00299'] },
      { code: 'TCC00313', name: 'Processamento de Linguagem Natural', period: 0, workload: 60, type: 'OPTATIVA', prerequisites: ['TCC00301'] },
    ],
  },
  'sistemas-de-informacao': {
    courseCode: 'TSI-SI',
    courseName: 'Sistemas de Informação',
    matrixCode: '2023.1',
    matrixName: 'Matriz Curricular Sistemas de Informação UFF',
    campus: 'Niterói',
    degree: 'Bacharelado',
    totalHours: 2900,
    mandatoryHours: 2300,
    electiveHours: 600,
    subjects: [
      { code: 'TCC00288', name: 'Programação de Computadores I', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'GAN00021', name: 'Cálculo Diferencial e Integral I', period: 1, workload: 90, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TCC00289', name: 'Programação de Computadores II', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00288'] },
      { code: 'TCC00290', name: 'Estrutura de Dados', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00288'] },
      { code: 'TCC00298', name: 'Banco de Dados I', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00290'] },
      { code: 'TCC00295', name: 'Engenharia de Software I', period: 3, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00289'] },
      { code: 'TSI00101', name: 'Gestão de Tecnologia da Informação', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TSI00102', name: 'Governança de TI', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TSI00101'] },
    ],
  },
  'engenharia-de-software': {
    courseCode: 'TES-ES',
    courseName: 'Engenharia de Software',
    matrixCode: '2023.1',
    matrixName: 'Matriz Curricular Engenharia de Software UFF',
    campus: 'Rio Das Ostras',
    degree: 'Bacharelado',
    totalHours: 3200,
    mandatoryHours: 2500,
    electiveHours: 700,
    subjects: [
      { code: 'TCC00288', name: 'Programação de Computadores I', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'GAN00021', name: 'Cálculo I', period: 1, workload: 90, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TES00101', name: 'Introdução à Engenharia de Software', period: 1, workload: 60, type: 'OBRIGATORIA', prerequisites: [] },
      { code: 'TCC00289', name: 'Programação de Computadores II', period: 2, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00288'] },
      { code: 'TES00102', name: 'Arquitetura de Software', period: 4, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TCC00289'] },
      { code: 'TES00103', name: 'Testes e Qualidade de Software', period: 5, workload: 60, type: 'OBRIGATORIA', prerequisites: ['TES00102'] },
    ],
  },
};
