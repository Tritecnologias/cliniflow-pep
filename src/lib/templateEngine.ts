import { Patient, User, Clinic, CID10Item } from '../types/clinic';

export interface TemplateContext {
  patient?: Patient | null;
  professional?: User | null;
  clinic?: Clinic | null;
  consultationDate?: string;
  startTime?: string;
  endTime?: string;
  cid10?: string;
  cid10Description?: string;
  daysAway?: number;
  observations?: string;
}

export interface PlaceholderInfo {
  tag: string;
  label: string;
  description: string;
  example: string;
  group: 'paciente' | 'atendimento' | 'profissional' | 'clinica' | 'clinico';
}

export const AVAILABLE_PLACEHOLDERS: PlaceholderInfo[] = [
  // Paciente
  {
    tag: '{{paciente_nome}}',
    label: 'Nome do Paciente',
    description: 'Nome completo cadastrado',
    example: 'Ana Maria Rodrigues Silva',
    group: 'paciente',
  },
  {
    tag: '{{paciente_cpf}}',
    label: 'CPF do Paciente',
    description: 'Número de CPF formatado',
    example: '284.195.408-22',
    group: 'paciente',
  },
  {
    tag: '{{paciente_idade}}',
    label: 'Idade',
    description: 'Idade calculada a partir da data de nascimento',
    example: '38 anos',
    group: 'paciente',
  },
  {
    tag: '{{paciente_nascimento}}',
    label: 'Data de Nascimento',
    description: 'Data de nascimento em formato DD/MM/AAAA',
    example: '14/05/1988',
    group: 'paciente',
  },
  {
    tag: '{{paciente_convenio}}',
    label: 'Convênio / Plano',
    description: 'Operadora de saúde ou Particular',
    example: 'Bradesco Saúde Top Nacional',
    group: 'paciente',
  },
  {
    tag: '{{paciente_telefone}}',
    label: 'Telefone do Paciente',
    description: 'Telefone de contato cadastrado',
    example: '(11) 98123-4567',
    group: 'paciente',
  },

  // Atendimento
  {
    tag: '{{data_consulta}}',
    label: 'Data da Consulta / Emissão',
    description: 'Data do atendimento formatada por extenso ou padrão BR',
    example: '30/09/2026',
    group: 'atendimento',
  },
  {
    tag: '{{horario_inicio}}',
    label: 'Horário de Início',
    description: 'Horário previsto ou de chegada do atendimento',
    example: '09:00',
    group: 'atendimento',
  },
  {
    tag: '{{horario_fim}}',
    label: 'Horário de Término',
    description: 'Horário de encerramento do atendimento',
    example: '09:45',
    group: 'atendimento',
  },

  // Clínico (Atestado / Laudo / CID)
  {
    tag: '{{dias_afastamento}}',
    label: 'Dias de Afastamento',
    description: 'Número de dias recomendados para repouso laboral',
    example: '3',
    group: 'clinico',
  },
  {
    tag: '{{dias_afastamento_extenso}}',
    label: 'Dias por Extenso',
    description: 'Quantidade de dias escrita por extenso',
    example: 'três',
    group: 'clinico',
  },
  {
    tag: '{{cid10}}',
    label: 'Código CID-10',
    description: 'Classificação Internacional de Doenças',
    example: 'I10',
    group: 'clinico',
  },
  {
    tag: '{{cid10_descricao}}',
    label: 'Descrição do CID-10',
    description: 'Nome da patologia ou diagnóstico',
    example: 'Hipertensão essencial (primária)',
    group: 'clinico',
  },
  {
    tag: '{{observacoes}}',
    label: 'Observações Clínicas',
    description: 'Orientações, restrições e notas adicionais',
    example: 'Repouso domiciliar com hidratação rigorosa.',
    group: 'clinico',
  },

  // Profissional
  {
    tag: '{{medico_nome}}',
    label: 'Nome do Profissional',
    description: 'Nome completo com titulação profissional',
    example: 'Dra. Mariana Costa',
    group: 'profissional',
  },
  {
    tag: '{{medico_conselho}}',
    label: 'Conselho Profissional',
    description: 'Sigla e número do conselho regional (CRM, CRP, CRO)',
    example: 'CRM/SP 148920',
    group: 'profissional',
  },
  {
    tag: '{{medico_especialidade}}',
    label: 'Especialidade',
    description: 'Área de atuação profissional',
    example: 'Cardiologia & Clínica Médica',
    group: 'profissional',
  },

  // Clínica
  {
    tag: '{{clinica_nome}}',
    label: 'Nome da Clínica',
    description: 'Razão social ou nome fantasia da clínica',
    example: 'Clínica Integrada Morumbi',
    group: 'clinica',
  },
  {
    tag: '{{clinica_cnpj}}',
    label: 'CNPJ da Clínica',
    description: 'Cadastro Nacional de Pessoa Jurídica',
    example: '45.123.890/0001-34',
    group: 'clinica',
  },
  {
    tag: '{{clinica_endereco}}',
    label: 'Endereço da Clínica',
    description: 'Endereço completo da sede',
    example: 'Av. Giovanni Gronchi, 5819 - Morumbi, São Paulo - SP',
    group: 'clinica',
  },
  {
    tag: '{{clinica_cidade}}',
    label: 'Cidade e UF',
    description: 'Localidade para datação jurídica',
    example: 'São Paulo - SP',
    group: 'clinica',
  },
];

function numberToExtenso(num: number): string {
  const extensos: Record<number, string> = {
    1: 'um',
    2: 'dois',
    3: 'três',
    4: 'quatro',
    5: 'cinco',
    6: 'seis',
    7: 'sete',
    8: 'oito',
    9: 'nove',
    10: 'dez',
    14: 'quatorze',
    15: 'quinze',
    30: 'trinta',
  };
  return extensos[num] || `${num}`;
}

function calculateAge(birthDateStr?: string): string {
  if (!birthDateStr) return 'Idade não informada';
  try {
    const parts = birthDateStr.split('-');
    if (parts.length === 3) {
      const birthYear = parseInt(parts[0], 10);
      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);
      const birth = new Date(birthYear, birthMonth, birthDay);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} anos`;
    }
    return 'Idade não informada';
  } catch {
    return 'Idade não informada';
  }
}

function formatDateBR(dateStr?: string): string {
  if (!dateStr) {
    return new Date().toLocaleDateString('pt-BR');
  }
  try {
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Preenche o modelo de texto substituindo todos os {{placeholders}}
 * pelos dados reais do contexto clínico.
 */
export function resolveTemplatePlaceholders(
  content: string,
  ctx: TemplateContext
): string {
  if (!content) return '';

  const patient = ctx.patient;
  const professional = ctx.professional;
  const clinic = ctx.clinic;

  const daysAway = ctx.daysAway !== undefined ? ctx.daysAway : 1;
  const daysExtenso = numberToExtenso(daysAway);

  const replacements: Record<string, string> = {
    '{{paciente_nome}}': patient?.name || 'Ana Maria Rodrigues Silva',
    '{{paciente_cpf}}': patient?.cpf || '284.195.408-22',
    '{{paciente_idade}}': calculateAge(patient?.birth_date),
    '{{paciente_nascimento}}': formatDateBR(patient?.birth_date || '1988-05-14'),
    '{{paciente_convenio}}':
      patient?.health_insurance || 'Particular (Sem Convênio)',
    '{{paciente_telefone}}': patient?.phone || '(11) 98123-4567',

    '{{data_consulta}}': ctx.consultationDate || new Date().toLocaleDateString('pt-BR'),
    '{{horario_inicio}}': ctx.startTime || '09:00',
    '{{horario_fim}}': ctx.endTime || '09:45',

    '{{dias_afastamento}}': `${daysAway}`,
    '{{dias_afastamento_extenso}}': daysExtenso,
    '{{cid10}}': ctx.cid10 || 'Z00.0',
    '{{cid10_descricao}}': ctx.cid10Description || 'Exame médico geral (Check-up de rotina)',
    '{{observacoes}}':
      ctx.observations ||
      'Paciente orientado(a) quanto a repouso e hidratação. Retorno se persistirem sintomas.',

    '{{medico_nome}}': professional?.name || 'Dra. Mariana Costa',
    '{{medico_conselho}}':
      professional?.professional_council && professional?.council_number
        ? `${professional.professional_council}/${professional.council_uf || 'SP'} ${professional.council_number}`
        : 'CRM/SP 148920',
    '{{medico_especialidade}}': 'Clínica Médica & Cardiologia',

    '{{clinica_nome}}': clinic?.name || 'Clínica Integrada Morumbi',
    '{{clinica_cnpj}}': clinic?.document_cnpj_cpf || '45.123.890/0001-34',
    '{{clinica_endereco}}': 'Av. Giovanni Gronchi, 5819 - Morumbi, São Paulo - SP',
    '{{clinica_cidade}}': 'São Paulo - SP',
  };

  let resolved = content;
  for (const [tag, value] of Object.entries(replacements)) {
    // Replace all instances of tag
    resolved = resolved.split(tag).join(value);
  }

  return resolved;
}

/**
 * Detecta todos os placeholders contidos em um texto
 */
export function extractPlaceholders(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}
