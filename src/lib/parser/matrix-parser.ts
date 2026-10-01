import { MatrixRawData, SubjectRawData, MatrixHoursBreakdown } from '../scraper/uff-scraper';

/**
 * Extracts prerequisite subject codes from text.
 * E.g., "[1 - GGM00137] FUNDAMENTOS DE CÁLCULO E GEOMETRIA" -> ["GGM00137"]
 * or "[Não Periodizada - TCC00328] PROGRAMAÇÃO ORIENTADA A OBJETOS" -> ["TCC00328"]
 * or "GGM00137, GMA00154" -> ["GGM00137", "GMA00154"]
 */
export function extractPrerequisiteCodes(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[A-Z]{3}\d{5}/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map(c => c.toUpperCase())));
}

/**
 * Parses UFF Matriz Curricular raw text (extracted from PDF or pasted text)
 */
export function parseMatrixText(text: string): MatrixRawData {
  let courseName = 'Curso UFF';
  let matrixCode = '1';
  let courseCode = '38.01.003';
  let degree: string | undefined;
  let qualification: string | undefined;
  let emphasis: string | undefined;
  let trainingLine: string | undefined;

  let totalHours = 0;
  let mandatoryHours = 0;
  let electiveHours = 0;
  let choiceHours = 0;
  let emphasisHours = 0;
  let freeChoiceHours = 0;
  let complementaryHours = 0;

  // Header Extractions
  const courseMatch = text.match(/Curso:\s*([^\n\r]+)/i);
  if (courseMatch) courseName = courseMatch[1].replace(/Titula[çc][ãa]o:.*/i, '').trim();

  const matrixMatch = text.match(/Curr[íi]culo:\s*([0-9\.\-]+|[^\s\n\r]+)/i);
  if (matrixMatch) courseCode = matrixMatch[1].trim();

  const versionMatch = text.match(/Vers[aã]o:\s*([^\s\n\r]+)/i);
  if (versionMatch) matrixCode = versionMatch[1].trim();

  const titMatch = text.match(/Titula[çc][ãa]o:\s*([^H\n\r]+?)(?=Habilita|Ênfase|Linha|$)/i);
  if (titMatch && titMatch[1].trim() !== '-') degree = titMatch[1].trim();

  const habMatch = text.match(/Habilita[çc][ãa]o:\s*([^Ê\n\r]+?)(?=Ênfase|Linha|Turno|$)/i);
  if (habMatch && habMatch[1].trim() !== '-') qualification = habMatch[1].trim();

  const enfMatch = text.match(/Ênfase:\s*([^L\n\r]+?)(?=Linha|Turno|$)/i);
  if (enfMatch && enfMatch[1].trim() !== '-') emphasis = enfMatch[1].trim();

  const linMatch = text.match(/Linha de Forma[çc][ãa]o:\s*([^\n\r]+?)(?=Turno|Curr[íi]culo|$)/i);
  if (linMatch && linMatch[1].trim() !== '-') trainingLine = linMatch[1].trim();

  const totalHoursMatch = text.match(/Carga hor[áa]ria total:\s*(\d+)/i);
  if (totalHoursMatch) totalHours = parseInt(totalHoursMatch[1], 10);

  const obMatch = text.match(/\(OB\)\s*Carga hor[áa]ria obrigat[óo]ria:\s*(\d+)/i);
  if (obMatch) mandatoryHours = parseInt(obMatch[1], 10);

  const optMatch = text.match(/\(O\)\s*Carga hor[áa]ria optativa:\s*(\d+)/i);
  if (optMatch) electiveHours = parseInt(optMatch[1], 10);

  const choiceMatch = text.match(/\(E\)\s*Carga hor[áa]ria obrigat[óo]ria de escolha:\s*(\d+)/i);
  if (choiceMatch) choiceHours = parseInt(choiceMatch[1], 10);

  const onMatch = text.match(/\(ON\)\s*Carga hor[áa]ria optativa de [êe]nfase:\s*(\d+)/i);
  if (onMatch) emphasisHours = parseInt(onMatch[1], 10);

  const olMatch = text.match(/\(OL\)\s*Carga hor[áa]ria obrigat[óo]ria livre:\s*(\d+)/i);
  if (olMatch) freeChoiceHours = parseInt(olMatch[1], 10);

  const acMatch = text.match(/\(AC\)\s*Carga hor[áa]ria de atividade complementar:\s*(\d+)/i);
  if (acMatch) complementaryHours = parseInt(acMatch[1], 10);


  const subjects: SubjectRawData[] = [];
  const lines = text.split('\n');

  let currentPeriod = 1;
  const subjectCodeRegex = /\b([A-Z]{3}\d{5})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect period headers
    const periodMatch = line.match(/(\d+)º?\s*per[íi]odo/i);
    if (periodMatch) {
      currentPeriod = parseInt(periodMatch[1], 10);
      continue;
    }

    if (/n[aã]o\s+periodizada|optativas|atividades complementares/i.test(line) && !line.match(subjectCodeRegex)) {
      currentPeriod = 0; // 0 for non-periodized/electives
      continue;
    }

    // Match subject code line
    const codeMatch = line.match(subjectCodeRegex);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();

      // Look ahead a few lines to combine multi-line subject description/prerequisites
      let combinedText = line;
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        // Stop if next line is another subject code, header, or period header
        if (
          !nextLine ||
          nextLine.match(subjectCodeRegex) ||
          /º?\s*per[íi]odo/i.test(nextLine) ||
          /n[aã]o\s+periodizada/i.test(nextLine) ||
          /Gerado em:/i.test(nextLine) ||
          /Este documento foi gerado/i.test(nextLine) ||
          /REL\d+/i.test(nextLine)
        ) {
          break;
        }
        combinedText += ' ' + nextLine;
        j++;
      }

      // Type extraction
      let type: 'OBRIGATORIA' | 'OPTATIVA' | 'ELETIVA' | 'COMPLEMENTAR' | 'ESCOLHA' | 'OPTATIVA_ENFASE' = 'OBRIGATORIA';
      if (/\bOB\b/i.test(combinedText)) {
        type = 'OBRIGATORIA';
      } else if (/\bAC\b/i.test(combinedText)) {
        type = 'COMPLEMENTAR';
      } else if (/\bON\b/i.test(combinedText) || /optativa de [êe]nfase/i.test(combinedText)) {
        type = 'OPTATIVA_ENFASE';
      } else if (/\bE\b/i.test(combinedText) && !/\bOB\b/i.test(combinedText) && !/\bAC\b/i.test(combinedText)) {
        type = 'ESCOLHA';
      } else if (/\b(O|OPT|OPTATIVA)\b/i.test(combinedText)) {
        type = 'OPTATIVA';
      } else if (/\b(EL|ELE|ELETIVA)\b/i.test(combinedText)) {
        type = 'ELETIVA';
      }

      // Workload extractions
      let workload = 60;
      let theoreticalHours: number | undefined;
      let practicalHours: number | undefined;
      let extensionHours: number | undefined;
      let chPreReq: number | undefined;

      // Extract hours sequence like "60 0 0 60 0" or "0 30 0 30 20" or "40 0 0 40 0"
      const hoursSeqMatch = combinedText.match(/\b(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s+(\d{1,3}))?\b/);
      if (hoursSeqMatch) {
        theoreticalHours = parseInt(hoursSeqMatch[1], 10);
        practicalHours = parseInt(hoursSeqMatch[2], 10);
        workload = parseInt(hoursSeqMatch[4], 10) || 60;
        if (hoursSeqMatch[5]) {
          extensionHours = parseInt(hoursSeqMatch[5], 10);
        }
      } else {
        const chMatch = combinedText.match(/\b(15|30|40|45|50|60|68|75|80|90|102|105|120|135|150|165|180|210|240|280|510)\b/);
        if (chMatch) {
          workload = parseInt(chMatch[1], 10);
        }
      }

      // CHPre-Req check (e.g. 600, 1500, 2500, 2714)
      const chPreReqMatch = combinedText.match(/\b(600|1500|2500|2714)\b/);
      if (chPreReqMatch) {
        chPreReq = parseInt(chPreReqMatch[1], 10);
      }

      // Special prerequisite (e.g. "9º período completo")
      let specialPrereq: string | undefined;
      if (/9º\s*per[íi]odo\s+completo/i.test(combinedText)) {
        specialPrereq = '9º período completo';
      }

      // Subject name extraction
      let name = '';
      const nameMatch = combinedText.match(new RegExp(`${code}\\s+(.*?)\\s+(?:OB|O|E|AC|EL|ON|\\d{2,3}\\s+\\d+)`, 'i'));
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
      } else {
        name = combinedText
          .replace(code, '')
          .replace(/\[[^\]]+\]/g, '') // remove brackets
          .replace(/Gerado em:.*|Este documento foi.*|REL\d+|MATRIZ CURRICULAR/gi, '')
          .replace(/\b(OB|O|E|AC|EL|ON|CHT|CHP|CHEs|CHTotal|CHEx|CHPre-Req|Pré-requisitos|Co-requisitos)\b/gi, '')
          .replace(/\b\d+\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      name = name.replace(/\[[^\]]+\]/g, '').replace(/\b(OB|O|E|AC|EL|ON)\b/gi, '').replace(/\s+/g, ' ').trim();
      if (!name || name.length < 3) {
        name = `Disciplina ${code}`;
      }

      // Infer subject track/emphasis
      let subjectEmphasis: string | undefined;
      const lowerName = name.toLowerCase();
      if (lowerName.includes('potência') || lowerName.includes('potencia') || lowerName.includes('transformador') || lowerName.includes('subestaç') || lowerName.includes('transmissão') || lowerName.includes('distribuição') || lowerName.includes('geração') || lowerName.includes('transitórios') || lowerName.includes('alta tensão')) {
        subjectEmphasis = 'Sistemas de Potência';
      } else if (lowerName.includes('eletrônic') || lowerName.includes('eletronic') || lowerName.includes('microcontrolador') || lowerName.includes('semicondutor') || lowerName.includes('circuitos digitais') || lowerName.includes('hardware') || lowerName.includes('ieds')) {
        subjectEmphasis = 'Eletrônica & Hardware';
      } else if (lowerName.includes('controle') || lowerName.includes('automação') || lowerName.includes('automacao') || lowerName.includes('robót') || lowerName.includes('sensores') || lowerName.includes('instrumentação') || lowerName.includes('acionamento')) {
        subjectEmphasis = 'Controle & Automação';
      } else if (lowerName.includes('telecomunica') || lowerName.includes('redes') || lowerName.includes('antena') || lowerName.includes('propagação') || lowerName.includes('sinais') || lowerName.includes('comunicação')) {
        subjectEmphasis = 'Telecomunicações & Redes';
      } else if (lowerName.includes('software') || lowerName.includes('computador') || lowerName.includes('algoritmo') || lowerName.includes('dados') || lowerName.includes('inteligência artificial') || lowerName.includes('aprendizado') || lowerName.includes('banco de dados') || code.startsWith('TCC')) {
        subjectEmphasis = 'Computação & Software';
      }

      // Prerequisites extraction: extract codes found in brackets or prerequisite text, excluding subject's own code
      const allCodesInEntry = extractPrerequisiteCodes(combinedText).filter(c => c !== code);
      const prereqCodes: string[] = [];
      const coreqCodes: string[] = [];

      for (const itemCode of allCodesInEntry) {
        prereqCodes.push(itemCode);
      }

      // Check if already added
      const existingIdx = subjects.findIndex(s => s.code === code);
      if (existingIdx === -1) {
        subjects.push({
          code,
          name,
          period: currentPeriod,
          workload,
          type,
          prerequisites: Array.from(new Set(prereqCodes)),
          corequisites: Array.from(new Set(coreqCodes)),
          chPreReq,
          specialPrereq,
          theoreticalHours,
          practicalHours,
          extensionHours,
          emphasis: subjectEmphasis,
        });
      }
    }
  }

  // Calculate hours if totalHours was not in header
  if (!mandatoryHours) {
    mandatoryHours = subjects
      .filter(s => s.type === 'OBRIGATORIA')
      .reduce((acc, s) => acc + s.workload, 0);
  }
  if (!electiveHours) {
    electiveHours = subjects
      .filter(s => s.type === 'OPTATIVA' || s.type === 'ELETIVA')
      .reduce((acc, s) => acc + s.workload, 0);
  }
  if (!choiceHours) {
    choiceHours = subjects
      .filter(s => s.type === 'ESCOLHA')
      .reduce((acc, s) => acc + s.workload, 0);
  }
  if (!totalHours) {
    totalHours = mandatoryHours + electiveHours + choiceHours + emphasisHours + freeChoiceHours + complementaryHours;
  }

  const hoursBreakdown: MatrixHoursBreakdown = {
    mandatory: mandatoryHours,
    choice: choiceHours,
    elective: electiveHours,
    emphasis: emphasisHours,
    freeChoice: freeChoiceHours,
    complementary: complementaryHours,
    total: totalHours,
  };

  // Find all distinct emphases across subjects
  const detectedEmphases = Array.from(
    new Set(subjects.map(s => s.emphasis).filter(Boolean) as string[])
  );

  return {
    courseCode,
    courseName,
    matrixCode,
    matrixName: `Matriz Curricular ${courseName}`,
    degree,
    qualification,
    emphasis,
    trainingLine,
    availableEmphases: detectedEmphases.length > 0 ? detectedEmphases : undefined,
    totalHours,
    mandatoryHours,
    electiveHours,
    hoursBreakdown,
    subjects,
  };
}


