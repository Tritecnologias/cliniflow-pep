import React, { useState, useEffect } from 'react';
import { Appointment, Patient, User, Clinic } from '../../types/clinic';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { formatTimeBR } from '../../lib/crypto';

interface TelemedicineRoomProps {
  appointment: Appointment;
  patient: Patient;
  professional: User;
  clinic: Clinic;
  currentUser: User;
  onEndCall: () => void;
  onOpenPEP: () => void;
}

export const TelemedicineRoom: React.FC<TelemedicineRoomProps> = ({
  appointment,
  patient,
  professional,
  clinic,
  currentUser,
  onEndCall,
  onOpenPEP,
}) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(140); // 2m20s initial elapsed for realism

  useEffect(() => {
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
      {/* Top Telemedicine Bar */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>Consulta Online: {patient.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400">
              Dr(a). {professional.name} · Sala: {appointment.telemedicine_room_id || 'sala-segura'}
            </div>
          </div>
        </div>

        {/* Call Timer & Encryption badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-md text-xs font-mono font-bold tabular-nums text-slate-200 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{formatCallTime(callSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Criptografia Ponta a Ponta WebRTC</span>
          </div>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden relative">
        {/* Patient Feed (Simulated clean stream) */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center text-3xl font-bold text-slate-300 shadow-inner">
            {patient.name.charAt(0)}
          </div>
          <div className="mt-4 text-center">
            <div className="font-semibold text-sm text-slate-200">
              {patient.name}
            </div>
            <div className="text-xs text-slate-400">
              Conexão estável (HD 1080p · 60fps)
            </div>
          </div>

          {/* Floating tag bottom left */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-medium text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{patient.name} (Paciente)</span>
          </div>
        </div>

        {/* Doctor / Professional Feed */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
          {isVideoOn ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-teal-800/80 border-2 border-teal-500 flex items-center justify-center text-3xl font-bold text-teal-100 shadow-inner">
                {currentUser.name.charAt(0)}
              </div>
              <div className="mt-4 text-center">
                <div className="font-semibold text-sm text-teal-200">
                  {currentUser.name}
                </div>
                <div className="text-xs text-teal-400">
                  {currentUser.professional_council}/{currentUser.council_uf}{' '}
                  {currentUser.council_number}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 space-y-2">
              <VideoOff className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-xs">Sua câmera está desativada</div>
            </div>
          )}

          {/* Floating tag bottom left */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-medium text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Você ({currentUser.role === 'owner' ? 'Owner / Médico' : 'Médico'})</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="h-20 border-t border-slate-800 bg-slate-900 flex items-center justify-center gap-4 px-6">
        <button
          onClick={() => setIsAudioOn(!isAudioOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isAudioOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 text-white'
          }`}
          title={isAudioOn ? 'Mutar microfone' : 'Desmutar microfone'}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-rose-600 text-white'
          }`}
          title={isVideoOn ? 'Desativar câmera' : 'Ativar câmera'}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Open PEP in real time during the call */}
        <button
          onClick={onOpenPEP}
          className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg"
          title="Abrir prontuário eletrônico do paciente para registrar anamnese e receita"
        >
          <FileText className="w-4 h-4" />
          <span>Registrar Prontuário (PEP)</span>
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          title="Encerrar Consulta"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
