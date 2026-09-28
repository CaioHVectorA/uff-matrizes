import { MatrixRawData } from './uff-scraper';
import ccJson from '@/data/matrices/ciencia-da-computacao.json';
import siJson from '@/data/matrices/sistemas-de-informacao.json';
import esJson from '@/data/matrices/engenharia-de-software.json';
import etJson from '@/data/matrices/engenharia-de-telecomunicacoes.json';
import cdJson from '@/data/matrices/ciencia-de-dados.json';
import eeJson from '@/data/matrices/engenharia-eletrica.json';
import epJson from '@/data/matrices/engenharia-de-producao.json';

export const BUILTIN_UFF_MATRICES: Record<string, MatrixRawData> = {
  'ciencia-da-computacao': ccJson as MatrixRawData,
  'sistemas-de-informacao': siJson as MatrixRawData,
  'engenharia-de-software': esJson as MatrixRawData,
  'engenharia-de-telecomunicacoes': etJson as MatrixRawData,
  'ciencia-de-dados': cdJson as MatrixRawData,
  'engenharia-eletrica': eeJson as MatrixRawData,
  'engenharia-de-producao': epJson as MatrixRawData,
};
