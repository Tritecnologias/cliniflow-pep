import React, { useState } from 'react';
import {
  Appointment,
  Patient,
  User,
  Clinic,
  AppointmentStatus,
  AppointmentType,
} from '../../types/clinic';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Video,
  Clock,
  CheckCircle2,
  Check,
  Play,
  FileText,
  UserCheck,
  Phone,
  ChevronRight,
  Sparkles,
  Bell,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatDateBR, formatTimeBR } from '../../lib/crypto';
import { KanbanView } from './KanbanView';
import { PatientOverviewModal } from '../patients/PatientOverviewModal';

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  users: User[];
  clinic: Clinic;
  currentUser: User;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onOpenPEP: (appointment: Appointment) => void;
  onOpenWhatsApp: (appointment: Appointment) => void;
  onStartTelemedicine: (appointment: Appointment) => void;
  onAddAppointment: (appointment: Appointment) => void;
  onOpenReminderSettings?: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  patients,
  users,
  clinic,
  currentUser,
  onUpdateStatus,
  onOpenPEP,
  onOpenWhatsApp,
  onStartTelemedicine,
  onAddAppointment,
  onOpenReminderSettings,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    currentUser.role === 'doctor' ? currentUser.id : 'all'
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedOverviewPatient, setSelectedOverviewPatient] =
    useState<Patient | null>(null);
  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);

  // New appointment form state
  const [newPatientId, setNewPatientId] = useState<string>(patients[0]?.id || '');
  const [newDocId, setNewDocId] = useState<string>(users[0]?.id || '');
  const [newDate, setNewDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState<string>('16:00');
  const [newType, setNewType] = useState<AppointmentType>('presential');
  const [newNotes, setNewNotes] = useState<string>('');

  // Filtered appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesDoctor =
      selectedDoctorId === 'all' || app.professional_id === selectedDoctorId;
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'telemedicine'
        ? app.appointment_type === 'telemedicine'
        : app.status === filterType;

    const patient = patients.find((p) => p.id === app.patient_id);
    const matchesSearch =
      (patient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDoctor && matchesType && matchesSearch;
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newDocId) return;

    const scheduledDate = new Date(`${newDate}T${newTime}:00`);

    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: newPatientId,
      professional_id: newDocId,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: 30,
      status: 'scheduled',
      appointment_type: newType,
      telemedicine_room_id:
        newType === 'telemedicine'
          ? `cliniflow-${Math.random().toString(36).substring(2, 8)}`
          : undefined,
      notes: newNotes,
      created_at: new Date().toISOString(),
    };

    onAddAppointment(newApp);
    setShowNewAppModal(false);
    setNewNotes('');
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confirmado</span>
          </span>
        );
      case 'waiting':
        return (
          <span className="text-amber-700 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Na Sala de Espera</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-teal-700 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Em Atendimento</span>
          </span>
        );
      case 'completed':
        return (
          <span className="text-slate-500 font-medium text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Concluído</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-rose-600 font-medium text-xs">Cancelado</span>
        );
      default:
        return (
          <span className="text-slate-600 font-medium text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Agendado</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Action bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            <span>Agenda Médica Multidisciplinar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão integrada de horários, confirmações WhatsApp e teleconsultas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Kanban vs Lista */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
              <span>Quadro Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-slate-500" />
              <span>Lista</span>
            </button>
          </div>

          {onOpenReminderSettings && (
            <button
              onClick={onOpenReminderSettings}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Configurar antecedência de disparo (minutos/horas/dias)"
            >
              <Bell className="w-3.5 h-3.5 text-teal-600" />
              <span>Configurar Lembretes (24h/2h)</span>
            </button>
          )}

          <button
            onClick={() => setShowNewAppModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* View Content: Kanban vs List */}
      {viewMode === 'kanban' ? (
        <KanbanView
          appointments={appointments}
          patients={patients}
          users={users}
          clinic={clinic}
          currentUser={currentUser}
          onUpdateStatus={onUpdateStatus}
          onOpenPEP={onOpenPEP}
          onOpenWhatsApp={onOpenWhatsApp}
          onStartTelemedicine={onStartTelemedicine}
          onOpenPatientOverview={(p) => {
            setSelectedOverviewPatient(p);
            setShowOverviewModal(true);
          }}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente ou anotação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Doctor and Type Segmented controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Doctor filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Todos os Profissionais</option>
            {users
              .filter((u) => u.role !== 'receptionist')
              .map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty || doc.role})
                </option>
              ))}
          </select>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'waiting', label: 'Na Espera' },
              { id: 'confirmed', label: 'Confirmados' },
              { id: 'telemedicine', label: 'Telemedicina' },
              { id: 'completed', label: 'Concluídos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const patient = patients.find((p) => p.id === app.patient_id);
                  const doctor = users.find((u) => u.id === app.professional_id);

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Horário */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          {formatTimeBR(app.scheduled_at)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateBR(app.scheduled_at)} · {app.duration_minutes}m
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {patient?.name || 'Paciente Não Encontrado'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{patient?.health_insurance}</span>
                          <span>·</span>
                          <span className="font-mono">{patient?.phone}</span>
                        </div>
                      </td>

                      {/* Profissional */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {doctor?.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {doctor?.specialty}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {app.appointment_type === 'telemedicine' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Video className="w-3 h-3 text-indigo-600" />
                            Telemedicina
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">
                            Presencial
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* WhatsApp trigger */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onOpenWhatsApp(app)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                            app.whatsapp_confirmed_at
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : app.whatsapp_sent_at
                              ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Abrir visualizador do WhatsApp e status de confirmação"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>
                            {app.whatsapp_confirmed_at
                              ? 'Confirmado (WPP)'
                              : app.whatsapp_sent_at
                              ? 'Enviado'
                              : 'Disparar'}
                          </span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If presencial & scheduled, allow Check-in */}
                          {app.status === 'scheduled' ||
                          app.status === 'confirmed' ? (
                            <button
                              onClick={() => onUpdateStatus(app.id, 'waiting')}
                              className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                              title="Marcar chegada do paciente na recepção"
                            >
                              Check-in
                            </button>
                          ) : null}

                          {/* Telemedicine join */}
                          {app.appointment_type === 'telemedicine' && (
                            <button
                              onClick={() => onStartTelemedicine(app)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                              title="Iniciar sala de teleconsulta"
                            >
                              <Video className="w-3 h-3" />
                              <span>Sala</span>
                            </button>
                          )}

                          {/* Open PEP (for doctors/owner) */}
                          {currentUser.role !== 'receptionist' && (
                            <button
                              onClick={() => onOpenPEP(app)}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-teal-600" />
                              <span>PEP</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
    )}

      {/* NEW APPOINTMENT MODAL */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600" />
                <span>Novo Agendamento Clínico</span>
              </h3>
              <button
                onClick={() => setShowNewAppModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Paciente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Paciente
                </label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · CPF: {p.cpf} ({p.health_insurance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Profissional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profissional de Saúde
                </label>
                <select
                  value={newDocId}
                  onChange={(e) => setNewDocId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {users
                    .filter((u) => u.role !== 'receptionist')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.specialty} ({u.professional_council}/
                        {u.council_uf})
                      </option>
                    ))}
                </select>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Modalidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modalidade do Atendimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('presential')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      newType === 'presential'
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Presencial no Consultório
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('telemedicine')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                      newType === 'telemedicine'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Telemedicina (Vídeo)
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Motivo da Consulta (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Primeira consulta cardiológica, traz exames..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT 360° OVERVIEW MODAL */}
      {showOverviewModal && selectedOverviewPatient && (
        <PatientOverviewModal
          isOpen={showOverviewModal}
          onClose={() => setShowOverviewModal(false)}
          patient={selectedOverviewPatient}
          clinic={clinic}
          currentUser={currentUser}
          onOpenPEP={(p) => {
            setShowOverviewModal(false);
            const foundApp = appointments.find((a) => a.patient_id === p.id);
            if (foundApp) {
              onOpenPEP(foundApp);
            }
          }}
        />
      )}
    </div>
  );
};
