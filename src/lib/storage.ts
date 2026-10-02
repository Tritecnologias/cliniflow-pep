import {
  Clinic,
  User,
  Patient,
  Appointment,
  MedicalRecord,
  MedicalAuditTrail,
  ClinicPlan,
  AppointmentStatus,
  AuditAction,
  ReminderSettings,
  DocumentTemplate,
  FinancialTransaction,
} from '../types/clinic';
import {
  INITIAL_CLINIC,
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_AUDIT_TRAIL,
  INITIAL_DOCUMENT_TEMPLATES,
  INITIAL_FINANCIAL_TRANSACTIONS,
} from '../data/mockData';

export const INITIAL_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  send_working_hours_only: true,
  working_hours_start: '08:00',
  working_hours_end: '20:00',
  auto_confirm_keyword: '1',
  auto_reschedule_keyword: '2',
  api_gateway: 'meta_cloud',
  notify_reception_on_cancel: true,
  rules: [
    {
      id: 'rule-1',
      name: '1º Lembrete Prévio (Confirmação 1-Clique)',
      enabled: true,
      time_value: 24,
      time_unit: 'hours',
      target_type: 'all',
      message_template:
        'Olá, *{paciente}*! Lembramos da sua consulta na *{clinica}* com *{medico}* em {data} às {horario}. Responda *1* para confirmar ou *2* para reagendar.',
      include_telemedicine_link: true,
      include_location_map: true,
      request_confirmation: true,
    },
    {
      id: 'rule-2',
      name: '2º Lembrete de Reforço (Mesmo Dia)',
      enabled: true,
      time_value: 2,
      time_unit: 'hours',
      target_type: 'all',
      message_template:
        'Olá, *{paciente}*! Sua consulta com *{medico}* na *{clinica}* acontecerá hoje às *{horario}*. Chegue com 10 minutos de antecedência.',
      include_telemedicine_link: true,
      include_location_map: false,
      request_confirmation: false,
    },
    {
      id: 'rule-3',
      name: 'Instruções e Acesso à Telemedicina',
      enabled: true,
      time_value: 15,
      time_unit: 'minutes',
      target_type: 'telemedicine',
      message_template:
        'Sua teleconsulta com *{medico}* iniciará em 15 minutos! Clique no link a seguir para acessar a sala segura: {link_telemedicina}',
      include_telemedicine_link: true,
      include_location_map: false,
      request_confirmation: false,
    },
  ],
};

const STORAGE_KEYS = {
  CLINIC: 'cliniflow_clinic_v1',
  USERS: 'cliniflow_users_v1',
  ACTIVE_USER_ID: 'cliniflow_active_user_id_v1',
  PATIENTS: 'cliniflow_patients_v1',
  APPOINTMENTS: 'cliniflow_appointments_v1',
  RECORDS: 'cliniflow_records_v1',
  AUDIT: 'cliniflow_audit_v1',
  REMINDERS: 'cliniflow_reminders_v1',
  TEMPLATES: 'cliniflow_document_templates_v1',
  TRANSACTIONS: 'cliniflow_financial_transactions_v1',
};

// Safe JSON loader
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Error loading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const Storage = {
  // Clinic & Plan
  getClinic(): Clinic {
    return loadFromStorage<Clinic>(STORAGE_KEYS.CLINIC, INITIAL_CLINIC);
  },
  saveClinic(clinic: Clinic): void {
    saveToStorage(STORAGE_KEYS.CLINIC, clinic);
  },
  updatePlan(plan: ClinicPlan): Clinic {
    const clinic = this.getClinic();
    clinic.plan = plan;
    clinic.updated_at = new Date().toISOString();
    this.saveClinic(clinic);
    return clinic;
  },

  // Users & Active Role
  getUsers(): User[] {
    return loadFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  getActiveUser(): User {
    const users = this.getUsers();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    const found = users.find((u) => u.id === activeId);
    return found || users[0]; // Dra. Mariana by default
  },
  setActiveUser(userId: string): User {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    return this.getActiveUser();
  },

  // Patients
  getPatients(): Patient[] {
    return loadFromStorage<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  },
  savePatient(patient: Patient): Patient[] {
    const list = this.getPatients();
    const idx = list.findIndex((p) => p.id === patient.id);
    let updated: Patient[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = patient;
    } else {
      updated = [patient, ...list];
    }
    saveToStorage(STORAGE_KEYS.PATIENTS, updated);
    return updated;
  },
  deletePatient(patientId: string): Patient[] {
    const list = this.getPatients();
    const filtered = list.filter((p) => p.id !== patientId);
    saveToStorage(STORAGE_KEYS.PATIENTS, filtered);
    return filtered;
  },

  // Appointments
  getAppointments(): Appointment[] {
    return loadFromStorage<Appointment[]>(
      STORAGE_KEYS.APPOINTMENTS,
      INITIAL_APPOINTMENTS
    );
  },
  saveAppointment(appointment: Appointment): Appointment[] {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === appointment.id);
    let updated: Appointment[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = appointment;
    } else {
      updated = [appointment, ...list];
    }
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },
  updateAppointmentStatus(id: string, status: AppointmentStatus): Appointment[] {
    const list = this.getAppointments();
    const updated = list.map((a) => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    });
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },
  markWhatsAppSent(id: string): Appointment[] {
    const list = this.getAppointments();
    const updated = list.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          whatsapp_sent_at: new Date().toISOString(),
        };
      }
      return a;
    });
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },
  confirmWhatsAppResponse(id: string): Appointment[] {
    const list = this.getAppointments();
    const updated = list.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'confirmed' as AppointmentStatus,
          whatsapp_confirmed_at: new Date().toISOString(),
        };
      }
      return a;
    });
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },

  // Medical Records (PEP)
  getMedicalRecords(): MedicalRecord[] {
    return loadFromStorage<MedicalRecord[]>(
      STORAGE_KEYS.RECORDS,
      INITIAL_MEDICAL_RECORDS
    );
  },
  saveMedicalRecord(record: MedicalRecord, user: User, action: AuditAction): MedicalRecord[] {
    const list = this.getMedicalRecords();
    const idx = list.findIndex((r) => r.id === record.id);
    let updated: MedicalRecord[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = record;
    } else {
      updated = [record, ...list];
    }
    saveToStorage(STORAGE_KEYS.RECORDS, updated);

    // Auto record in Audit Trail (CFM / LGPD Requirement)
    const patients = this.getPatients();
    const patient = patients.find((p) => p.id === record.patient_id);
    this.addAuditLog({
      id: `adt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      record_id: record.id,
      patient_name: patient?.name || 'Paciente Não Identificado',
      user_id: user.id,
      user_name: user.name,
      user_role: `${user.professional_council || 'Colaborador'} ${user.council_number || ''} (${user.role.toUpperCase()})`.trim(),
      action,
      details:
        action === 'SIGNED'
          ? `Registro assinado digitalmente com hash: ${record.signature_hash?.slice(0, 16)}...`
          : action === 'CREATED'
          ? `Criação inicial de prontuário e anamnese clínica.`
          : action === 'EXPORTED'
          ? `Exportação e impressão de receituário/atestado médico.`
          : `Acesso e leitura ao prontuário pelo profissional.`,
      ip_address: '189.102.44.12',
      user_agent: navigator.userAgent || 'Mozilla/5.0 CliniFlow/1.0',
      timestamp: new Date().toISOString(),
    });

    return updated;
  },

  // Audit Trail (CFM / LGPD)
  getAuditTrail(): MedicalAuditTrail[] {
    return loadFromStorage<MedicalAuditTrail[]>(
      STORAGE_KEYS.AUDIT,
      INITIAL_AUDIT_TRAIL
    );
  },
  addAuditLog(log: MedicalAuditTrail): void {
    const list = this.getAuditTrail();
    const updated = [log, ...list];
    saveToStorage(STORAGE_KEYS.AUDIT, updated);
  },

  // Automated WhatsApp Reminder Settings
  getReminderSettings(): ReminderSettings {
    return loadFromStorage<ReminderSettings>(
      STORAGE_KEYS.REMINDERS,
      INITIAL_REMINDER_SETTINGS
    );
  },
  saveReminderSettings(settings: ReminderSettings): ReminderSettings {
    saveToStorage(STORAGE_KEYS.REMINDERS, settings);
    return settings;
  },

  // Document Templates (Atestados, Declarações, Laudos)
  getDocumentTemplates(): DocumentTemplate[] {
    return loadFromStorage<DocumentTemplate[]>(
      STORAGE_KEYS.TEMPLATES,
      INITIAL_DOCUMENT_TEMPLATES
    );
  },
  saveDocumentTemplate(template: DocumentTemplate): DocumentTemplate[] {
    const list = this.getDocumentTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    let updated: DocumentTemplate[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...template, updated_at: new Date().toISOString() };
    } else {
      updated = [
        {
          ...template,
          created_at: template.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...list,
      ];
    }
    saveToStorage(STORAGE_KEYS.TEMPLATES, updated);
    return updated;
  },
  deleteDocumentTemplate(templateId: string): DocumentTemplate[] {
    const list = this.getDocumentTemplates();
    const filtered = list.filter((t) => t.id !== templateId);
    saveToStorage(STORAGE_KEYS.TEMPLATES, filtered);
    return filtered;
  },
  resetDocumentTemplates(): DocumentTemplate[] {
    saveToStorage(STORAGE_KEYS.TEMPLATES, INITIAL_DOCUMENT_TEMPLATES);
    return INITIAL_DOCUMENT_TEMPLATES;
  },

  // Financial Transactions Management
  getFinancialTransactions(): FinancialTransaction[] {
    return loadFromStorage<FinancialTransaction[]>(
      STORAGE_KEYS.TRANSACTIONS,
      INITIAL_FINANCIAL_TRANSACTIONS
    );
  },
  saveFinancialTransactions(txs: FinancialTransaction[]): void {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, txs);
  },
  addFinancialTransaction(tx: FinancialTransaction): FinancialTransaction[] {
    const list = this.getFinancialTransactions();
    const updated = [
      {
        ...tx,
        id: tx.id || `tx-${Date.now()}`,
        created_at: tx.created_at || new Date().toISOString(),
      },
      ...list,
    ];
    this.saveFinancialTransactions(updated);
    return updated;
  },
  updateFinancialTransaction(tx: FinancialTransaction): FinancialTransaction[] {
    const list = this.getFinancialTransactions();
    const idx = list.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = { ...tx, updated_at: new Date().toISOString() };
      this.saveFinancialTransactions(updated);
      return updated;
    }
    return list;
  },
  deleteFinancialTransaction(id: string): FinancialTransaction[] {
    const list = this.getFinancialTransactions();
    const filtered = list.filter((t) => t.id !== id);
    this.saveFinancialTransactions(filtered);
    return filtered;
  },
  resetFinancialTransactions(): FinancialTransaction[] {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_FINANCIAL_TRANSACTIONS);
    return INITIAL_FINANCIAL_TRANSACTIONS;
  },

  // Reset to initial demo data
  resetDemo(): void {
    localStorage.clear();
    window.location.reload();
  },
};
