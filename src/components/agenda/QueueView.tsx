import React from 'react';
import { Appointment, Patient, User } from '../../types/clinic';
import {
  Clock,
  UserCheck,
  Play,
  CheckCircle,
  BellRing,
  Video,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatTimeBR } from '../../lib/crypto';

interface QueueViewProps {
  appointments: Appointment[];
  patients: Patient[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (id: string, status: any) => void;
  onOpenPEP: (appointment: Appointment) => void;
  onStartTelemedicine?: (appointment: Appointment) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  appointments,
  patients,
  users,
  currentUser,
  onUpdateStatus,
  onOpenPEP,
  onStartTelemedicine,
}) => {
  const [calledAlert, setCalledAlert] = React.useState<string | null>(null);
  const [mobileQueueTab, setMobileQueueTab] = React.useState<'all' | 'waiting' | 'in_progress' | 'completed'>('all');

  // Play audio chime using Web Audio API when calling patient
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleCallPatient = (patientName: string) => {
    playChime();
    setCalledAlert(`🔔 Chamando ${patientName} para o consultório!`);
    setTimeout(() => setCalledAlert(null), 4000);
  };

  // Only today's active appointments
  const waitingList = appointments.filter((a) => a.status === 'waiting');
  const inProgressList = appointments.filter((a) => a.status === 'in_progress');
  const completedList = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title & Callout banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Fila de Espera & Painel de Chamada</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de fluxo de atendimento e triagem do dia em tempo real
          </p>
        </div>

        {calledAlert && (
          <div className="p-2.5 px-4 bg-teal-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 animate-bounce">
            <BellRing className="w-4 h-4" />
            <span>{calledAlert}</span>
          </div>
        )}
      </div>

      {/* Mobile Queue Tab Switcher (< md) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setMobileQueueTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            mobileQueueTab === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <span>Todos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            mobileQueueTab === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {waitingList.length + inProgressList.length + completedList.length}
          </span>
        </button>

        <button
          onClick={() => setMobileQueueTab('waiting')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            mobileQueueTab === 'waiting'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <span>Na Espera</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            mobileQueueTab === 'waiting' ? 'bg-white/25 text-white' : 'bg-amber-50 text-amber-800'
          }`}>
            {waitingList.length}
          </span>
        </button>

        <button
          onClick={() => setMobileQueueTab('in_progress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            mobileQueueTab === 'in_progress'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <span>Atendimento</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            mobileQueueTab === 'in_progress' ? 'bg-white/25 text-white' : 'bg-teal-50 text-teal-800'
          }`}>
            {inProgressList.length}
          </span>
        </button>

        <button
          onClick={() => setMobileQueueTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
            mobileQueueTab === 'completed'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <span>Concluídos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            mobileQueueTab === 'completed' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {completedList.length}
          </span>
        </button>
      </div>

      {/* Grid: 3 columns: Na Espera (Check-in), Em Atendimento, Concluídos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1: Sala de Espera */}
        <div className={`${mobileQueueTab !== 'all' && mobileQueueTab !== 'waiting' ? 'hidden md:flex' : 'flex'} bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex-col`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Aguardando Atendimento
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
              {waitingList.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {waitingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum paciente aguardando no momento.
              </div>
            ) : (
              waitingList.map((app) => {
                const patient = patients.find((p) => p.id === app.patient_id);
                const doctor = users.find((u) => u.id === app.professional_id);
                return (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-teal-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {patient?.name || 'Paciente'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Dr(a). {doctor?.name.split(' ')[1] || 'Médico'} ·{' '}
                          {doctor?.specialty}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formatTimeBR(app.scheduled_at)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
                      <button
                        onClick={() =>
                          handleCallPatient(patient?.name || 'Paciente')
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
                        title="Tocar campainha e chamar no painel"
                      >
                        <BellRing className="w-3 h-3 text-amber-600" />
                        <span>Chamar</span>
                      </button>

                      {currentUser.role !== 'receptionist' && (
                        <button
                          onClick={() => {
                            onUpdateStatus(app.id, 'in_progress');
                            onOpenPEP(app);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Play className="w-3 h-3" />
                          <span>Atender</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Em Atendimento */}
        <div className={`${mobileQueueTab !== 'all' && mobileQueueTab !== 'in_progress' ? 'hidden md:flex' : 'flex'} bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex-col`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">
                Em Atendimento
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-200">
              {inProgressList.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {inProgressList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum atendimento em curso no momento.
              </div>
            ) : (
              inProgressList.map((app) => {
                const patient = patients.find((p) => p.id === app.patient_id);
                const doctor = users.find((u) => u.id === app.professional_id);
                return (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {patient?.name}
                        </div>
                        <div className="text-[11px] text-teal-800 font-medium">
                          Com {doctor?.name}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                        {app.appointment_type === 'telemedicine'
                          ? 'Teleconsulta'
                          : 'Presencial'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between gap-1">
                      {app.appointment_type === 'telemedicine' &&
                        onStartTelemedicine && (
                          <button
                            onClick={() => onStartTelemedicine(app)}
                            className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-md flex items-center gap-1"
                          >
                            <Video className="w-3 h-3" />
                            <span>Abrir Sala</span>
                          </button>
                        )}

                      {currentUser.role !== 'receptionist' && (
                        <button
                          onClick={() => onOpenPEP(app)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-teal-600" />
                          <span>Abrir PEP</span>
                        </button>
                      )}

                      <button
                        onClick={() => onUpdateStatus(app.id, 'completed')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Concluir</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Concluídos */}
        <div className={`${mobileQueueTab !== 'all' && mobileQueueTab !== 'completed' ? 'hidden md:flex' : 'flex'} bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex-col`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">
                Atendimentos Concluídos Hoje
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              {completedList.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {completedList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum atendimento finalizado ainda hoje.
              </div>
            ) : (
              completedList.map((app) => {
                const patient = patients.find((p) => p.id === app.patient_id);
                const doctor = users.find((u) => u.id === app.professional_id);
                return (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {patient?.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {doctor?.name} · {formatTimeBR(app.scheduled_at)}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Finalizado
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
