-- CliniFlow PEP - Schema PostgreSQL Multi-Tenant
-- Conformidade: CFM nº 2.299/2021, SBIS/CFM e Lei Geral de Proteção de Dados (LGPD)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Clínicas (Tenants)
CREATE TABLE IF NOT EXISTS clinics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document_cnpj_cpf VARCHAR(30) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    plan VARCHAR(30) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários / Corpo Clínico
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'doctor', 'receptionist')),
    professional_council VARCHAR(20) CHECK (professional_council IN ('CRM', 'CRP', 'CREFITO', 'CRO', 'CRN')),
    council_number VARCHAR(50),
    council_uf VARCHAR(2),
    specialty VARCHAR(150),
    avatar_color VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    health_insurance VARCHAR(100) NOT NULL DEFAULT 'Particular',
    insurance_card_number VARCHAR(100),
    address TEXT,
    blood_type VARCHAR(10),
    allergies TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled')),
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'presential' CHECK (appointment_type IN ('presential', 'telemedicine')),
    telemedicine_room_id VARCHAR(100),
    webrtc_provider VARCHAR(50),
    notes TEXT,
    whatsapp_sent_at TIMESTAMPTZ,
    whatsapp_confirmed_at TIMESTAMPTZ,
    triage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Prontuário Eletrônico do Paciente (PEP)
CREATE TABLE IF NOT EXISTS medical_records (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE SET NULL,
    anamnese_data JSONB NOT NULL,
    diagnosis_cid10 VARCHAR(50),
    diagnosis_description TEXT,
    prescription TEXT,
    prescription_items JSONB,
    certificate_days INT DEFAULT 0,
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signature_hash VARCHAR(255),
    signature_provider VARCHAR(50),
    signature_tsa_stamp TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signed_by_name VARCHAR(255),
    signed_by_council VARCHAR(100),
    biometric_verified BOOLEAN DEFAULT FALSE,
    biometric_auth_type VARCHAR(50),
    biometric_credential_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Trilha de Auditoria (Audit Trail CFM / LGPD - Imutável)
CREATE TABLE IF NOT EXISTS medical_audit_trail (
    id VARCHAR(50) PRIMARY KEY,
    record_id VARCHAR(50) REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_name VARCHAR(255),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATED', 'VIEWED', 'EXPORTED', 'SIGNED')),
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Configurações de Lembretes & WhatsApp
CREATE TABLE IF NOT EXISTS reminder_settings (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    send_working_hours_only BOOLEAN NOT NULL DEFAULT TRUE,
    working_hours_start VARCHAR(10) NOT NULL DEFAULT '08:00',
    working_hours_end VARCHAR(10) NOT NULL DEFAULT '20:00',
    auto_confirm_keyword VARCHAR(10) NOT NULL DEFAULT '1',
    auto_reschedule_keyword VARCHAR(10) NOT NULL DEFAULT '2',
    api_gateway VARCHAR(50) NOT NULL DEFAULT 'meta_cloud',
    notify_reception_on_cancel BOOLEAN NOT NULL DEFAULT TRUE,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 8. Modelos de Documentos Clínicos
CREATE TABLE IF NOT EXISTS document_templates (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('atestado', 'declaracao', 'laudo', 'encaminhamento')),
    council_target VARCHAR(50) NOT NULL DEFAULT 'TODOS',
    description TEXT,
    content TEXT NOT NULL,
    requires_cid BOOLEAN NOT NULL DEFAULT FALSE,
    requires_days BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Transações Financeiras & Faturamento
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(255),
    appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE SET NULL,
    professional_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    professional_name VARCHAR(255),
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('pix', 'convenio', 'particular_cartao', 'particular_dinheiro', 'boleto')),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'glosado', 'estornado')),
    payment_date DATE NOT NULL,
    due_date DATE,
    convenio_name VARCHAR(100),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Catálogo CID-10
CREATE TABLE IF NOT EXISTS cid10_catalog (
    code VARCHAR(20) PRIMARY KEY,
    description TEXT NOT NULL,
    chapter VARCHAR(100) NOT NULL
);

-- Índices de Performance e Busca
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON patients USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_prof ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sched ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_medical_records_clinic ON medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_prof ON medical_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_anamnese ON medical_records USING gin (anamnese_data);

CREATE INDEX IF NOT EXISTS idx_audit_record ON medical_audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON medical_audit_trail(timestamp);

CREATE INDEX IF NOT EXISTS idx_fin_clinic ON financial_transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_fin_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fin_date ON financial_transactions(payment_date);

CREATE INDEX IF NOT EXISTS idx_cid10_code ON cid10_catalog(code);
CREATE INDEX IF NOT EXISTS idx_cid10_desc_trgm ON cid10_catalog USING gin (description gin_trgm_ops);
