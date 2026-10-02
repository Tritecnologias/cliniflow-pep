import React, { useState, useEffect } from 'react';
import {
  MedicalRecord,
  Patient,
  User,
  Clinic,
  SpecialtyAnamnese,
  CID10Item,
  CloudSignatureProvider,
} from '../../types/clinic';
import { COMMON_CID10_LIST } from '../../data/mockData';
import { generateSHA256Hash, formatDateBR, calculateAge } from '../../lib/crypto';
import { Storage } from '../../lib/storage';
import { resolveTemplatePlaceholders } from '../../lib/templateEngine';
import { CloudSignatureModal } from './CloudSignatureModal';
import { CID10Search } from './CID10Search';
import {
  FileText,
  ShieldCheck,
  Lock,
  Printer,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Calendar,
  AlertTriangle,
  Sparkles,
  UserCheck,
  Stethoscope,
  Smile,
  Activity,
  HeartPulse,
  Layers,
  X,
  Copy,
  Fingerprint,
  ClipboardCheck,
} from 'lucide-react';
import { Appointment } from '../../types/clinic';

interface MedicalRecordEditorProps {
  record: MedicalRecord | null;
  patient: Patient;
  professional: User;
  clinic: Clinic;
  currentUser: User;
  appointment?: Appointment;
  onSave: (record: MedicalRecord, action: 'CREATED' | 'SIGNED' | 'EXPORTED') => void;
  onCancel: () => void;
}

export const MedicalRecordEditor: React.FC<MedicalRecordEditorProps> = ({
  record,
  patient,
  professional,
  clinic,
  currentUser,
  appointment,
  onSave,
  onCancel,
}) => {
  // Specialty selection
  const [specialtyType, setSpecialtyType] = useState<
    'medical' | 'psychology' | 'dental' | 'nutrition' | 'physiotherapy'
  >(
    record?.anamnese_data.type ||
      (professional.professional_council === 'CRP'
        ? 'psychology'
        : professional.professional_council === 'CRO'
        ? 'dental'
        : professional.professional_council === 'CRN'
        ? 'nutrition'
        : professional.professional_council === 'CREFITO'
        ? 'physiotherapy'
        : 'medical')
  );

  // Check for pre-consultation triage from appointment or storage
  const activeTriage =
    appointment?.triage ||
    Storage.getAppointments().find(
      (a) =>
        (record?.appointment_id
          ? a.id === record.appointment_id
          : a.patient_id === patient.id) && a.triage
    )?.triage;

  // Medical form state
  const initialMedical =
    record?.anamnese_data.type === 'medical'
      ? record.anamnese_data.data
      : {
          queixa_principal: activeTriage?.chief_complaint || '',
          hda: activeTriage
            ? `Paciente refere ${activeTriage.chief_complaint} com início há ${activeTriage.symptoms_duration}. Sintomas relatados na triagem pré-consulta: ${activeTriage.selected_symptoms.join(', ')}.${activeTriage.red_flags.length > 0 ? ` Sinais de alerta (Red Flags): ${activeTriage.red_flags.join(', ')}.` : ''} Dor na escala EVA: ${activeTriage.pain_scale_eva}/10 (Classificação de Risco Manchester: ${activeTriage.risk_level.toUpperCase()}).${activeTriage.temperature_c ? ` Temp: ${activeTriage.temperature_c}°C.` : ''}${activeTriage.blood_pressure_reported ? ` PA: ${activeTriage.blood_pressure_reported}.` : ''}${activeTriage.patient_notes ? ` Observações do paciente: "${activeTriage.patient_notes}".` : ''}`
            : '',
          antecedentes_pessoais: activeTriage?.known_allergies
            ? `Alergias relatadas: ${activeTriage.known_allergies}`
            : '',
          medicamentos_em_uso: activeTriage?.current_medications || '',
          pressao_arterial_sistolica: activeTriage?.blood_pressure_reported
            ? Number(activeTriage.blood_pressure_reported.split('/')[0]) || 120
            : 120,
          pressao_arterial_diastolica: activeTriage?.blood_pressure_reported
            ? Number(activeTriage.blood_pressure_reported.split('/')[1]) || 80
            : 80,
          frequencia_cardiaca: 72,
          peso_kg: 70,
          altura_cm: 170,
          ausculta_cardiopulmonar:
            'Bulhas normofonéticas em 2 tempos sem sopros. Murmúrios vesiculares preservados sem ruídos adventícios.',
          conduta_clinica: '',
          escala_dor_eva: activeTriage?.pain_scale_eva ?? 0,
          triagem_pre_consulta: activeTriage,
        };

  const initialPsychology =
    record?.anamnese_data.type === 'psychology'
      ? record.anamnese_data.data
      : {
          demanda_inicial: '',
          historico_familiar_relacional: '',
          estado_humor_afeto: '',
          recursos_enfrentamento: '',
          planejamento_terapeutico: '',
        };

  const initialDental =
    record?.anamnese_data.type === 'dental'
      ? record.anamnese_data.data
      : {
          queixa_estetico_funcional: '',
          higiene_bucal: 'boa' as const,
          dentes_afetados: [] as number[],
          procedimento_proposto: '',
          observacoes_odontograma: '',
        };

  const [medicalData, setMedicalData] = useState(initialMedical);
  const [psychologyData, setPsychologyData] = useState(initialPsychology);
  const [dentalData, setDentalData] = useState(initialDental);

  // CID-10 State
  const [cidQuery, setCidQuery] = useState(record?.diagnosis_cid10 || '');
  const [selectedCid, setSelectedCid] = useState<CID10Item | null>(() => {
    if (!record?.diagnosis_cid10) return null;
    return (
      COMMON_CID10_LIST.find((c) => c.code === record.diagnosis_cid10) || {
        code: record.diagnosis_cid10,
        description: record.diagnosis_description || '',
        chapter: 'Outros',
      }
    );
  });

  // Prescription items
  const [prescriptionItems, setPrescriptionItems] = useState(
    record?.prescription_items || [
      {
        medicine: '',
        dosage: '',
        frequency: '',
        duration: '',
      },
    ]
  );
  const [certificateDays, setCertificateDays] = useState<number>(
    record?.certificate_days || 0
  );

  // Signing state
  const isSigned = !!record?.is_signed;
  const isDoctorOrOwner =
    currentUser.role === 'owner' || currentUser.role === 'doctor';
  const isReceptionist = currentUser.role === 'receptionist';

  // Digital Signature Modal
  const [showCloudSignatureModal, setShowCloudSignatureModal] = useState(false);

  // Print view modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Document Templates Modal & Selection
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates] = useState(() => Storage.getDocumentTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() =>
    availableTemplates[0]?.id || ''
  );
  const [isTemplateCopied, setIsTemplateCopied] = useState(false);

  const handleCloudSignatureSuccess = (sigData: {
    signature_hash: string;
    signature_provider: CloudSignatureProvider;
    signature_tsa_stamp: string;
    signed_at: string;
    signed_by_name: string;
    signed_by_council: string;
    biometric_verified?: boolean;
    biometric_auth_type?: string;
    biometric_credential_id?: string;
  }) => {
    setShowCloudSignatureModal(false);

    const formattedPrescription = prescriptionItems
      .filter((i) => i.medicine)
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.medicine} ${i.dosage} - ${i.frequency} por ${
            i.duration
          }`
      )
      .join('\n');

    const signedRecord: MedicalRecord = {
      id: record?.id || `rec-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patient.id,
      professional_id: professional.id,
      appointment_id: record?.appointment_id,
      anamnese_data: buildAnamnesePayload(),
      diagnosis_cid10: selectedCid?.code || cidQuery || undefined,
      diagnosis_description: selectedCid?.description || undefined,
      prescription: formattedPrescription,
      prescription_items: prescriptionItems.filter((i) => i.medicine),
      certificate_days: certificateDays,
      is_signed: true,
      signature_hash: sigData.signature_hash,
      signature_provider: sigData.signature_provider,
      signature_tsa_stamp: sigData.signature_tsa_stamp,
      signed_at: sigData.signed_at,
      signed_by_name: sigData.signed_by_name,
      signed_by_council: sigData.signed_by_council,
      biometric_verified: sigData.biometric_verified,
      biometric_auth_type: sigData.biometric_auth_type,
      biometric_credential_id: sigData.biometric_credential_id,
      created_at: record?.created_at || new Date().toISOString(),
    };

    onSave(signedRecord, 'SIGNED');
  };

  // Calculate IMC
  const imc =
    medicalData.peso_kg && medicalData.altura_cm
      ? (
          medicalData.peso_kg /
          Math.pow(medicalData.altura_cm / 100, 2)
        ).toFixed(1)
      : null;

  // Add prescription item
  const handleAddPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicine: '', dosage: '', frequency: '', duration: '' },
    ]);
  };

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handlePrescriptionItemChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...prescriptionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionItems(updated);
  };

  const buildAnamnesePayload = (): SpecialtyAnamnese => {
    if (specialtyType === 'psychology') {
      return { type: 'psychology', data: psychologyData };
    }
    if (specialtyType === 'dental') {
      return { type: 'dental', data: dentalData };
    }
    return {
      type: 'medical',
      data: {
        ...medicalData,
        triagem_pre_consulta: activeTriage || medicalData.triagem_pre_consulta,
        escala_dor_eva: activeTriage?.pain_scale_eva ?? medicalData.escala_dor_eva,
      },
    };
  };

  const handleSaveDraft = () => {
    const formattedPrescription = prescriptionItems
      .filter((i) => i.medicine)
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.medicine} ${i.dosage} - ${i.frequency} por ${
            i.duration
          }`
      )
      .join('\n');

    const newRecord: MedicalRecord = {
      id: record?.id || `rec-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patient.id,
      professional_id: professional.id,
      appointment_id: record?.appointment_id,
      anamnese_data: buildAnamnesePayload(),
      diagnosis_cid10: selectedCid?.code || cidQuery || undefined,
      diagnosis_description: selectedCid?.description || undefined,
      prescription: formattedPrescription,
      prescription_items: prescriptionItems.filter((i) => i.medicine),
      certificate_days: certificateDays,
      is_signed: record?.is_signed || false,
      signature_hash: record?.signature_hash || undefined,
      signed_at: record?.signed_at || undefined,
      signed_by_name: record?.signed_by_name || undefined,
      signed_by_council: record?.signed_by_council || undefined,
      created_at: record?.created_at || new Date().toISOString(),
    };

    onSave(newRecord, record ? 'CREATED' : 'CREATED');
  };

  // Receptionist Restriction Notice
  if (isReceptionist) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-2xl mx-auto my-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Acesso Restrito ao Prontuário Médico (LGPD & CFM)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          O perfil atual <strong>(Recepcionista / Atendente)</strong> possui
          acesso restrito aos dados clínicos confidenciais conforme Resolução CFM
          nº 1.821/2007 e Lei Geral de Proteção de Dados (LGPD). Alterne para o
          perfil de <strong>Médico</strong> ou <strong>Owner</strong> na barra
          superior para visualizar e editar o PEP.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Voltar para a Agenda
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar with Patient Summary */}
      <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
              Prontuário Eletrônico do Paciente (PEP)
            </span>
            {isSigned && (
              <>
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  <Lock className="w-3 h-3" />
                  Assinado ICP-Brasil (Imutável)
                </span>
                {record?.biometric_verified && (
                  <span className="flex items-center gap-1 text-xs text-teal-300 bg-teal-950/70 px-2 py-0.5 rounded border border-teal-700/60 font-medium">
                    <Fingerprint className="w-3 h-3 text-teal-400" />
                    Biometria WebAuthn FIDO2
                  </span>
                )}
              </>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            {patient.name}
          </h2>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>CPF: {patient.cpf}</span>
            <span>·</span>
            <span>Idade: {calculateAge(patient.birth_date)} anos</span>
            <span>·</span>
            <span>Convênio: {patient.health_insurance}</span>
            {patient.allergies && (
              <>
                <span>·</span>
                <span className="text-rose-400 font-semibold">
                  Alergias: {patient.allergies}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Visualizar / Imprimir</span>
          </button>

          {!isSigned && isDoctorOrOwner && (
            <>
              <button
                onClick={handleSaveDraft}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
              >
                Salvar Rascunho
              </button>
              <button
                onClick={() => setShowCloudSignatureModal(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Assinar Digitalmente (BirdID/VIDaaS)</span>
              </button>
            </>
          )}

          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Specialty Segmented Selector (if not locked by signature) */}
      {!isSigned && (
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-500 mr-1">
            Especialidade da Anamnese (JSONB):
          </span>
          <button
            onClick={() => setSpecialtyType('medical')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              specialtyType === 'medical'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            <span>Medicina Geral / Cardiologia</span>
          </button>
          <button
            onClick={() => setSpecialtyType('psychology')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              specialtyType === 'psychology'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-indigo-600" />
            <span>Psicologia Clínica (CRP)</span>
          </button>
          <button
            onClick={() => setSpecialtyType('dental')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              specialtyType === 'dental'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-emerald-600" />
            <span>Odontologia & Odontograma (CRO)</span>
          </button>
        </div>
      )}

      {/* Signature Banner (if signed) */}
      {isSigned && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <strong>Documento Assinado e Lacrado:</strong> Assinado por{' '}
              {record.signed_by_name} ({record.signed_by_council}) em{' '}
              {record.signed_at ? formatDateBR(record.signed_at) : 'hoje'}.
            </div>
          </div>
          <div className="font-mono text-[11px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
            Hash SHA-256: {record.signature_hash?.slice(0, 16)}...
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-160px)]">
        {/* SECTION 1: DYNAMIC ANAMNESE */}
        {specialtyType === 'medical' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Anamnese Clínica & Exame Físico</span>
            </h3>

            {/* Pre-consultation Triage Synchronized Banner */}
            {activeTriage && (
              <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-950 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-teal-900">
                    <ClipboardCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Triagem Pré-Consulta Recebida (Dados Sincronizados no JSONB)</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      activeTriage.risk_level === 'red'
                        ? 'bg-rose-500 text-white'
                        : activeTriage.risk_level === 'orange'
                        ? 'bg-orange-500 text-white'
                        : activeTriage.risk_level === 'yellow'
                        ? 'bg-amber-400 text-amber-950 font-extrabold'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    Risco Manchester: {activeTriage.risk_level.toUpperCase()} · Dor EVA: {activeTriage.pain_scale_eva}/10
                  </span>
                </div>
                <div className="text-[11px] text-teal-900 leading-relaxed">
                  <strong>Queixa:</strong> {activeTriage.chief_complaint} ({activeTriage.symptoms_duration}) ·{' '}
                  <strong>Sintomas selecionados:</strong> {activeTriage.selected_symptoms.join(', ')}
                  {activeTriage.red_flags.length > 0 && (
                    <span className="text-rose-700 font-bold block mt-1">
                      ⚠️ Sinais de Alerta (Red Flags): {activeTriage.red_flags.join(', ')}
                    </span>
                  )}
                  {activeTriage.temperature_c && (
                    <span className="block mt-0.5 text-slate-700">
                      Temperatura relatada: {activeTriage.temperature_c}°C · PA: {activeTriage.blood_pressure_reported || 'Não informada'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Queixa Principal (QP)
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={medicalData.queixa_principal}
                  onChange={(e) =>
                    setMedicalData({
                      ...medicalData,
                      queixa_principal: e.target.value,
                    })
                  }
                  placeholder="Ex: Cefaleia pulsátil frontal há 4 dias associada a náuseas..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  História da Doença Atual (HDA)
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={medicalData.hda}
                  onChange={(e) =>
                    setMedicalData({ ...medicalData, hda: e.target.value })
                  }
                  placeholder="Evolução cronológica dos sintomas, fatores de melhora ou piora..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Sinais Vitais / Biometria */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sinais Vitais e Antropometria
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    PA Sistólica (mmHg)
                  </label>
                  <input
                    type="number"
                    disabled={isSigned}
                    value={medicalData.pressao_arterial_sistolica || ''}
                    onChange={(e) =>
                      setMedicalData({
                        ...medicalData,
                        pressao_arterial_sistolica: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    PA Diastólica (mmHg)
                  </label>
                  <input
                    type="number"
                    disabled={isSigned}
                    value={medicalData.pressao_arterial_diastolica || ''}
                    onChange={(e) =>
                      setMedicalData({
                        ...medicalData,
                        pressao_arterial_diastolica: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    FC (bpm)
                  </label>
                  <input
                    type="number"
                    disabled={isSigned}
                    value={medicalData.frequencia_cardiaca || ''}
                    onChange={(e) =>
                      setMedicalData({
                        ...medicalData,
                        frequencia_cardiaca: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isSigned}
                    value={medicalData.peso_kg || ''}
                    onChange={(e) =>
                      setMedicalData({
                        ...medicalData,
                        peso_kg: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    disabled={isSigned}
                    value={medicalData.altura_cm || ''}
                    onChange={(e) =>
                      setMedicalData({
                        ...medicalData,
                        altura_cm: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    IMC Calculado
                  </label>
                  <div className="w-full text-xs p-2 bg-teal-50 border border-teal-200 rounded-lg text-center font-mono font-bold text-teal-800">
                    {imc ? `${imc} kg/m²` : '--'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ausculta Cardiopulmonar & Exame dos Aparelhos
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={medicalData.ausculta_cardiopulmonar}
                  onChange={(e) =>
                    setMedicalData({
                      ...medicalData,
                      ausculta_cardiopulmonar: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conduta Clínica & Orientações
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={medicalData.conduta_clinica}
                  onChange={(e) =>
                    setMedicalData({
                      ...medicalData,
                      conduta_clinica: e.target.value,
                    })
                  }
                  placeholder="Orientações de estilo de vida, exames solicitados, plano terapêutico..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Psicologia */}
        {specialtyType === 'psychology' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <HeartPulse className="w-4 h-4 text-indigo-600" />
              <span>Evolução e Anamnese em Psicologia Clínica (CRP)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Demanda Inicial & Queixa Subjetiva
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={psychologyData.demanda_inicial}
                  onChange={(e) =>
                    setPsychologyData({
                      ...psychologyData,
                      demanda_inicial: e.target.value,
                    })
                  }
                  placeholder="Relato do paciente sobre angústias, conflitos, sintomas ansiosos/depressivos..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado de Humor e Afeto
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    value={psychologyData.estado_humor_afeto}
                    onChange={(e) =>
                      setPsychologyData({
                        ...psychologyData,
                        estado_humor_afeto: e.target.value,
                      })
                    }
                    placeholder="Ex: Humor deprimido, afeto modulado, ansiedade situacional..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recursos de Enfrentamento
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    value={psychologyData.recursos_enfrentamento}
                    onChange={(e) =>
                      setPsychologyData({
                        ...psychologyData,
                        recursos_enfrentamento: e.target.value,
                      })
                    }
                    placeholder="Rede de apoio familiar, hobbies, autorregulação..."
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Planejamento Terapêutico e Intervenções da Sessão
                </label>
                <textarea
                  disabled={isSigned}
                  rows={2}
                  value={psychologyData.planejamento_terapeutico}
                  onChange={(e) =>
                    setPsychologyData({
                      ...psychologyData,
                      planejamento_terapeutico: e.target.value,
                    })
                  }
                  placeholder="Técnicas cognitivo-comportamentais aplicadas, tarefas de casa..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Odontologia */}
        {specialtyType === 'dental' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <Smile className="w-4 h-4 text-emerald-600" />
              <span>Odontograma e Avaliação Odontológica (CRO)</span>
            </h3>

            {/* Interactive Odontogram FDI */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Odontograma Interativo (Notação FDI):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Clique nos dentes para marcar procedimentos/cáries
                </span>
              </div>

              {/* Upper Arch */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase text-center">
                  Arcada Superior
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(
                    (tooth) => {
                      const isSelected =
                        dentalData.dentes_afetados.includes(tooth);
                      return (
                        <button
                          key={tooth}
                          type="button"
                          disabled={isSigned}
                          onClick={() => {
                            const updated = isSelected
                              ? dentalData.dentes_afetados.filter(
                                  (t) => t !== tooth
                                )
                              : [...dentalData.dentes_afetados, tooth];
                            setDentalData({
                              ...dentalData,
                              dentes_afetados: updated,
                            });
                          }}
                          className={`w-8 h-10 rounded border text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <span>{tooth}</span>
                          <span className="text-[9px] opacity-75">
                            {isSelected ? '●' : '○'}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase text-center mt-3">
                  Arcada Inferior
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(
                    (tooth) => {
                      const isSelected =
                        dentalData.dentes_afetados.includes(tooth);
                      return (
                        <button
                          key={tooth}
                          type="button"
                          disabled={isSigned}
                          onClick={() => {
                            const updated = isSelected
                              ? dentalData.dentes_afetados.filter(
                                  (t) => t !== tooth
                                )
                              : [...dentalData.dentes_afetados, tooth];
                            setDentalData({
                              ...dentalData,
                              dentes_afetados: updated,
                            });
                          }}
                          className={`w-8 h-10 rounded border text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <span>{tooth}</span>
                          <span className="text-[9px] opacity-75">
                            {isSelected ? '●' : '○'}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {dentalData.dentes_afetados.length > 0 && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 font-medium">
                  Dentes selecionados:{' '}
                  <strong>{dentalData.dentes_afetados.join(', ')}</strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procedimento Proposto
                </label>
                <input
                  type="text"
                  disabled={isSigned}
                  value={dentalData.procedimento_proposto}
                  onChange={(e) =>
                    setDentalData({
                      ...dentalData,
                      procedimento_proposto: e.target.value,
                    })
                  }
                  placeholder="Ex: Restauração em resina composta dente 16 e 26..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Índice de Higiene Bucal
                </label>
                <select
                  disabled={isSigned}
                  value={dentalData.higiene_bucal}
                  onChange={(e) =>
                    setDentalData({
                      ...dentalData,
                      higiene_bucal: e.target.value as any,
                    })
                  }
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                >
                  <option value="otima">Ótima</option>
                  <option value="boa">Boa</option>
                  <option value="regular">Regular</option>
                  <option value="deficiente">Deficiente (presença de placa/tártaro)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CID-10 DIAGNOSIS */}
        <div className="pt-3 border-t border-slate-200">
          <CID10Search
            selectedCid={selectedCid}
            onSelectCid={(cid) => {
              setSelectedCid(cid);
              setCidQuery(cid?.code || '');
            }}
            disabled={isSigned}
            showQuickPicks={true}
          />
        </div>

        {/* SECTION 3: PRESCRIPTION GENERATOR */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Receituário & Prescrição Terapêutica Estruturada</span>
            </h3>

            {!isSigned && (
              <button
                type="button"
                onClick={handleAddPrescriptionItem}
                className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors flex items-center gap-1 border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Medicamento</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {prescriptionItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Medicamento / Fármaco
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    placeholder="Ex: Losartana Potássica"
                    value={item.medicine}
                    onChange={(e) =>
                      handlePrescriptionItemChange(idx, 'medicine', e.target.value)
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Dosagem
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    placeholder="Ex: 50mg"
                    value={item.dosage}
                    onChange={(e) =>
                      handlePrescriptionItemChange(idx, 'dosage', e.target.value)
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Posologia / Frequência
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    placeholder="Ex: 1 comp. pela manhã"
                    value={item.frequency}
                    onChange={(e) =>
                      handlePrescriptionItemChange(idx, 'frequency', e.target.value)
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Duração
                  </label>
                  <input
                    type="text"
                    disabled={isSigned}
                    placeholder="Ex: Uso contínuo"
                    value={item.duration}
                    onChange={(e) =>
                      handlePrescriptionItemChange(idx, 'duration', e.target.value)
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  {!isSigned && prescriptionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePrescriptionItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remover medicamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Medical Certificate & Templates */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Atestados Médicos & Declarações
              </span>
              <div className="text-[11px] text-slate-500">
                Atestado de afastamento ou declarações formatadas com validade legal e carimbo CFM
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="90"
                  disabled={isSigned}
                  value={certificateDays || 0}
                  onChange={(e) => setCertificateDays(Number(e.target.value))}
                  className="w-16 text-xs p-1.5 bg-white border border-slate-200 rounded-md text-center font-mono font-bold"
                />
                <span className="text-slate-600 font-medium">dias</span>
              </div>

              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Modelos de Documentos</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ICP-BRASIL DIGITAL SIGNATURE CONFIRMATION (BIRDID, VIDAAS, CLICKSIGN) */}
      {showCloudSignatureModal && (
        <CloudSignatureModal
          patient={patient}
          currentUser={currentUser}
          contentToSign={{
            patient_cpf: patient.cpf,
            anamnese: buildAnamnesePayload(),
            cid: selectedCid?.code,
            prescription: prescriptionItems,
          }}
          onClose={() => setShowCloudSignatureModal(false)}
          onSignedSuccess={handleCloudSignatureSuccess}
        />
      )}

      {/* MODAL 2: PRINT & EXPORT OFFICIAL PRESCRIPTION */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                <span>Receituário e Documento Clínico Oficial (Padrão A4)</span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>

            {/* Printable Prescription Sheet */}
            <div className="p-8 overflow-y-auto space-y-6 bg-white font-sans text-slate-900">
              {/* Header with Clinic Branding */}
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                    {clinic.name}
                  </h1>
                  <div className="text-xs text-slate-600">{clinic.address}</div>
                  <div className="text-xs text-slate-600">
                    Tel: {clinic.phone} · CNPJ: {clinic.document_cnpj_cpf}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                    Receituário Médico
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Data: {formatDateBR(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Patient Identification */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Paciente:</span>{' '}
                  <strong>{patient.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">CPF:</span>{' '}
                  <strong className="font-mono">{patient.cpf}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Idade:</span>{' '}
                  {calculateAge(patient.birth_date)} anos
                </div>
                <div>
                  <span className="text-slate-500">Convênio:</span>{' '}
                  {patient.health_insurance}
                </div>
              </div>

              {/* Prescribed Medications */}
              <div className="space-y-4 min-h-[140px]">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  Uso Oral / Terapêutica
                </div>
                {prescriptionItems.filter((i) => i.medicine).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum medicamento específico adicionado à prescrição.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {prescriptionItems
                      .filter((i) => i.medicine)
                      .map((item, idx) => (
                        <div key={idx} className="text-xs space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {idx + 1}. {item.medicine} {item.dosage}
                          </div>
                          <div className="text-slate-700 pl-4">
                            Posologia: {item.frequency} — Duração: {item.duration}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Certificate if any */}
                {certificateDays > 0 && (
                  <div className="p-3 rounded-lg border border-slate-300 bg-slate-50/50 text-xs space-y-1">
                    <strong className="block font-bold">ATESTADO MÉDICO:</strong>
                    <p className="text-slate-700">
                      Atesto para os devidos fins que o(a) paciente{' '}
                      <strong>{patient.name}</strong> necessita de{' '}
                      <strong>{certificateDays} dia(s)</strong> de afastamento
                      de suas atividades laborais/escolares a contar desta data por
                      motivo de saúde.
                    </p>
                    {selectedCid && (
                      <p className="text-slate-500 text-[11px]">
                        Diagnóstico CID-10: {selectedCid.code} -{' '}
                        {selectedCid.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer with ICP-Brasil Signature Verification */}
              <div className="pt-6 border-t-2 border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {record?.signed_by_name || currentUser.name}
                  </div>
                  <div className="text-slate-600 font-mono">
                    {record?.signed_by_council ||
                      `${currentUser.professional_council}/${currentUser.council_uf} ${currentUser.council_number}`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Assinado digitalmente conforme MP 2.200-2/2001 e Res. CFM 2.299/2021
                  </div>
                  {record?.biometric_verified && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold pt-0.5">
                      <Fingerprint className="w-3 h-3 text-emerald-600" />
                      <span>Autenticação Biométrica WebAuthn FIDO2 Homologada</span>
                    </div>
                  )}
                </div>

                {/* Verification QR Code Simulator */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-12 h-12 bg-white p-1 rounded border border-slate-300 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-800" />
                  </div>
                  <div className="text-[10px] space-y-0.5 text-slate-500">
                    <div className="font-bold text-teal-800">
                      Validação CFM / ITI
                    </div>
                    <div>validador.iti.gov.br</div>
                    <div className="font-mono text-[9px] text-slate-400">
                      HASH: {(record?.signature_hash || 'SHA256').slice(0, 10)}...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  window.print();
                  if (record) {
                    onSave(record, 'EXPORTED');
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DOCUMENT TEMPLATE ISSUANCE (ATESTADOS & DECLARAÇÕES) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Emissão de Documento por Modelo Pré-formatado</span>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Template selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Selecione o Modelo de Atestado / Declaração
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.category.toUpperCase()} · {t.council_target || 'TODOS'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolved document preview */}
              {(() => {
                const currentTmpl =
                  availableTemplates.find((t) => t.id === selectedTemplateId) ||
                  availableTemplates[0];
                if (!currentTmpl) return null;

                const resolved = resolveTemplatePlaceholders(currentTmpl.content, {
                  patient,
                  professional,
                  clinic,
                  daysAway: certificateDays || 1,
                  cid10: selectedCid?.code || 'I10',
                  cid10Description:
                    selectedCid?.description || 'Hipertensão essencial (primária)',
                });

                return (
                  <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase">
                          {clinic.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {patient.name} · CPF: {patient.cpf}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        {currentTmpl.category}
                      </span>
                    </div>

                    <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans py-2">
                      {resolved}
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[11px] text-slate-500">
                      <div>
                        Assinatura: <strong>{professional.name}</strong> ({professional.professional_council} {professional.council_number})
                      </div>
                      <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ICP-Brasil PAdES Válido
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const currentTmpl =
                    availableTemplates.find((t) => t.id === selectedTemplateId) ||
                    availableTemplates[0];
                  if (!currentTmpl) return;
                  const resolved = resolveTemplatePlaceholders(currentTmpl.content, {
                    patient,
                    professional,
                    clinic,
                    daysAway: certificateDays || 1,
                    cid10: selectedCid?.code || 'I10',
                    cid10Description:
                      selectedCid?.description || 'Hipertensão essencial (primária)',
                  });
                  navigator.clipboard.writeText(resolved);
                  setIsTemplateCopied(true);
                  setTimeout(() => setIsTemplateCopied(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                {isTemplateCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto Formatado</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    if (record) {
                      onSave(record, 'EXPORTED');
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
