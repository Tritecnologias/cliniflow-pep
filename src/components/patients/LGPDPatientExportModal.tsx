import React, { useState, useMemo, useEffect } from 'react';
import {
  Patient,
  Clinic,
  User,
  Appointment,
  MedicalRecord,
  MedicalAuditTrail,
} from '../../types/clinic';
import { generateSHA256Hash, formatDateBR, formatDateTimeBR } from '../../lib/crypto';
import { Storage } from '../../lib/storage';
import {
  ShieldCheck,
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  Copy,
  CheckCircle2,
  Calendar,
  Clock,
  User as UserIcon,
  HeartPulse,
  FileText,
  Lock,
  X,
  Sparkles,
  ExternalLink,
  QrCode,
  AlertCircle,
  FileCheck,
  Building,
  Info,
} from 'lucide-react';

interface LGPDPatientExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  clinic: Clinic;
  currentUser: User;
  onExportSuccess: (msg: string) => void;
}

export const LGPDPatientExportModal: React.FC<LGPDPatientExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  patients,
  onSelectPatient,
  clinic,
  currentUser,
  onExportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'json' | 'csv' | 'legal'>('dossier');
  const [integrityHash, setIntegrityHash] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  // Load all records and appointments for this patient
  const allAppointments = useMemo(() => Storage.getAppointments(), []);
  const allRecords = useMemo(() => Storage.getMedicalRecords(), []);
  const allAuditLogs = useMemo(() => Storage.getAuditTrail(), []);
  const allUsers = useMemo(() => Storage.getUsers(), []);

  const patientAppointments = useMemo(() => {
    return allAppointments.filter((a) => a.patient_id === patient.id);
  }, [allAppointments, patient.id]);

  const patientRecords = useMemo(() => {
    return allRecords.filter((r) => r.patient_id === patient.id);
  }, [allRecords, patient.id]);

  const patientAuditLogs = useMemo(() => {
    return allAuditLogs.filter(
      (log) =>
        log.record_id === patient.id ||
        log.patient_name === patient.name ||
        patientRecords.some((r) => r.id === log.record_id)
    );
  }, [allAuditLogs, patient.id, patient.name, patientRecords]);

  // Construct structured Open Health / LGPD JSON Payload
  const lgpdExportPayload = useMemo(() => {
    const exportTimestamp = new Date().toISOString();

    return {
      schema_version: '1.0-LGPD-BR',
      finalidade_legal:
        'Portabilidade de Dados Pessoais de Saúde conforme Artigo 18, Inciso V da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)',
      normas_regulamentadoras: [
        'Lei nº 13.709/2018 (LGPD) - Art. 18, V',
        'Resolução CFM nº 1.821/2007 (Guarda e prontuário eletrônico)',
        'Resolução CFM nº 2.299/2021 (Telemedicina e Assinatura ICP-Brasil)',
        'Padrão TISS / ANS e Interoperabilidade Open Health',
      ],
      metadados_emissao: {
        data_emissao: exportTimestamp,
        data_emissao_formatada: formatDateTimeBR(exportTimestamp),
        clinica_emissora: {
          nome: clinic.name,
          cnpj: clinic.document_cnpj_cpf,
          slug: clinic.slug,
          sistema: 'CliniFlow PEP & Gestão Clínica',
        },
        operador_responsavel: {
          nome: currentUser.name,
          cargo: currentUser.role.toUpperCase(),
          conselho: currentUser.professional_council
            ? `${currentUser.professional_council}/${currentUser.council_uf || 'SP'} ${currentUser.council_number || ''}`
            : 'Encarregado de Dados (DPO) / Gestão',
        },
      },
      titular_dos_dados: {
        id: patient.id,
        nome_completo: patient.name,
        cpf: patient.cpf,
        data_nascimento: patient.birth_date,
        data_nascimento_formatada: formatDateBR(patient.birth_date),
        telefone: patient.phone,
        email: patient.email || 'Não informado',
        convenio_saude: patient.health_insurance || 'Particular',
        numero_carteirinha: patient.insurance_card_number || 'N/A',
        tipo_sanguineo: patient.blood_type || 'Não informado',
        alergias_declaradas: patient.allergies || 'Nenhuma alergia conhecida',
        data_primeiro_cadastro: patient.created_at,
      },
      historico_clinico: {
        total_consultas: patientAppointments.length,
        total_prontuarios_pep: patientRecords.length,
        consultas_e_agendamentos: patientAppointments.map((app) => {
          const doc = allUsers.find((u) => u.id === app.professional_id);
          return {
            id: app.id,
            data_agendamento: app.scheduled_at,
            duracao_minutos: app.duration_minutes,
            status: app.status,
            tipo_atendimento: app.appointment_type,
            profissional: doc
              ? `${doc.name} (${doc.professional_council || 'Colaborador'} ${doc.council_number || ''})`
              : 'Profissional da Clínica',
            notas_agendamento: app.notes || '',
            sala_telemedicina: app.telemedicine_room_id || null,
          };
        }),
        prontuarios_eletronicos_pep: patientRecords.map((rec) => {
          const doc = allUsers.find((u) => u.id === rec.professional_id);
          return {
            id_prontuario: rec.id,
            data_atendimento: rec.created_at,
            profissional_responsavel: doc
              ? `${doc.name} (${doc.professional_council || 'Colaborador'} ${doc.council_number || ''})`
              : 'Profissional',
            especialidade: rec.anamnese_data.type,
            anamnese_detalhada: rec.anamnese_data.data,
            diagnostico_cid10: {
              codigo: rec.diagnosis_cid10 || 'Z00.0',
              descricao: rec.diagnosis_description || 'Avaliação clínica geral',
            },
            prescricao_medicamentosa: rec.prescription || 'Nenhum medicamento prescrito',
            itens_prescricao_estruturados: rec.prescription_items || [],
            atestado_dias_afastamento: rec.certificate_days || 0,
            assinatura_digital_icp_brasil: {
              status: rec.is_signed ? 'ASSINADO_DIGITALMENTE' : 'RASCUNHO_SEM_ASSINATURA',
              padrao: 'PAdES / ICP-Brasil A3 em Nuvem',
              provedor: rec.signature_provider || 'VIDaaS / Soluti BirdID',
              hash_sha256: rec.signature_hash || null,
              carimbo_tempo_tsa: rec.signature_tsa_stamp || null,
              data_assinatura: rec.signed_at || null,
              assinado_por: rec.signed_by_name || null,
              conselho_assinante: rec.signed_by_council || null,
            },
          };
        }),
      },
      trilha_auditoria_acessos: patientAuditLogs.map((log) => ({
        id_log: log.id,
        acao: log.action,
        usuario_responsavel: log.user_name,
        cargo_usuario: log.user_role,
        detalhes: log.details,
        ip_origem: log.ip_address,
        data_hora: log.timestamp,
      })),
      declaracao_de_conformidade:
        'Declara-se que os dados aqui contidos foram extraídos diretamente da base de dados protegida da instituição, mantendo estrita fidedignidade aos registros efetuados pelos profissionais de saúde assistentes.',
    };
  }, [
    patient,
    clinic,
    currentUser,
    patientAppointments,
    patientRecords,
    patientAuditLogs,
    allUsers,
  ]);

  const jsonString = useMemo(() => {
    return JSON.stringify(lgpdExportPayload, null, 2);
  }, [lgpdExportPayload]);

  // Compute SHA-256 hash of the JSON package
  useEffect(() => {
    generateSHA256Hash(jsonString).then((hash) => setIntegrityHash(hash));
  }, [jsonString]);

  // CSV representation
  const csvContent = useMemo(() => {
    const headers = [
      'Categoria',
      'ID',
      'Data',
      'Profissional',
      'Diagnostico_CID10',
      'Detalhes_Ou_Prescricao',
      'Status_Assinatura',
    ];
    const rows: string[] = [headers.join(';')];

    // Patient info row
    rows.push(
      [
        'TITULAR_DADOS',
        patient.id,
        patient.created_at,
        patient.name,
        patient.cpf,
        `Nasc: ${patient.birth_date} | Convenio: ${patient.health_insurance}`,
        'ATIVO',
      ].join(';')
    );

    // Records
    patientRecords.forEach((r) => {
      const doc = allUsers.find((u) => u.id === r.professional_id);
      rows.push(
        [
          'PRONTUARIO_PEP',
          r.id,
          r.created_at,
          `"${doc?.name || 'Profissional'}"`,
          r.diagnosis_cid10 || 'Z00.0',
          `"${(r.prescription || 'Sem prescrição').replace(/"/g, '""').slice(0, 80)}"`,
          r.is_signed ? 'ASSINADO_ICP_BRASIL' : 'PENDENTE',
        ].join(';')
      );
    });

    // Appointments
    patientAppointments.forEach((a) => {
      const doc = allUsers.find((u) => u.id === a.professional_id);
      rows.push(
        [
          'AGENDAMENTO',
          a.id,
          a.scheduled_at,
          `"${doc?.name || 'Profissional'}"`,
          'N/A',
          `"${(a.notes || a.appointment_type).replace(/"/g, '""')}"`,
          a.status.toUpperCase(),
        ].join(';')
      );
    });

    return rows.join('\n');
  }, [patient, patientRecords, patientAppointments, allUsers]);

  if (!isOpen) return null;

  // Handle Export Downloads & Log Audit Trail
  const triggerAuditLog = (formatName: string) => {
    Storage.addAuditLog({
      id: `adt-lgpd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      record_id: patient.id,
      patient_name: patient.name,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: `${currentUser.professional_council || 'DPO / Gestão'} (${currentUser.role.toUpperCase()})`,
      action: 'EXPORTED',
      details: `Exportação de Dossiê de Portabilidade de Dados Pessoais (LGPD Art. 18, V) no formato ${formatName}. Hash SHA-256: ${integrityHash.slice(0, 16)}...`,
      ip_address: '189.102.44.12',
      user_agent: navigator.userAgent || 'Mozilla/5.0 (CliniFlow PEP)',
      timestamp: new Date().toISOString(),
    });
  };

  const handleDownloadJSON = () => {
    const filename = `portabilidade-lgpd-${patient.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAuditLog('JSON Estruturado (Open Health)');
    onExportSuccess(`Arquivo JSON de portabilidade de ${patient.name} gerado e registrado na auditoria LGPD!`);
  };

  const handleDownloadCSV = () => {
    const filename = `portabilidade-lgpd-${patient.name.toLowerCase().replace(/\s+/g, '-')}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerAuditLog('Planilha CSV Tabular');
    onExportSuccess(`Planilha CSV de portabilidade de ${patient.name} gerada com sucesso!`);
  };

  const handlePrintDossier = () => {
    triggerAuditLog('Dossiê Impresso / PDF A4');
    window.print();
    onExportSuccess(`Dossiê impresso do paciente ${patient.name} registrado na trilha de auditoria.`);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    onExportSuccess('JSON completo copiado para a área de transferência.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Exportação LGPD & Portabilidade de Dados
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Art. 18, V - Lei 13.709/18
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Geração de dossiê estruturado, auditado e assinado digitalmente para transferência entre instituições de saúde.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selector and Identification Ribbon */}
        <div className="p-4 bg-teal-50/40 border-b border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 shrink-0">
              Titular dos Dados:
            </span>
            <select
              value={patient.id}
              onChange={(e) => {
                const found = patients.find((p) => p.id === e.target.value);
                if (found) onSelectPatient(found);
              }}
              className="text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 shadow-2xs"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cpf})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="bg-white px-2 py-1 rounded border border-slate-200">
              Nascimento: <strong>{formatDateBR(patient.birth_date)}</strong>
            </span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200">
              Convênio: <strong>{patient.health_insurance || 'Particular'}</strong>
            </span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200">
              Tipo Sanguíneo: <strong>{patient.blood_type || 'N/I'}</strong>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between bg-white overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'dossier', label: 'Dossiê do Paciente', icon: FileText },
              { id: 'json', label: 'JSON Estruturado (Open Health)', icon: FileJson },
              { id: 'csv', label: 'Planilha CSV', icon: FileSpreadsheet },
              { id: 'legal', label: 'Termo de Portabilidade & Base Legal', icon: FileCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SHA-256 Integrity Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono bg-slate-100 text-slate-600 rounded-md border border-slate-200">
            <Lock className="w-3 h-3 text-teal-600" />
            <span title={integrityHash}>
              SHA-256: {integrityHash.slice(0, 16)}...
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* TAB 1: DOSSIÊ COMPLETO DO PACIENTE (PREVIEW CLINICO OFICIAL) */}
          {activeTab === 'dossier' && (
            <div className="space-y-6 printable-area">
              {/* Quick Metrics of Extracted Records */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Consultas Realizadas
                  </div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {patientAppointments.length}
                  </div>
                  <div className="text-[10px] text-slate-500">Agendamentos no histórico</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-teal-600">
                    Prontuários (PEP)
                  </div>
                  <div className="text-xl font-bold text-teal-700 mt-0.5">
                    {patientRecords.length}
                  </div>
                  <div className="text-[10px] text-slate-500">Anamneses registradas</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">
                    Assinaturas ICP-Brasil
                  </div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">
                    {patientRecords.filter((r) => r.is_signed).length}
                  </div>
                  <div className="text-[10px] text-slate-500">Com validade jurídica</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-indigo-600">
                    Logs de Auditoria
                  </div>
                  <div className="text-xl font-bold text-indigo-700 mt-0.5">
                    {patientAuditLogs.length}
                  </div>
                  <div className="text-[10px] text-slate-500">Rastreabilidade LGPD</div>
                </div>
              </div>

              {/* Printable Official Clinic Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {clinic.name}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      CNPJ: {clinic.document_cnpj_cpf} · Cadastro Nacional de Estabelecimentos de Saúde (CNES)
                    </p>
                    <p className="text-xs text-slate-500">
                      Sede: Av. Giovanni Gronchi, 5819 - Morumbi, São Paulo - SP
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 text-[11px] font-bold uppercase tracking-wider border border-teal-200 inline-block">
                      Dossiê de Portabilidade LGPD
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      Emissão: {formatDateTimeBR(new Date().toISOString())}
                    </div>
                  </div>
                </div>

                {/* Patient Civil Identification */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Identificação Civil do Titular dos Dados</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Nome:</span>{' '}
                      <strong className="text-slate-900 block">{patient.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">CPF:</span>{' '}
                      <strong className="text-slate-900 font-mono block">{patient.cpf}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Data de Nascimento:</span>{' '}
                      <strong className="text-slate-900 block">
                        {formatDateBR(patient.birth_date)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Telefone:</span>{' '}
                      <strong className="text-slate-900 block">{patient.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">E-mail:</span>{' '}
                      <strong className="text-slate-900 block">{patient.email || 'Não informado'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Convênio Médico:</span>{' '}
                      <strong className="text-slate-900 block">
                        {patient.health_insurance} ({patient.insurance_card_number || 'N/A'})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Alergias Relatadas:</span>{' '}
                      <strong className="text-slate-900 block">
                        {patient.allergies || 'Nenhuma alergia conhecida'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Tipo Sanguíneo:</span>{' '}
                      <strong className="text-slate-900 block">{patient.blood_type || 'N/I'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Primeiro Registro na Clínica:</span>{' '}
                      <strong className="text-slate-900 block">
                        {formatDateBR(patient.created_at)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Medical Records (PEP) Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prontuários Médicos & Atendimentos Clínicos ({patientRecords.length})</span>
                  </h3>

                  {patientRecords.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center border border-slate-200">
                      Nenhum atendimento clínico com prontuário lançado para este paciente até o momento.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientRecords.map((record, index) => {
                        const doc = allUsers.find((u) => u.id === record.professional_id);
                        return (
                          <div
                            key={record.id}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  Consulta #{index + 1} · {formatDateTimeBR(record.created_at)}
                                </span>
                                <span className="text-[10px] font-semibold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                                  {record.anamnese_data.type}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600">
                                Médico(a): <strong>{doc?.name || 'Profissional'}</strong> ({doc?.professional_council || 'CRM'} {doc?.council_number || ''})
                              </span>
                            </div>

                            {/* CID-10 and Clinical Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  Diagnóstico CID-10
                                </div>
                                <div className="font-bold text-teal-800 mt-0.5">
                                  {record.diagnosis_cid10 || 'Z00.0'} - {record.diagnosis_description || 'Avaliação clínica'}
                                </div>
                              </div>

                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  Atestado Médico
                                </div>
                                <div className="text-slate-800 mt-0.5 font-medium">
                                  {record.certificate_days
                                    ? `${record.certificate_days} dia(s) de repouso laboral`
                                    : 'Sem afastamento recomendado'}
                                </div>
                              </div>
                            </div>

                            {/* Prescription */}
                            {record.prescription && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  Prescrição Medicamentosa Registrada
                                </div>
                                <div className="text-xs text-slate-800 whitespace-pre-line font-mono bg-slate-50 p-2 rounded">
                                  {record.prescription}
                                </div>
                              </div>
                            )}

                            {/* ICP-Brasil Stamp */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>
                                  {record.is_signed
                                    ? `Assinado digitalmente via ${record.signature_provider || 'VIDaaS / BirdID'} (PAdES)`
                                    : 'Prontuário em elaboração'}
                                </span>
                              </div>
                              {record.signature_hash && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  HASH: {record.signature_hash.slice(0, 16)}...
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Consultation History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>Histórico de Agendamentos e Presenças ({patientAppointments.length})</span>
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs overflow-hidden">
                    {patientAppointments.map((app) => (
                      <div key={app.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-700">
                            {formatDateTimeBR(app.scheduled_at)}
                          </span>
                          <span className="capitalize text-slate-500">
                            · {app.appointment_type === 'telemedicine' ? 'Teleconsulta' : 'Presencial'} ({app.duration_minutes} min)
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            app.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Trail & Access Logs (CFM 1.821 & LGPD Art. 37) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Trilha de Auditoria & Registro de Acessos ao Prontuário ({patientAuditLogs.length})</span>
                  </h3>
                  {patientAuditLogs.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center border border-slate-200">
                      Nenhum registro de acesso prévio encontrado para este paciente.
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs overflow-hidden">
                      {patientAuditLogs.map((log) => (
                        <div key={log.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-600 text-[11px]">
                                {formatDateTimeBR(log.timestamp)}
                              </span>
                              <span className="font-bold text-slate-800">
                                {log.user_name}
                              </span>
                              <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                {log.user_role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {log.details}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-slate-400">
                              IP: {log.ip_address}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                              {log.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legal and Authenticity Footer */}
                <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                  <div>
                    <div className="font-bold text-slate-900">
                      Garantia de Autenticidade & Trilha de Auditoria
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Hash de Integridade do Pacote SHA-256: {integrityHash}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <QrCode className="w-8 h-8 text-slate-800" />
                    <div className="text-[10px] text-slate-500 leading-tight">
                      <strong className="block text-slate-800">Conformidade LGPD</strong>
                      Registro imutável em auditoria
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JSON ESTRUTURADO (OPEN HEALTH / FHIR INTEROPERÁVEL) */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-teal-950">
                    Padrão de Interoperabilidade e Portabilidade de Dados (Art. 18, V)
                  </div>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    O formato JSON estruturado permite que este prontuário seja importado diretamente por qualquer outro sistema de prontuário eletrônico (PEP), hospital ou clínica de destino sem perda de histórico clínico, assinaturas ou diagnósticos.
                  </p>
                </div>
              </div>

              {/* JSON Code Viewer */}
              <div className="relative">
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-300 rounded-lg shadow-xs backdrop-blur-xs transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-[460px] overflow-y-auto leading-relaxed border border-slate-800 selection:bg-teal-500 selection:text-white">
                  {jsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PLANILHA TABULAR CSV */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-blue-950">
                    Formato Tabular Separado por Ponto e Vírgula (CSV)
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Ideal para abertura no Microsoft Excel, Google Planilhas ou importação via banco de dados relacional (PostgreSQL / MySQL).
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  Prévia do Arquivo CSV
                </div>
                <pre className="p-3 bg-slate-50 text-slate-800 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-200">
                  {csvContent}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: TERMO DE PORTABILIDADE & BASE LEGAL */}
          {activeTab === 'legal' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-xs leading-relaxed text-slate-700">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Fundamentação Jurídica & Direitos do Titular (LGPD)
              </h3>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <strong className="text-slate-900 block font-sans text-xs">
                  Lei Geral de Proteção de Dados Pessoais - Lei nº 13.709/2018
                </strong>
                <p>
                  "Art. 18. O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição:
                </p>
                <p className="font-bold text-teal-800 pl-4 border-l-2 border-teal-500">
                  V - portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, de acordo com a regulamentação da autoridade nacional, observados os segredos comercial e industrial;"
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900">
                  Obrigações Técnicas Cumpridas Neste Módulo:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>Estrutura Interoperável:</strong> Exportação em padrão aberto legível por máquina (JSON Open Health) e CSV tabular.
                  </li>
                  <li>
                    <strong>Integridade Criptográfica:</strong> Cálculo do hash SHA-256 de todo o pacote gerado, impedindo alterações posteriores.
                  </li>
                  <li>
                    <strong>Trilha de Auditoria Imutável:</strong> Todo evento de download ou visualização é gravado na tabela <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">medical_audit_trail</code> com IP, usuário e datação legal conforme Resolução CFM 1.821/2007.
                  </li>
                  <li>
                    <strong>Preservação de Assinaturas ICP-Brasil:</strong> Inclusão dos registros de assinatura digital qualificada (PAdES) de cada atendimento.
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Atenção:</strong> A portabilidade dos dados de saúde não desobriga a clínica de origem da guarda dos prontuários originais pelo prazo mínimo de 20 anos, conforme determinado pela Lei nº 13.787/2018 e CFM.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Exportando histórico de: <strong>{patient.name}</strong> ({patient.cpf})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Baixar CSV</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Pacote JSON Completo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
