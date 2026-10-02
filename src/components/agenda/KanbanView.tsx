import React, { useState, useMemo } from 'react';
import {
  Appointment,
  Patient,
  User,
  Clinic,
  AppointmentStatus,
  AppointmentType,
} from '../../types/clinic';
import { formatDateBR, formatTimeBR, formatDateTimeBR } from '../../lib/crypto';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Video,
  FileText,
  MessageSquare,
  Search,
  Filter,
  User as UserIcon,
  Eye,
  ChevronDown,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  XCircle,
  MoveRight,
} from 'lucide-react';

interface KanbanViewProps {
  appointments: Appointment[];
  patients: Patient[];
  users: User[];
  clinic: Clinic;
  currentUser: User;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onOpenPEP: (appointment: Appointment) => void;
  onOpenWhatsApp: (appointment: Appointment) => void;
  onStartTelemedicine: (appointment: Appointment) => void;
  onOpenPatientOverview?: (patient: Patient) => void;
}

interface KanbanColumnConfig {
  id: AppointmentStatus | 'scheduled_or_confirmed';
  statuses: AppointmentStatus[];
  title: string;
  subtitle: string;
  badgeColor: string;
  borderColor: string;
  accentBg: string;
  targetStatus: AppointmentStatus;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  appointments,
  patients,
  users,
  clinic,
  currentUser,
  onUpdateStatus,
  onOpenPEP,
  onOpenWhatsApp,
  onStartTelemedicine,
  onOpenPatientOverview,
}) => {
  // Drag and drop states
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Filters
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    currentUser.role === 'doctor' ? currentUser.id : 'all'
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileColumnFilter, setMobileColumnFilter] = useState<string>('all');

  // Column definitions
  const columns: KanbanColumnConfig[] = [
    {
      id: 'waiting',
      statuses: ['waiting'],
      targetStatus: 'waiting',
      title: 'Sala de Espera (Aguardando)',
      subtitle: 'Pacientes na recepção ou sala virtual',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      borderColor: 'border-amber-300',
      accentBg: 'bg-amber-50/50',
    },
    {
      id: 'in_progress',
      statuses: ['in_progress'],
      targetStatus: 'in_progress',
      title: 'Em Atendimento (Consulta)',
      subtitle: 'Em consulta clínica com o médico',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      borderColor: 'border-emerald-300',
      accentBg: 'bg-emerald-50/50',
    },
    {
      id: 'completed',
      statuses: ['completed'],
      targetStatus: 'completed',
      title: 'Atendimento Concluído',
      subtitle: 'Prontuário preenchido e alta clínica',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
      borderColor: 'border-teal-300',
      accentBg: 'bg-teal-50/50',
    },
    {
      id: 'scheduled_or_confirmed',
      statuses: ['scheduled', 'confirmed'],
      targetStatus: 'confirmed',
      title: 'Agendados & Confirmados',
      subtitle: 'Aguardando chegada do paciente',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
      borderColor: 'border-blue-300',
      accentBg: 'bg-blue-50/50',
    },
    {
      id: 'cancelled',
      statuses: ['cancelled'],
      targetStatus: 'cancelled',
      title: 'Cancelados / Faltas',
      subtitle: 'Desmarcados ou não compareceram',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      borderColor: 'border-slate-300',
      accentBg: 'bg-slate-50/50',
    },
  ];

  // Helper for today's ISO date string
  const todayDateStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Doctor filter
      if (selectedDoctorId !== 'all' && app.professional_id !== selectedDoctorId) {
        return false;
      }

      // Modality filter
      if (filterType !== 'all' && app.appointment_type !== filterType) {
        return false;
      }

      // Date filter
      if (filterDate === 'today') {
        const appDate = app.scheduled_at.slice(0, 10);
        // Note: For demo consistency, if the date starts with 2026-09-30 or current day
        if (appDate !== todayDateStr && !app.scheduled_at.startsWith('2026-09-30')) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patient = patients.find((p) => p.id === app.patient_id);
        const doctor = users.find((u) => u.id === app.professional_id);
        const patientMatch = (patient?.name || '').toLowerCase().includes(q);
        const doctorMatch = (doctor?.name || '').toLowerCase().includes(q);
        const notesMatch = (app.notes || '').toLowerCase().includes(q);
        if (!patientMatch && !doctorMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [
    appointments,
    selectedDoctorId,
    filterType,
    filterDate,
    searchQuery,
    patients,
    users,
    todayDateStr,
  ]);

  // Group appointments by column
  const columnData = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    columns.forEach((col) => {
      map[col.id] = filteredAppointments.filter((app) =>
        col.statuses.includes(app.status)
      );
    });
    return map;
  }, [filteredAppointments, columns]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    // Only reset if leaving current column
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: AppointmentStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (appId) {
      onUpdateStatus(appId, targetStatus);
    }
    setDraggedAppId(null);
    setDragOverColumnId(null);
  };

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Doctor Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Todos os Médicos & Especialistas</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.specialty || u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            >
              <option value="today">Atendimentos de Hoje (30/09)</option>
              <option value="all">Todos os Agendamentos</option>
            </select>
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Video className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Presencial & Telemedicina</option>
              <option value="presential">Somente Presenciais</option>
              <option value="telemedicine">Somente Telemedicina</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por paciente ou médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* DRAG-AND-DROP INSTRUCTION BANNER */}
      <div className="px-4 py-2 bg-teal-50/70 border border-teal-200/60 rounded-xl flex items-center justify-between text-xs text-teal-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Fluxo Dinâmico:</strong> Arraste e solte (Drag & Drop) os cards para movimentar o paciente entre as etapas de atendimento.
          </span>
        </div>
        <div className="text-[11px] text-teal-600 hidden sm:block">
          Total de {filteredAppointments.length} atendimentos no quadro
        </div>
      </div>

      {/* Mobile Column Segment Switcher (< md) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setMobileColumnFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            mobileColumnFilter === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <span>Todos</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              mobileColumnFilter === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {filteredAppointments.length}
          </span>
        </button>

        {columns.map((col) => {
          const count = (columnData[col.id] || []).length;
          const isSelected = mobileColumnFilter === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileColumnFilter(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <span>{col.title.split(' ')[0]}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KANBAN BOARD CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {columns
          .filter(
            (col) =>
              mobileColumnFilter === 'all' || col.id === mobileColumnFilter
          )
          .map((col) => {
            const list = columnData[col.id] || [];
            const isOver = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.targetStatus)}
                className={`flex flex-col rounded-2xl border transition-all min-h-[240px] md:min-h-[500px] ${
                  isOver
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-400 shadow-md'
                    : 'border-slate-200 bg-slate-100/60'
                }`}
              >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 bg-white rounded-t-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    {col.id === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span>{col.title}</span>
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border font-mono ${col.badgeColor}`}
                  >
                    {list.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  {col.subtitle}
                </p>
              </div>

              {/* Column Cards Container */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[72vh]">
                {list.length === 0 ? (
                  <div
                    className={`py-12 px-3 text-center rounded-xl border border-dashed text-xs text-slate-400 transition-colors ${
                      isOver
                        ? 'border-teal-400 bg-teal-50/50 text-teal-700 font-medium'
                        : 'border-slate-300'
                    }`}
                  >
                    {isOver ? 'Solte o card aqui para atualizar' : 'Nenhum paciente nesta etapa'}
                  </div>
                ) : (
                  list.map((app) => {
                    const patient = patients.find((p) => p.id === app.patient_id);
                    const doctor = users.find((u) => u.id === app.professional_id);
                    const isBeingDragged = draggedAppId === app.id;
                    const isTelemedicine = app.appointment_type === 'telemedicine';

                    return (
                      <div
                        key={app.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnd={() => {
                          setDraggedAppId(null);
                          setDragOverColumnId(null);
                        }}
                        className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 group ${
                          isBeingDragged ? 'opacity-40 scale-95 border-teal-400' : ''
                        }`}
                      >
                        {/* Card Top: Time and Modality */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeBR(app.scheduled_at)}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                              isTelemedicine
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isTelemedicine ? (
                              <>
                                <Video className="w-3 h-3 text-indigo-600" />
                                <span>Telemedicina</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>Presencial</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Patient Name with 360° trigger */}
                        <div>
                          {patient ? (
                            <button
                              type="button"
                              onClick={() => onOpenPatientOverview && onOpenPatientOverview(patient)}
                              className="font-bold text-slate-900 text-xs text-left hover:text-teal-700 transition-colors flex items-center gap-1.5 group/name"
                              title="Ver Visão 360° do Paciente"
                            >
                              <span className="group-hover/name:underline">
                                {patient.name}
                              </span>
                              <Eye className="w-3 h-3 text-slate-400 group-hover/name:text-teal-600 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="font-bold text-slate-900 text-xs">
                              Paciente
                            </span>
                          )}

                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {patient?.health_insurance || 'Particular'}
                            {patient?.allergies && (
                              <span className="text-rose-600 font-semibold ml-1.5">
                                • Alergia
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Doctor and Specialty */}
                        <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                          <span className="truncate max-w-[130px] font-medium text-slate-800">
                            Dr(a). {doctor?.name?.split(' ')[1] || doctor?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {doctor?.specialty}
                          </span>
                        </div>

                        {/* Notes snippet if any */}
                        {app.notes && (
                          <div className="text-[10px] text-slate-500 italic truncate bg-slate-50/50 p-1.5 rounded">
                            "{app.notes}"
                          </div>
                        )}

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-1">
                            {/* Open PEP */}
                            {currentUser.role !== 'receptionist' && (
                              <button
                                type="button"
                                onClick={() => onOpenPEP(app)}
                                className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Abrir Prontuário Eletrônico (PEP)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Telemedicine */}
                            {isTelemedicine && (
                              <button
                                type="button"
                                onClick={() => onStartTelemedicine(app)}
                                className="p-1.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Iniciar Sala de Telemedicina"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={() => onOpenWhatsApp(app)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Enviar Lembrete WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Status Changer Dropdown */}
                          <div className="relative group/menu">
                            <select
                              value={app.status}
                              onChange={(e) =>
                                onUpdateStatus(
                                  app.id,
                                  e.target.value as AppointmentStatus
                                )
                              }
                              className="text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                              title="Alterar Status Diretamente"
                            >
                              <option value="scheduled">Agendado</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="waiting">Em Espera</option>
                              <option value="in_progress">Em Atendimento</option>
                              <option value="completed">Concluído</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
