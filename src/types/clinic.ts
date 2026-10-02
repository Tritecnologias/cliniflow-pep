/**
 * Tipos e Modelos do CliniFlow PEP (PostgreSQL Schema Parity)
 */

export type ClinicPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Clinic {
  id: string;
  name: string;
  document_cnpj_cpf: string;
  slug: string;
  plan: ClinicPlan;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'owner' | 'doctor' | 'receptionist';
export type ProfessionalCouncil = 'CRM' | 'CRP' | 'CREFITO' | 'CRO' | 'CRN';

export interface User {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  role: UserRole;
  professional_council?: ProfessionalCouncil;
  council_number?: string;
  council_uf?: string;
  specialty?: string;
  avatar_color?: string;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email: string;
  health_insurance: string; // Ex: 'Unimed', 'Bradesco Saúde', 'Particular', 'SulAmérica'
  insurance_card_number?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  created_at: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type AppointmentType = 'presential' | 'telemedicine';

export type WebRTCProvider = 'livekit' | 'daily' | 'twilio';
export type CloudSignatureProvider = 'birdid' | 'vidaas' | 'clicksign' | 'cfm_cloud';

export type ManchesterRiskLevel = 'red' | 'orange' | 'yellow' | 'green' | 'blue';

export interface PreConsultationTriage {
  id: string;
  appointment_id: string;
  patient_id: string;
  completed_at: string;
  chief_complaint: string;
  symptoms_duration: string;
  pain_scale_eva: number; // 0 a 10
  selected_symptoms: string[];
  red_flags: string[];
  current_medications?: string;
  known_allergies?: string;
  risk_level: ManchesterRiskLevel;
  patient_notes?: string;
  temperature_c?: number;
  blood_pressure_reported?: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  scheduled_at: string; // ISO string
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  telemedicine_room_id?: string;
  webrtc_provider?: WebRTCProvider;
  notes?: string;
  whatsapp_sent_at?: string;
  whatsapp_confirmed_at?: string;
  triage?: PreConsultationTriage;
  created_at: string;
}

// Campos flexíveis por especialidade para a coluna anamnese_data (JSONB)
export interface AnamneseMedical {
  queixa_principal: string;
  hda: string; // História da Doença Atual
  antecedentes_pessoais: string;
  medicamentos_em_uso: string;
  pressao_arterial_sistolica?: number;
  pressao_arterial_diastolica?: number;
  frequencia_cardiaca?: number;
  peso_kg?: number;
  altura_cm?: number;
  ausculta_cardiopulmonar?: string;
  conduta_clinica: string;
  escala_dor_eva?: number;
  triagem_pre_consulta?: PreConsultationTriage;
}

export interface AnamnesePsychology {
  demanda_inicial: string;
  historico_familiar_relacional: string;
  estado_humor_afeto: string;
  recursos_enfrentamento: string;
  planejamento_terapeutico: string;
}

export interface AnamneseDental {
  queixa_estetico_funcional: string;
  higiene_bucal: 'otima' | 'boa' | 'regular' | 'deficiente';
  dentes_afetados: number[]; // números FDI: 11 a 48
  procedimento_proposto: string;
  observacoes_odontograma: string;
}

export interface AnamneseNutrition {
  objetivo_nutricional: string;
  recordatorio_24h: string;
  circunferencia_cintura_cm?: number;
  percentual_gordura?: number;
  restricoes_alimentares: string;
  plano_dietetico_resumo: string;
}

export interface AnamnesePhysiotherapy {
  diagnostico_cinetico_funcional: string;
  escala_dor_eva: number; // 0 a 10
  amplitude_movimento: string;
  testes_ortopedicos: string;
  objetivos_reabilitacao: string;
}

export type SpecialtyAnamnese =
  | { type: 'medical'; data: AnamneseMedical }
  | { type: 'psychology'; data: AnamnesePsychology }
  | { type: 'dental'; data: AnamneseDental }
  | { type: 'nutrition'; data: AnamneseNutrition }
  | { type: 'physiotherapy'; data: AnamnesePhysiotherapy };

export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  appointment_id?: string;
  anamnese_data: SpecialtyAnamnese; // JSONB
  diagnosis_cid10?: string; // Código CID-10 (Ex: 'I10')
  diagnosis_description?: string;
  prescription?: string; // Texto estruturado da receita
  prescription_items?: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  certificate_days?: number; // Atestado médico
  is_signed: boolean;
  signature_hash?: string; // SHA-256 ICP-Brasil
  signature_provider?: CloudSignatureProvider;
  signature_tsa_stamp?: string; // Carimbo do tempo ACT
  signed_at?: string;
  signed_by_name?: string;
  signed_by_council?: string;
  biometric_verified?: boolean;
  biometric_auth_type?: string;
  biometric_credential_id?: string;
  created_at: string;
}

export type AuditAction = 'CREATED' | 'VIEWED' | 'EXPORTED' | 'SIGNED';

export interface MedicalAuditTrail {
  id: string;
  record_id: string;
  patient_name?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: AuditAction;
  details?: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface CID10Item {
  code: string;
  description: string;
  chapter: string;
}

export type TimeUnit = 'minutes' | 'hours' | 'days';

export interface ReminderTriggerRule {
  id: string;
  name: string;
  enabled: boolean;
  time_value: number;
  time_unit: TimeUnit;
  target_type: 'all' | 'presential' | 'telemedicine';
  message_template: string;
  include_telemedicine_link: boolean;
  include_location_map: boolean;
  request_confirmation: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  send_working_hours_only: boolean;
  working_hours_start: string; // e.g., "08:00"
  working_hours_end: string; // e.g., "20:00"
  auto_confirm_keyword: string; // "1"
  auto_reschedule_keyword: string; // "2"
  rules: ReminderTriggerRule[];
  api_gateway: 'meta_cloud' | 'zapi' | 'evolution';
  notify_reception_on_cancel: boolean;
}

export type DocumentTemplateCategory =
  | 'atestado'
  | 'declaracao'
  | 'laudo'
  | 'encaminhamento';

export interface DocumentTemplate {
  id: string;
  clinic_id: string;
  title: string;
  category: DocumentTemplateCategory;
  council_target?: ProfessionalCouncil | 'TODOS';
  description: string;
  content: string;
  requires_cid: boolean;
  requires_days: boolean;
  created_at: string;
  updated_at: string;
}

// Gestão Financeira & Faturamento
export type PaymentMethod =
  | 'pix'
  | 'convenio'
  | 'particular_cartao'
  | 'particular_dinheiro'
  | 'boleto';

export type PaymentStatus =
  | 'pago'
  | 'pendente'
  | 'glosado'
  | 'estornado';

export type TransactionType = 'receita' | 'despesa';

export type TransactionCategory =
  | 'consulta_particular'
  | 'repasse_convenio'
  | 'teleconsulta'
  | 'procedimento'
  | 'exame'
  | 'custo_operacional'
  | 'honorarios_medicos'
  | 'insumos_medicamentos'
  | 'outros';

export interface FinancialTransaction {
  id: string;
  clinic_id: string;
  patient_id?: string;
  patient_name?: string;
  appointment_id?: string;
  professional_id?: string;
  professional_name?: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  type: TransactionType;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string;
  due_date?: string;
  convenio_name?: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}


