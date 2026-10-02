import React from 'react';
import { Appointment, Patient, User, Clinic } from '../../types/clinic';
import {
  MessageSquare,
  Check,
  CheckCheck,
  Send,
  ExternalLink,
  Copy,
  X,
  Phone,
  Video,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDateBR, formatTimeBR } from '../../lib/crypto';

interface WhatsAppPreviewModalProps {
  appointment: Appointment | null;
  patient: Patient | null;
  professional: User | null;
  clinic: Clinic;
  onClose: () => void;
  onSimulateConfirmation: (appointmentId: string) => void;
  onMarkSent: (appointmentId: string) => void;
  onOpenSettings?: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  appointment,
  patient,
  professional,
  clinic,
  onClose,
  onSimulateConfirmation,
  onMarkSent,
  onOpenSettings,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [customNote, setCustomNote] = React.useState('');

  if (!appointment || !patient || !professional) return null;

  const appDate = formatDateBR(appointment.scheduled_at);
  const appTime = formatTimeBR(appointment.scheduled_at);

  const messageText = `Olá, *${patient.name.split(' ')[0]}*! Aqui é da *${clinic.name}*.\n\n` +
    `Lembramos da sua consulta marcada para:\n` +
    `📅 *Data:* ${appDate} às ${appTime}\n` +
    `👨‍⚕️ *Profissional:* ${professional.name} (${professional.specialty || 'Especialista'})\n` +
    (appointment.appointment_type === 'telemedicine'
      ? `💻 *Modalidade:* Telemedicina (Consulta Online via Vídeo)\n🔗 *Link da Sala:* https://cliniflow.app/tele/${appointment.telemedicine_room_id || 'sala-online'}\n\n`
      : `📍 *Local:* ${clinic.address}\n\n`) +
    (customNote ? `📝 *Observação:* ${customNote}\n\n` : '') +
    `Por favor, responda com:\n` +
    `*1* - Para CONFIRMAR sua presença\n` +
    `*2* - Para REAGENDAR ou CANCELAR\n\n` +
    `Atenciosamente,\nEquipe ${clinic.name}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = patient.phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleOpenWhatsApp = () => {
    onMarkSent(appointment.id);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmSimulation = () => {
    onSimulateConfirmation(appointment.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Disparo Nativo WhatsApp-First
              </h3>
              <div className="text-xs text-slate-500">
                Lembrete automático para {patient.name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Smartphone Preview */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Simulated WhatsApp Frame */}
          <div className="rounded-xl border border-slate-200 bg-[#E5DDD5] overflow-hidden shadow-inner flex flex-col">
            {/* Top Bar WhatsApp Chat */}
            <div className="bg-[#075E54] text-white px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {clinic.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold leading-tight">{clinic.name}</div>
                  <div className="text-[10px] text-emerald-200">WhatsApp Comercial Oficial</div>
                </div>
              </div>
              <div className="text-[10px] text-emerald-100 flex items-center gap-1">
                <span>online</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3.5 space-y-2 text-xs">
              {/* Outgoing clinic message */}
              <div className="bg-[#DCF8C6] text-slate-800 rounded-lg p-3 max-w-[90%] ml-auto shadow-xs space-y-1.5 whitespace-pre-wrap leading-relaxed border border-emerald-100">
                <div>{messageText}</div>
                <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1 mt-1">
                  <span>{formatTimeBR(new Date().toISOString())}</span>
                  {appointment.whatsapp_sent_at ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Incoming simulated patient response if confirmed */}
              {appointment.status === 'confirmed' && (
                <div className="bg-white text-slate-800 rounded-lg p-2.5 max-w-[70%] mr-auto shadow-xs border border-slate-200 animate-in fade-in slide-in-from-left-2">
                  <div className="font-semibold text-teal-800 text-[11px] mb-0.5">
                    {patient.name.split(' ')[0]}
                  </div>
                  <div>1 - Confirmo minha presença! Obrigado pelo aviso.</div>
                  <div className="text-[10px] text-slate-400 text-right mt-1">
                    {appointment.whatsapp_confirmed_at
                      ? formatTimeBR(appointment.whatsapp_confirmed_at)
                      : 'Agora'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Note Add */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação personalizada (opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Trazer exames anteriores de sangue e chegar com 15 min de antecedência."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Quick Status Pill & Antecedência Alert */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Status atual na Agenda:
              </span>
              <span className="font-semibold capitalize text-slate-800">
                {appointment.status === 'confirmed'
                  ? 'Confirmado pelo Paciente'
                  : appointment.status === 'waiting'
                  ? 'Na Sala de Espera'
                  : appointment.status === 'in_progress'
                  ? 'Em Atendimento'
                  : 'Agendado (Aguardando Resposta)'}
              </span>
            </div>

            {onOpenSettings && (
              <div className="flex items-center justify-between text-[11px] px-3 py-2 bg-teal-50/60 rounded-lg border border-teal-200/80 text-teal-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Régua Ativa: <strong>24h antes</strong> e <strong>2h antes</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  Alterar Horários
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            {appointment.status !== 'confirmed' && (
              <button
                onClick={handleConfirmSimulation}
                className="px-3 py-2 text-xs font-medium text-teal-800 bg-teal-100/80 hover:bg-teal-200/80 rounded-lg transition-colors flex items-center gap-1.5"
                title="Simula a resposta instantânea '1' do paciente via webhook da API de WhatsApp"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Simular Resposta '1 - Confirmo'</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Disparar via WhatsApp Web/App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
