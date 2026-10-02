import React, { useState, useMemo } from 'react';
import {
  Patient,
  Clinic,
  User,
  Appointment,
  MedicalRecord,
} from '../../types/clinic';
import { Storage } from '../../lib/storage';
import { formatDateBR, formatDateTimeBR } from '../../lib/crypto';
import {
  User as UserIcon,
  Calendar,
  Clock,
  AlertTriangle,
  Pill,
  FileCheck,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Activity,
  X,
  Plus,
  ExternalLink,
  Lock,
  Printer,
  ChevronRight,
  Download,
  Video,
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';

interface PatientOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  clinic: Clinic;
  currentUser: User;
  onOpenPEP?: (patient: Patient) => void;
  onOpenLGPDExport?: (patient: Patient) => void;
  onBookAppointment?: (patient: Patient) => void;
}

export const PatientOverviewModal: React.FC<PatientOverviewModalProps> = ({
  isOpen,
  onClose,
  patient,
  clinic,
  currentUser,
  onOpenPEP,
  onOpenLGPDExport,
  onBookAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'medications' | 'documents'>('overview');

  // Load all appointments, medical records and doctors from Storage
  const allAppointments = useMemo(() => Storage.getAppointments(), []);
  const allRecords = useMemo(() => Storage.getMedicalRecords(), []);
  const allUsers = useMemo(() => Storage.getUsers(), []);

  // Filter patient specific data
  const patientAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => a.patient_id === patient.id)
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
      );
  }, [allAppointments, patient.id]);

  // Separate upcoming vs past appointments
  const now = new Date();
  const upcomingAppointments = useMemo(() => {
    return patientAppointments.filter(
      (a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled'
    );
  }, [patientAppointments, now]);

  const pastAppointments = useMemo(() => {
    return patientAppointments.filter(
      (a) => new Date(a.scheduled_at) < now || a.status === 'completed'
    );
  }, [patientAppointments, now]);

  // Patient medical records
  const patientRecords = useMemo(() => {
    return allRecords
      .filter((r) => r.patient_id === patient.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [allRecords, patient.id]);

  // Signed documents history
  const signedDocuments = useMemo(() => {
    return patientRecords.filter((r) => r.is_signed);
  }, [patientRecords]);

  // Extract active medications from recent records
  const activeMedications = useMemo(() => {
    const list: Array<{
      id: string;
      text: string;
      date: string;
      doctorName: string;
      specialty: string;
    }> = [];

    patientRecords.forEach((rec) => {
      if (rec.prescription && rec.prescription.trim()) {
        const lines = rec.prescription
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('---'));

        const doctor = allUsers.find((u) => u.id === rec.professional_id);

        lines.forEach((line, idx) => {
          list.push({
            id: `${rec.id}-${idx}`,
            text: line,
            date: rec.created_at,
            doctorName: doctor?.name || 'Profissional da Saúde',
            specialty: doctor?.specialty || 'Clínica Geral',
          });
        });
      }
    });

    return list;
  }, [patientRecords, allUsers]);

  // Latest vital signs if medical record
  const latestVitals = useMemo(() => {
    for (const rec of patientRecords) {
      if (rec.anamnese_data && rec.anamnese_data.type === 'medical') {
        const d = rec.anamnese_data.data;
        if (
          d.pressao_arterial_sistolica ||
          d.frequencia_cardiaca ||
          d.peso_kg
        ) {
          return {
            pa: d.pressao_arterial_sistolica && d.pressao_arterial_diastolica
              ? `${d.pressao_arterial_sistolica}/${d.pressao_arterial_diastolica} mmHg`
              : null,
            fc: d.frequencia_cardiaca ? `${d.frequencia_cardiaca} bpm` : null,
            peso: d.peso_kg ? `${d.peso_kg} kg` : null,
            altura: d.altura_cm ? `${d.altura_cm} cm` : null,
            date: rec.created_at,
          };
        }
      }
    }
    return null;
  }, [patientRecords]);

  // Helper for age
  const age = useMemo(() => {
    if (!patient.birth_date) return null;
    const diff = Date.now() - new Date(patient.birth_date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }, [patient.birth_date]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* HEADER: PATIENT SUMMARY & IDENTITY */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-12">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-600/60 border border-teal-400/30 text-white flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                {patient.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {patient.name}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-300/30">
                    {patient.health_insurance || 'Particular'}
                  </span>
                  {patient.blood_type && (
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/30">
                      Tipo {patient.blood_type}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-teal-100/80 font-mono">
                  <span>CPF: {patient.cpf || 'Não informado'}</span>
                  <span>·</span>
                  <span>
                    Nasc: {formatDateBR(patient.birth_date)} {age !== null && `(${age} anos)`}
                  </span>
                  {patient.insurance_card_number && (
                    <>
                      <span>·</span>
                      <span>Cart: {patient.insurance_card_number}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {onOpenPEP && currentUser.role !== 'receptionist' && (
                <button
                  onClick={() => {
                    onOpenPEP(patient);
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Abrir Prontuário</span>
                </button>
              )}

              {onOpenLGPDExport && (
                <button
                  onClick={() => {
                    onOpenLGPDExport(patient);
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Dossiê Portabilidade LGPD"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>Portabilidade LGPD</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Contact Info Strip */}
          <div className="mt-4 pt-3 border-t border-teal-700/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-teal-100">
            {patient.phone && (
              <a
                href={`https://wa.me/55${patient.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-300" />
                <span>{patient.phone}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-400/30 ml-0.5">
                  WhatsApp
                </span>
              </a>
            )}

            {patient.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-300" />
                <span>{patient.email}</span>
              </div>
            )}

            {patient.address && (
              <div className="flex items-center gap-1.5 text-teal-200/80">
                <MapPin className="w-3.5 h-3.5 text-teal-300" />
                <span className="truncate max-w-xs">{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* ALLERGIES & CLINICAL ALERT BANNER */}
        <div
          className={`px-6 py-3 border-b flex items-center justify-between gap-3 text-xs ${
            patient.allergies
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {patient.allergies ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {patient.allergies ? 'Alergias Medicamentosas Registradas:' : 'Alergias Medicamentosas:'}
              </span>{' '}
              <span className="font-medium">
                {patient.allergies || 'Nenhuma alergia relatada pelo paciente até o momento.'}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 shrink-0">
            Cadastrado em {formatDateBR(patient.created_at)}
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-6 pt-2 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão 360° Geral', icon: Activity },
            {
              id: 'appointments',
              label: `Agendamentos (${patientAppointments.length})`,
              icon: Calendar,
            },
            {
              id: 'medications',
              label: `Medicamentos Ativos (${activeMedications.length})`,
              icon: Pill,
            },
            {
              id: 'documents',
              label: `Documentos Assinados (${signedDocuments.length})`,
              icon: FileCheck,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
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

        {/* MODAL CONTENT BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/60">
          {/* TAB 1: VISÃO 360° GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Upcoming appointment summary */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Próxima Consulta</span>
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </div>
                  {upcomingAppointments.length > 0 ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatDateTimeBR(upcomingAppointments[0].scheduled_at)}
                      </div>
                      <div className="text-[11px] text-teal-700 font-medium mt-0.5 capitalize flex items-center gap-1">
                        {upcomingAppointments[0].appointment_type === 'telemedicine' && (
                          <Video className="w-3 h-3" />
                        )}
                        {upcomingAppointments[0].appointment_type === 'telemedicine'
                          ? 'Teleconsulta'
                          : 'Presencial'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-1">
                      Nenhum agendamento futuro
                    </div>
                  )}
                </div>

                {/* Active medications count */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Medicamentos em Uso</span>
                    <Pill className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {activeMedications.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Regimes terapêuticos ativos
                  </div>
                </div>

                {/* Signed records count */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Documentos Assinados</span>
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {signedDocuments.length}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PAdES / ICP-Brasil válidos
                  </div>
                </div>
              </div>

              {/* Vitals Summary Card (if available) */}
              {latestVitals && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span>Últimos Sinais Vitais Aferidos</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateBR(latestVitals.date)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {latestVitals.pa && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          Pressão Arterial
                        </div>
                        <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                          {latestVitals.pa}
                        </div>
                      </div>
                    )}
                    {latestVitals.fc && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          Frequência Cardíaca
                        </div>
                        <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                          {latestVitals.fc}
                        </div>
                      </div>
                    )}
                    {latestVitals.peso && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          Peso Corporal
                        </div>
                        <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                          {latestVitals.peso}
                        </div>
                      </div>
                    )}
                    {latestVitals.altura && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          Estatura / Altura
                        </div>
                        <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                          {latestVitals.altura}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Upcoming Appointment or Quick Booking */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Próximos Agendamentos Confirmados</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                  >
                    Ver todos ({patientAppointments.length})
                  </button>
                </div>

                {upcomingAppointments.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <p>Nenhuma consulta futura agendada para este paciente.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingAppointments.slice(0, 2).map((app) => {
                      const doctor = allUsers.find(
                        (u) => u.id === app.professional_id
                      );
                      return (
                        <div
                          key={app.id}
                          className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{formatDateTimeBR(app.scheduled_at)}</span>
                              <span className="font-normal text-slate-500">
                                · Dr(a). {doctor?.name || 'Profissional'}
                              </span>
                            </div>
                            <div className="text-[11px] text-teal-800 font-medium flex items-center gap-1.5">
                              {app.appointment_type === 'telemedicine' ? (
                                <>
                                  <Video className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Teleconsulta com Link Ativo</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Consulta Presencial no Consultório</span>
                                </>
                              )}
                            </div>
                          </div>

                          <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-bold uppercase text-[10px] rounded-md">
                            {app.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Medications Quick View */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Prescrições & Medicamentos Recentes</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('medications')}
                    className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                  >
                    Ver detalhes ({activeMedications.length})
                  </button>
                </div>

                {activeMedications.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                    Nenhuma prescrição medicamentosa registrada no histórico clínico.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeMedications.slice(0, 4).map((med) => (
                      <div
                        key={med.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900 font-mono">
                          {med.text}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Prescrito por {med.doctorName} em {formatDateBR(med.date)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AGENDAMENTOS E CONSULTAS */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Histórico Completo de Agendamentos ({patientAppointments.length})
                </h3>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  Nenhum agendamento encontrado para este paciente.
                </div>
              ) : (
                <div className="space-y-2">
                  {patientAppointments.map((app) => {
                    const doctor = allUsers.find(
                      (u) => u.id === app.professional_id
                    );
                    const isUpcoming = new Date(app.scheduled_at) >= now;

                    return (
                      <div
                        key={app.id}
                        className={`p-4 bg-white rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isUpcoming
                            ? 'border-teal-200 shadow-2xs'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {formatDateTimeBR(app.scheduled_at)}
                            </span>
                            {isUpcoming && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                                Futura
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 flex items-center gap-2">
                            <span>Dr(a). {doctor?.name} ({doctor?.specialty})</span>
                            <span>·</span>
                            <span className="capitalize">
                              {app.appointment_type === 'telemedicine'
                                ? 'Telemedicina'
                                : 'Presencial'}{' '}
                              ({app.duration_minutes} min)
                            </span>
                          </div>
                          {app.notes && (
                            <div className="text-[11px] text-slate-500 italic">
                              "{app.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                              app.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : app.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDICAMENTOS ATIVOS */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Regimes Medicamentosos & Prescrições Clínicas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Extraído automaticamente das prescrições registradas no PEP
                  </p>
                </div>
              </div>

              {activeMedications.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  Nenhum medicamento ativo registrado nas evoluções clínicas deste paciente.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeMedications.map((med) => (
                    <div
                      key={med.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="font-bold text-slate-900 text-xs font-mono">
                            {med.text}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{med.doctorName} ({med.specialty})</span>
                        <span className="font-mono">{formatDateBR(med.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTOS ASSINADOS (PAdES / ICP-BRASIL) */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Histórico de Documentos Assinados Digitalmente ({signedDocuments.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Documentos autenticados com certificado ICP-Brasil em conformidade com CFM 2.299/2021
                  </p>
                </div>
              </div>

              {signedDocuments.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  Nenhum documento assinado digitalmente registrado para este paciente.
                </div>
              ) : (
                <div className="space-y-3">
                  {signedDocuments.map((doc) => {
                    const doctor = allUsers.find(
                      (u) => u.id === doc.professional_id
                    );

                    return (
                      <div
                        key={doc.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                Prontuário & Prescrição Médica
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>ICP-Brasil Válido</span>
                              </span>
                              {doc.biometric_verified && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 inline-flex items-center gap-1">
                                  <Fingerprint className="w-3 h-3 text-teal-600" />
                                  <span>Biometria WebAuthn FIDO2</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Emitido por Dr(a). {doctor?.name} ({doctor?.professional_council || 'CRM'}/SP {doctor?.council_number || ''})
                            </div>
                          </div>

                          <div className="text-right text-[11px] font-mono text-slate-500">
                            {formatDateTimeBR(doc.signed_at || doc.created_at)}
                          </div>
                        </div>

                        {/* Document details box */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
                          {doc.diagnosis_cid10 && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">CID-10:</span>
                              <span className="font-mono bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200 font-bold">
                                {doc.diagnosis_cid10}
                              </span>
                              <span className="text-slate-600">
                                {doc.diagnosis_description}
                              </span>
                            </div>
                          )}

                          {doc.certificate_days && (
                            <div className="flex items-center gap-2 text-slate-700">
                              <span className="font-bold">Atestado Médico:</span>
                              <span>{doc.certificate_days} dia(s) de repouso laboral concedido(s)</span>
                            </div>
                          )}

                          {doc.prescription && (
                            <div className="space-y-1">
                              <span className="font-bold text-slate-700">Prescrição:</span>
                              <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200 whitespace-pre-line">
                                {doc.prescription}
                              </div>
                            </div>
                          )}

                          {doc.signature_hash && (
                            <div className="pt-1 text-[10px] font-mono text-slate-400 truncate">
                              HASH SHA-256: {doc.signature_hash}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 hidden sm:block">
            {clinic.name} · Visão 360° do Paciente
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
            >
              Fechar
            </button>

            {onOpenPEP && currentUser.role !== 'receptionist' && (
              <button
                onClick={() => {
                  onOpenPEP(patient);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Abrir Prontuário Completo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
