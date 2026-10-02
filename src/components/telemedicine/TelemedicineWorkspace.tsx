import React, { useState, useEffect, useRef } from 'react';
import {
  Appointment,
  Patient,
  User,
  Clinic,
  MedicalRecord,
  WebRTCProvider,
  SpecialtyAnamnese,
  CID10Item,
} from '../../types/clinic';
import { COMMON_CID10_LIST } from '../../data/mockData';
import { CloudSignatureModal } from '../pep/CloudSignatureModal';
import { CID10Search } from '../pep/CID10Search';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Search,
  Plus,
  Trash2,
  Printer,
  Share2,
  MessageSquare,
  Lock,
  ChevronDown,
  Volume2,
  Activity,
  Send,
  Stethoscope,
  Smile,
  HeartPulse,
} from 'lucide-react';
import { formatDateBR, formatTimeBR, calculateAge } from '../../lib/crypto';

interface TelemedicineWorkspaceProps {
  appointment: Appointment;
  patient: Patient;
  professional: User;
  clinic: Clinic;
  currentUser: User;
  existingRecord: MedicalRecord | null;
  onEndCall: (updatedRecord?: MedicalRecord) => void;
  onSaveRecord: (
    record: MedicalRecord,
    action: 'CREATED' | 'SIGNED' | 'EXPORTED'
  ) => void;
}

export const TelemedicineWorkspace: React.FC<TelemedicineWorkspaceProps> = ({
  appointment,
  patient,
  professional,
  clinic,
  currentUser,
  existingRecord,
  onEndCall,
  onSaveRecord,
}) => {
  // WebRTC Provider
  const [webrtcProvider, setWebrtcProvider] =
    useState<WebRTCProvider>('livekit');
  const [callDuration, setCallDuration] = useState(185); // 3m05s initial elapsed
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'pep' | 'chat'>('pep');
  const [splitRatio, setSplitRatio] = useState<'half' | 'wide_video' | 'wide_pep'>('half');

  // Real webcam preview ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  // Chat during consultation
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: patient.name,
      text: 'Olá Doutor(a), estou conectado e ouvindo bem!',
      time: '10:02',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Embedded PEP Form State
  const [specialtyType, setSpecialtyType] = useState<
    'medical' | 'psychology' | 'dental'
  >(
    (existingRecord?.anamnese_data.type as any) ||
      (currentUser.professional_council === 'CRP'
        ? 'psychology'
        : currentUser.professional_council === 'CRO'
        ? 'dental'
        : 'medical')
  );

  const [queixa, setQueixa] = useState(
    existingRecord?.anamnese_data.type === 'medical'
      ? existingRecord.anamnese_data.data.queixa_principal
      : 'Cefaleia com aura e náuseas pós-esforço há 3 dias.'
  );

  const [hda, setHda] = useState(
    existingRecord?.anamnese_data.type === 'medical'
      ? existingRecord.anamnese_data.data.hda
      : 'Paciente relata dor pulsátil hemicraniana esquerda, fotofobia e intolerância a ruídos. Nega febre ou rigidez de nuca.'
  );

  const [conduta, setConduta] = useState(
    existingRecord?.anamnese_data.type === 'medical'
      ? existingRecord.anamnese_data.data.conduta_clinica
      : 'Prescrito profilaxia e analgésico de resgate. Solicitado diário de cefaleia por 30 dias.'
  );

  // CID-10 state
  const [cidCode, setCidCode] = useState(
    existingRecord?.diagnosis_cid10 || 'G43.9'
  );
  const [cidDesc, setCidDesc] = useState(
    existingRecord?.diagnosis_description || 'Enxaqueca, não especificada'
  );
  const [showCidSearch, setShowCidSearch] = useState(false);

  // Prescriptions
  const [prescriptionItems, setPrescriptionItems] = useState(
    existingRecord?.prescription_items || [
      {
        medicine: 'Sumatriptano',
        dosage: '50mg',
        frequency: '1 comp no início da crise',
        duration: 'Máximo 2x ao dia',
      },
      {
        medicine: 'Dipirona Monoidratada',
        dosage: '1g',
        frequency: '1 comprimido de 6/6h se dor',
        duration: '5 dias se necessário',
      },
    ]
  );
  const [certificateDays, setCertificateDays] = useState(
    existingRecord?.certificate_days || 1
  );

  // Signature state
  const [isRecordSigned, setIsRecordSigned] = useState(
    existingRecord?.is_signed || false
  );
  const [showCloudSignatureModal, setShowCloudSignatureModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(
    existingRecord
  );

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Try real webcam feed safely
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
          }
        }
      } catch (err) {
        // Fallback silently to simulated video stream
        setHasCameraPermission(false);
      }
    }
    if (isVideoOn) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        sender: currentUser.name,
        text: chatInput,
        time: formatTimeBR(new Date().toISOString()),
      },
    ]);
    setChatInput('');
  };

  const handleAddMed = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medicine: '', dosage: '', frequency: '', duration: '' },
    ]);
  };

  const handleSaveDraftPEP = () => {
    const rec: MedicalRecord = {
      id: currentRecord?.id || `rec-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patient.id,
      professional_id: professional.id,
      appointment_id: appointment.id,
      anamnese_data: {
        type: 'medical',
        data: {
          queixa_principal: queixa,
          hda,
          antecedentes_pessoais: 'Nega outras comorbidades prévias.',
          medicamentos_em_uso: 'Nenhum de uso crônico.',
          conduta_clinica: conduta,
        },
      },
      diagnosis_cid10: cidCode,
      diagnosis_description: cidDesc,
      prescription: prescriptionItems
        .filter((i) => i.medicine)
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.medicine} ${i.dosage} - ${i.frequency} por ${
              i.duration
            }`
        )
        .join('\n'),
      prescription_items: prescriptionItems,
      certificate_days: certificateDays,
      is_signed: isRecordSigned,
      signature_hash: currentRecord?.signature_hash,
      signature_provider: currentRecord?.signature_provider,
      signature_tsa_stamp: currentRecord?.signature_tsa_stamp,
      signed_at: currentRecord?.signed_at,
      signed_by_name: currentRecord?.signed_by_name,
      signed_by_council: currentRecord?.signed_by_council,
      created_at: currentRecord?.created_at || new Date().toISOString(),
    };

    setCurrentRecord(rec);
    onSaveRecord(rec, 'CREATED');
  };

  const handleSignatureSuccess = (sigResult: any) => {
    setShowCloudSignatureModal(false);
    setIsRecordSigned(true);

    const signedRec: MedicalRecord = {
      id: currentRecord?.id || `rec-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patient.id,
      professional_id: professional.id,
      appointment_id: appointment.id,
      anamnese_data: {
        type: 'medical',
        data: {
          queixa_principal: queixa,
          hda,
          antecedentes_pessoais: 'Nega comorbidades.',
          medicamentos_em_uso: 'Nenhum.',
          conduta_clinica: conduta,
        },
      },
      diagnosis_cid10: cidCode,
      diagnosis_description: cidDesc,
      prescription: prescriptionItems
        .filter((i) => i.medicine)
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.medicine} ${i.dosage} - ${i.frequency} por ${
              i.duration
            }`
        )
        .join('\n'),
      prescription_items: prescriptionItems,
      certificate_days: certificateDays,
      is_signed: true,
      signature_hash: sigResult.signature_hash,
      signature_provider: sigResult.signature_provider,
      signature_tsa_stamp: sigResult.signature_tsa_stamp,
      signed_at: sigResult.signed_at,
      signed_by_name: sigResult.signed_by_name,
      signed_by_council: sigResult.signed_by_council,
      created_at: currentRecord?.created_at || new Date().toISOString(),
    };

    setCurrentRecord(signedRec);
    onSaveRecord(signedRec, 'SIGNED');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2 text-white">
              <span>Telemedicina Integrada · {patient.name}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AO VIVO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Sala: {appointment.telemedicine_room_id || 'sala-webrtc'} ·{' '}
              {clinic.name}
            </div>
          </div>
        </div>

        {/* Center: WebRTC Provider & Stats */}
        <div className="flex items-center gap-3">
          {/* Provider selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px]">Motor WebRTC:</span>
            <select
              value={webrtcProvider}
              onChange={(e) =>
                setWebrtcProvider(e.target.value as WebRTCProvider)
              }
              className="bg-transparent text-teal-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="livekit" className="bg-slate-900 text-white">
                LiveKit Cloud (SFU)
              </option>
              <option value="daily" className="bg-slate-900 text-white">
                Daily.co WebRTC
              </option>
              <option value="twilio" className="bg-slate-900 text-white">
                Twilio Video Rooms
              </option>
            </select>
          </div>

          {/* Latency & Encryption */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>18ms · 1080p</span>
          </div>

          {/* Call timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-100 rounded-lg text-xs font-mono font-bold border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{formatTimer(callDuration)}</span>
          </div>
        </div>

        {/* Right: End Consultation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEndCall(currentRecord || undefined)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Encerrar Consulta</span>
          </button>
        </div>
      </header>

      {/* Main Split-Screen Consultation Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: LIVE WEBRTC VIDEO FEEDS & CONTROLS */}
        <div
          className={`flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 p-4 transition-all ${
            splitRatio === 'half'
              ? 'lg:w-1/2'
              : splitRatio === 'wide_video'
              ? 'lg:w-3/5'
              : 'lg:w-2/5'
          }`}
        >
          {/* Video Frames Container */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[260px] lg:min-h-0 relative">
            {/* Patient Remote Video */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-lg">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-teal-950 border-2 border-slate-600 flex items-center justify-center text-3xl font-bold text-teal-100 shadow-inner">
                {patient.name.charAt(0)}
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-xs text-slate-200">
                  {patient.name}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>Áudio Ativo (WebRTC)</span>
                </div>
              </div>

              {/* Tag bottom */}
              <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{patient.name.split(' ')[0]} (Paciente)</span>
              </div>
            </div>

            {/* Doctor Local Video Feed (Real Webcam or Avatar) */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-lg">
              {isVideoOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform scale-x-[-1] ${
                      hasCameraPermission ? 'block' : 'hidden'
                    }`}
                  />
                  {!hasCameraPermission && (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 rounded-full bg-teal-900/90 border-2 border-teal-500 flex items-center justify-center text-3xl font-bold text-teal-100 shadow-inner">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="mt-3 text-center">
                        <div className="font-semibold text-xs text-teal-200">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-teal-400">
                          {currentUser.professional_council}/{currentUser.council_uf}{' '}
                          {currentUser.council_number}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <VideoOff className="w-8 h-8 mx-auto text-slate-600" />
                  <div className="text-xs">Câmera desativada</div>
                </div>
              )}

              {/* Tag bottom */}
              <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-medium text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Você ({currentUser.name.split(' ')[0]})</span>
              </div>
            </div>
          </div>

          {/* Patient Quick Context Card */}
          <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Idade:</span>
              <strong className="text-slate-200">
                {calculateAge(patient.birth_date)} anos
              </strong>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Convênio:</span>
              <strong className="text-slate-200">
                {patient.health_insurance}
              </strong>
            </div>
            {patient.allergies && (
              <div className="text-[11px] text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900">
                Alergias: {patient.allergies}
              </div>
            )}
          </div>

          {/* WebRTC In-Call Controls Bar */}
          <div className="mt-3 py-2 px-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={`p-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isAudioOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-rose-600 text-white'
                }`}
                title={isAudioOn ? 'Mutar Microfone' : 'Desmutar Microfone'}
              >
                {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isAudioOn ? 'Mudo' : 'Mutado'}
                </span>
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isVideoOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-rose-600 text-white'
                }`}
                title={isVideoOn ? 'Desativar Câmera' : 'Ativar Câmera'}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isVideoOn ? 'Vídeo On' : 'Vídeo Off'}
                </span>
              </button>

              <button
                onClick={() => setIsSharingScreen(!isSharingScreen)}
                className={`p-2.5 rounded-lg text-xs font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                  isSharingScreen
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Compartilhar Tela"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartilhar</span>
              </button>
            </div>

            {/* Split Screen Resizer Toggles */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setSplitRatio('half')}
                className={`px-2 py-0.5 rounded ${
                  splitRatio === 'half'
                    ? 'bg-slate-800 text-teal-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Divisão 50/50"
              >
                50%
              </button>
              <button
                onClick={() => setSplitRatio('wide_pep')}
                className={`px-2 py-0.5 rounded ${
                  splitRatio === 'wide_pep'
                    ? 'bg-slate-800 text-teal-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="PEP Expandido (60%)"
              >
                PEP+
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULTANEOUS PRONTUÁRIO ELETRÔNICO (PEP) & PRESCRIÇÃO */}
        <div className="flex-1 flex flex-col bg-white text-slate-900 overflow-hidden">
          {/* Top Tabs of Side Panel: Prontuário vs Chat */}
          <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSideTab('pep')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeSideTab === 'pep'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prontuário Simultâneo (PEP)</span>
              </button>

              <button
                onClick={() => setActiveSideTab('chat')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeSideTab === 'chat'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat do Atendimento ({chatMessages.length})</span>
              </button>
            </div>

            {/* Signature status / trigger */}
            <div>
              {isRecordSigned ? (
                <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assinado ICP-Brasil</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowCloudSignatureModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Assinar em Nuvem (BirdID/VIDaaS)</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT */}
          {activeSideTab === 'pep' ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
              {/* Signed banner if signed */}
              {isRecordSigned && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      <strong>Prontuário Lacrado:</strong> Assinado por{' '}
                      {currentRecord?.signed_by_name || currentUser.name} via{' '}
                      <strong>
                        {currentRecord?.signature_provider?.toUpperCase() || 'BIRDID'}
                      </strong>
                      .
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700">
                    Hash: {(currentRecord?.signature_hash || '').slice(0, 12)}...
                  </span>
                </div>
              )}

              {/* 1. Queixa e Anamnese */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    Anamnese Clínica em Tempo Real
                  </strong>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Queixa Principal
                  </label>
                  <input
                    type="text"
                    disabled={isRecordSigned}
                    value={queixa}
                    onChange={(e) => setQueixa(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    História da Doença Atual (HDA) & Observações
                  </label>
                  <textarea
                    rows={2}
                    disabled={isRecordSigned}
                    value={hda}
                    onChange={(e) => setHda(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* 2. CID-10 Selector */}
              <div className="pt-3 border-t border-slate-200">
                <CID10Search
                  selectedCid={
                    cidCode
                      ? {
                          code: cidCode,
                          description: cidDesc,
                          chapter: 'Geral',
                        }
                      : null
                  }
                  onSelectCid={(cid) => {
                    setCidCode(cid?.code || 'I10');
                    setCidDesc(cid?.description || 'Hipertensão essencial (primária)');
                  }}
                  disabled={isRecordSigned}
                  showQuickPicks={true}
                  label="Diagnóstico CID-10 da Teleconsulta"
                  helperText="Vinculação imediata com receita digital"
                />
              </div>

              {/* 3. Prescrição Durante a Consulta */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Receituário & Medicamentos Emitidos
                  </strong>
                  {!isRecordSigned && (
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="px-2 py-0.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                    >
                      <input
                        type="text"
                        disabled={isRecordSigned}
                        placeholder="Fármaco"
                        value={item.medicine}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].medicine = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded font-semibold"
                      />
                      <input
                        type="text"
                        disabled={isRecordSigned}
                        placeholder="Dosagem"
                        value={item.dosage}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].dosage = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                      />
                      <input
                        type="text"
                        disabled={isRecordSigned}
                        placeholder="Posologia"
                        value={item.frequency}
                        onChange={(e) => {
                          const updated = [...prescriptionItems];
                          updated[idx].frequency = e.target.value;
                          setPrescriptionItems(updated);
                        }}
                        className="text-xs p-1.5 bg-white border border-slate-200 rounded"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          disabled={isRecordSigned}
                          placeholder="Duração"
                          value={item.duration}
                          onChange={(e) => {
                            const updated = [...prescriptionItems];
                            updated[idx].duration = e.target.value;
                            setPrescriptionItems(updated);
                          }}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                        />
                        {!isRecordSigned && prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPrescriptionItems(
                                prescriptionItems.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Atestado de Afastamento */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">
                    Atestado de afastamento:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      disabled={isRecordSigned}
                      value={certificateDays}
                      onChange={(e) =>
                        setCertificateDays(Number(e.target.value))
                      }
                      className="w-14 text-center font-mono font-bold p-1 bg-white border border-slate-200 rounded"
                    />
                    <span className="text-slate-500">dia(s)</span>
                  </div>
                </div>

                {/* Bottom Draft Save Button */}
                {!isRecordSigned && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveDraftPEP}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Salvar Rascunho do PEP
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB: CHAT WITH PATIENT */
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2.5 p-2 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-xl p-2.5 ${
                      msg.sender === currentUser.name
                        ? 'ml-auto bg-teal-600 text-white'
                        : 'mr-auto bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-80 mb-0.5">
                      {msg.sender} · {msg.time}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="pt-2 border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Digite uma mensagem para o paciente..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Signature Modal */}
      {showCloudSignatureModal && (
        <CloudSignatureModal
          patient={patient}
          currentUser={currentUser}
          contentToSign={{
            queixa,
            hda,
            cidCode,
            prescriptionItems,
            certificateDays,
          }}
          onClose={() => setShowCloudSignatureModal(false)}
          onSignedSuccess={handleSignatureSuccess}
        />
      )}
    </div>
  );
};
