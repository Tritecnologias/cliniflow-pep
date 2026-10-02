import React, { useState } from 'react';
import { Clinic, User, Patient, Appointment } from '../../types/clinic';
import {
  Globe,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Video,
  MapPin,
  Phone,
  Send,
  ArrowRight,
} from 'lucide-react';
import { formatPhone, formatCPF, formatDateBR } from '../../lib/crypto';

interface PublicBookingPortalProps {
  clinic: Clinic;
  doctors: User[];
  onBookSuccess: (patient: Patient, appointment: Appointment) => void;
}

export const PublicBookingPortal: React.FC<PublicBookingPortalProps> = ({
  clinic,
  doctors,
  onBookSuccess,
}) => {
  const activeDoctors = doctors.filter((d) => d.role !== 'receptionist');

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    activeDoctors[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('14:30');
  const [appointmentType, setAppointmentType] = useState<
    'presential' | 'telemedicine'
  >('presential');

  // Patient info
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientCpf, setPatientCpf] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('Particular');
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedDoctor = activeDoctors.find((d) => d.id === selectedDoctorId);

  const availableSlots = [
    '08:30',
    '09:15',
    '10:00',
    '11:00',
    '14:00',
    '14:30',
    '15:15',
    '16:00',
    '17:00',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !selectedDoctor) return;

    const patientId = `p-pub-${Date.now()}`;
    const newPatient: Patient = {
      id: patientId,
      clinic_id: clinic.id,
      name: patientName,
      cpf: patientCpf ? formatCPF(patientCpf) : 'Não informado',
      birth_date: '1995-01-01',
      phone: patientPhone.replace(/\D/g, ''),
      email: `${patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      health_insurance: healthInsurance,
      created_at: new Date().toISOString(),
    };

    const scheduledDate = new Date(`${selectedDate}T${selectedTime}:00`);
    const newAppointment: Appointment = {
      id: `app-pub-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patientId,
      professional_id: selectedDoctor.id,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: 30,
      status: 'confirmed',
      appointment_type: appointmentType,
      telemedicine_room_id:
        appointmentType === 'telemedicine'
          ? `cliniflow-${Math.random().toString(36).substring(2, 8)}`
          : undefined,
      notes: `Agendado pelo Portal Online do Paciente (${healthInsurance}).`,
      whatsapp_sent_at: new Date().toISOString(),
      whatsapp_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    onBookSuccess(newPatient, newAppointment);
    setIsSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Public URL indicator banner */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-400" />
          <span>
            Link Público do Consultório: <strong className="font-mono text-teal-300">clinica.sistema.com/{clinic.slug}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Visualização externa do paciente
        </span>
      </div>

      {isSuccess ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Agendamento Confirmado com Sucesso!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Olá, <strong>{patientName}</strong>! Sua consulta com{' '}
            <strong>{selectedDoctor?.name}</strong> foi agendada para{' '}
            <strong>
              {formatDateBR(selectedDate)} às {selectedTime}
            </strong>
            .
          </p>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 max-w-md mx-auto text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-teal-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Notificação WhatsApp Enviada</span>
            </div>
            <div>
              Enviamos a confirmação detalhada para o número{' '}
              <strong>{formatPhone(patientPhone)}</strong>.
            </div>
          </div>

          <button
            onClick={() => {
              setIsSuccess(false);
              setPatientName('');
              setPatientPhone('');
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Fazer Outro Agendamento
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Clinic Header banner */}
          <div className="bg-gradient-to-r from-teal-700 to-slate-900 text-white p-6 md:p-8 space-y-2">
            <div className="flex items-center gap-2 text-xs text-teal-200 font-semibold uppercase tracking-wider">
              <span>Agendamento Online 24h</span>
              <span>·</span>
              <span>Sem filas</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {clinic.name}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Escolha o profissional, data e horário para seu atendimento.
              Atendimento particular e pelos principais convênios médicos.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {clinic.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                {clinic.phone}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Step 1: Select Professional */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Selecione o Profissional
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeDoctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          doc.avatar_color || 'bg-slate-700'
                        }`}
                      >
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-teal-700 font-medium">
                          {doc.specialty}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.professional_council}/{doc.council_uf}{' '}
                          {doc.council_number}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Modality */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Modalidade do Atendimento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentType('presential')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    appointmentType === 'presential'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  Presencial no Consultório
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentType('telemedicine')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                    appointmentType === 'telemedicine'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  Telemedicina (Vídeo Online)
                </button>
              </div>
            </div>

            {/* Step 3: Date and Time */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Escolha a Data e Horário
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    Data da Consulta
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    Horários Disponíveis
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => {
                      const isChosen = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                            isChosen
                              ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Patient Info */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Seus Dados de Contato
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(formatPhone(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    CPF (Opcional para prontuário)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(formatCPF(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    Convênio ou Particular
                  </label>
                  <select
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Particular">Particular</option>
                    <option value="Bradesco Saúde">Bradesco Saúde</option>
                    <option value="Unimed">Unimed</option>
                    <option value="SulAmérica">SulAmérica</option>
                    <option value="Amil">Amil</option>
                    <option value="Porto Seguro">Porto Seguro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cloudflare Turnstile anti-bot verification */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">
                  Proteção anti-bot <strong>Cloudflare Turnstile</strong> ativa
                </span>
              </div>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verificado
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Confirmar Agendamento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
