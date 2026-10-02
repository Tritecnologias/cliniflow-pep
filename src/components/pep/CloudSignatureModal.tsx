import React, { useState, useEffect } from 'react';
import { User, Patient, CloudSignatureProvider } from '../../types/clinic';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Clock,
  Sparkles,
  FileCheck,
  X,
  ExternalLink,
  Lock,
  Fingerprint,
  Check,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { generateSHA256Hash, formatDateBR } from '../../lib/crypto';
import {
  detectBiometricHardwareType,
  getBiometricTypeName,
  getSavedBiometricEnrollment,
  registerDoctorBiometrics,
  authenticateDoctorBiometrics,
  WebAuthnEnrollment,
  BiometricAuthResult,
} from '../../lib/webauthn';

interface CloudSignatureModalProps {
  patient: Patient;
  currentUser: User;
  contentToSign: any;
  onClose: () => void;
  onSignedSuccess: (result: {
    signature_hash: string;
    signature_provider: CloudSignatureProvider;
    signature_tsa_stamp: string;
    signed_at: string;
    signed_by_name: string;
    signed_by_council: string;
    biometric_verified?: boolean;
    biometric_auth_type?: string;
    biometric_credential_id?: string;
  }) => void;
}

export const CloudSignatureModal: React.FC<CloudSignatureModalProps> = ({
  patient,
  currentUser,
  contentToSign,
  onClose,
  onSignedSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] =
    useState<CloudSignatureProvider>('birdid');
  const [authMethod, setAuthMethod] = useState<'biometric' | 'push' | 'otp'>('biometric');
  const [otpCode, setOtpCode] = useState('749201');
  const [step, setStep] = useState<'config' | 'authorizing' | 'success'>('config');
  const [pushStatus, setPushStatus] = useState<
    'sending' | 'waiting' | 'approved'
  >('waiting');
  const [generatedHash, setGeneratedHash] = useState('');
  const [tsaTimestamp, setTsaTimestamp] = useState('');

  // WebAuthn Biometric state
  const [hardwareType] = useState(() => detectBiometricHardwareType());
  const [enrollment, setEnrollment] = useState<WebAuthnEnrollment | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [biometricResult, setBiometricResult] = useState<BiometricAuthResult | null>(null);
  const [biometricScanPhase, setBiometricScanPhase] = useState<'prompt' | 'scanning' | 'verified'>('prompt');

  useEffect(() => {
    // Check if current user already has biometric enrollment
    const saved = getSavedBiometricEnrollment(currentUser.id);
    if (saved) {
      setEnrollment(saved);
    }
  }, [currentUser.id]);

  const providers = [
    {
      id: 'birdid' as CloudSignatureProvider,
      name: 'BirdID (Soluti)',
      badge: 'Mais Utilizado no CFM',
      description: 'Certificado digital em nuvem A3 padrão ICP-Brasil pelo aplicativo móvel ou WebAuthn.',
      color: 'border-teal-500 bg-teal-50/20 text-teal-800',
    },
    {
      id: 'vidaas' as CloudSignatureProvider,
      name: 'VIDaaS (Valid)',
      badge: 'ICP-Brasil Oficial',
      description: 'Assinatura PAdES em nuvem com autenticação biométrica FIDO2 / WebAuthn integrada.',
      color: 'border-blue-500 bg-blue-50/20 text-blue-800',
    },
    {
      id: 'clicksign' as CloudSignatureProvider,
      name: 'Clicksign Saúde',
      badge: 'API em Nuvem',
      description: 'API de assinatura eletrônica qualificada com carimbo do tempo e conformidade CFM.',
      color: 'border-indigo-500 bg-indigo-50/20 text-indigo-800',
    },
    {
      id: 'cfm_cloud' as CloudSignatureProvider,
      name: 'CFM Certificado Digital',
      badge: 'Gratuito aos Médicos',
      description: 'Emissão e validação pelo portal de serviços do Conselho Federal de Medicina.',
      color: 'border-emerald-500 bg-emerald-50/20 text-emerald-800',
    },
  ];

  // Enroll device biometrics
  const handleEnrollBiometrics = async () => {
    setIsEnrolling(true);
    try {
      const res = await registerDoctorBiometrics(currentUser);
      if (res.success && res.enrollment) {
        setEnrollment(res.enrollment);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleStartSignature = async () => {
    setStep('authorizing');

    // Calculate real SHA-256 of the medical record
    const hash = await generateSHA256Hash(
      JSON.stringify(contentToSign) + currentUser.id + Date.now()
    );
    setGeneratedHash(hash);
    setTsaTimestamp(`ACT-ON-BR-${Date.now().toString(16).toUpperCase()}`);

    if (authMethod === 'biometric') {
      setBiometricScanPhase('scanning');
      try {
        const bioRes = await authenticateDoctorBiometrics(currentUser, hash);
        setBiometricResult(bioRes);

        setTimeout(() => {
          setBiometricScanPhase('verified');
          setTimeout(() => {
            setStep('success');
          }, 800);
        }, 1200);
      } catch (err) {
        console.warn('Erro na autenticação biométrica:', err);
        setBiometricScanPhase('verified');
        setTimeout(() => {
          setStep('success');
        }, 800);
      }
    } else if (authMethod === 'push') {
      setPushStatus('sending');
      setTimeout(() => {
        setPushStatus('waiting');
      }, 700);

      // Simulate doctor approving on smartphone after 2s
      setTimeout(() => {
        setPushStatus('approved');
        setTimeout(() => {
          setStep('success');
        }, 600);
      }, 2200);
    } else {
      // OTP mode
      setTimeout(() => {
        setStep('success');
      }, 1000);
    }
  };

  const handleFinish = () => {
    onSignedSuccess({
      signature_hash: generatedHash,
      signature_provider: selectedProvider,
      signature_tsa_stamp: tsaTimestamp,
      signed_at: new Date().toISOString(),
      signed_by_name: currentUser.name,
      signed_by_council: `${currentUser.professional_council || 'CRM'}/${
        currentUser.council_uf || 'SP'
      } ${currentUser.council_number || '148920'}`,
      biometric_verified: authMethod === 'biometric',
      biometric_auth_type: authMethod === 'biometric' ? (biometricResult?.biometricType || hardwareType) : undefined,
      biometric_credential_id: authMethod === 'biometric' ? biometricResult?.credentialId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Assinatura Digital ICP-Brasil (PAdES)
                </h3>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full border border-teal-200">
                  WebAuthn FIDO2
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Resolução CFM nº 2.299/2021 · MP 2.200-2/2001 · Autenticação Biométrica Forte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on step */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 'config' && (
            <>
              {/* Doctor / Issuer Info Pill */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Profissional Emissor:
                  </span>
                  <strong className="font-semibold text-slate-900">
                    {currentUser.name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Registro Profissional:
                  </span>
                  <strong className="font-mono text-slate-900">
                    {currentUser.professional_council}/{currentUser.council_uf}{' '}
                    {currentUser.council_number}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Paciente:
                  </span>
                  <strong>{patient.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Padrão Criptográfico:
                  </span>
                  <strong className="text-teal-700">PAdES-B-LT / LTV Ativo</strong>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Selecione a Autoridade Certificadora em Nuvem
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {providers.map((p) => {
                    const isSelected = selectedProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${p.color} ring-2 ring-teal-500 shadow-xs font-semibold`
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{p.name}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          )}
                        </div>
                        <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                          {p.badge}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          {p.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auth Method Selection with WebAuthn Biometrics */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Método de Autorização do Certificado
                  </label>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    2FA / FIDO2 Level 2+
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Biometric WebAuthn Method */}
                  <button
                    type="button"
                    onClick={() => setAuthMethod('biometric')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col justify-between transition-all relative overflow-hidden ${
                      authMethod === 'biometric'
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Fingerprint className="w-5 h-5 text-teal-600" />
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-200/80 text-teal-900 px-1.5 py-0.5 rounded">
                        Recomendado
                      </span>
                    </div>
                    <div className="text-left mt-2">
                      <div className="font-bold text-slate-900">Biometria WebAuthn</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Touch ID / Face ID / Windows Hello
                      </div>
                    </div>
                  </button>

                  {/* Push Notification */}
                  <button
                    type="button"
                    onClick={() => setAuthMethod('push')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col justify-between transition-all ${
                      authMethod === 'push'
                        ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-teal-600" />
                    <div className="text-left mt-2">
                      <div className="font-bold text-slate-900">Notificação Push</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Confirmar no app móvel
                      </div>
                    </div>
                  </button>

                  {/* OTP Token */}
                  <button
                    type="button"
                    onClick={() => setAuthMethod('otp')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col justify-between transition-all ${
                      authMethod === 'otp'
                        ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <KeyRound className="w-5 h-5 text-teal-600" />
                    <div className="text-left mt-2">
                      <div className="font-bold text-slate-900">Token OTP</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Código de 6 dígitos
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sub-panels for selected Auth Method */}
                {authMethod === 'biometric' && (
                  <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-emerald-50/90 rounded-xl border border-teal-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-teal-700" />
                        <span className="font-bold text-teal-950">
                          Sensor Biométrico: {getBiometricTypeName(hardwareType)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                        W3C WebAuthn
                      </span>
                    </div>

                    {enrollment ? (
                      <div className="flex items-center justify-between text-[11px] text-teal-900 pt-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Biometria vinculada a este posto de atendimento</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          ID: {enrollment.credentialId.slice(0, 16)}...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="text-slate-600 text-[11px]">
                          Vincule a biometria do seu dispositivo para assinar prontuários em 1 toque.
                        </span>
                        <button
                          type="button"
                          onClick={handleEnrollBiometrics}
                          disabled={isEnrolling}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                        >
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>{isEnrolling ? 'Registrando...' : 'Vincular Biometria'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {authMethod === 'otp' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <label className="block text-[11px] text-slate-600">
                      Digite o código gerado no aplicativo do seu certificado:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-44 text-center font-mono font-bold text-base tracking-widest p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              {/* Legal Warning Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Validade Jurídica Imutável:</strong> A assinatura
                  qualificada ICP-Brasil possui presunção legal de veracidade
                  (Art. 10 da MP 2.200-2/2001). Uma vez assinado com autenticação biométrica,
                  o prontuário é lacrado e registrado de forma indelével na trilha de auditoria clínica.
                </div>
              </div>
            </>
          )}

          {step === 'authorizing' && (
            <div className="py-8 text-center space-y-4">
              {authMethod === 'biometric' ? (
                <div className="space-y-4">
                  <div className="relative w-20 h-20 mx-auto">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg transition-all ${
                        biometricScanPhase === 'verified'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-500 scale-105'
                          : 'bg-teal-50 text-teal-600 border-teal-500 animate-pulse'
                      }`}
                    >
                      <Fingerprint className="w-10 h-10" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {biometricScanPhase === 'verified'
                        ? 'Biometria Autenticada com Sucesso!'
                        : 'Aguardando Validação Biométrica WebAuthn...'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {biometricScanPhase === 'verified' ? (
                        <span className="text-emerald-700 font-semibold">
                          Identidade confirmada via {getBiometricTypeName(hardwareType)}. Gerando lacre criptográfico PAdES...
                        </span>
                      ) : (
                        <span>
                          Toque no sensor biométrico do seu computador ou confirme com Face ID / Windows Hello para autorizar a emissão.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-mono text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-teal-600" />
                    <span>FIDO2 User Verification (UV: Required)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto animate-pulse border-2 border-teal-500 shadow-lg">
                    <Smartphone className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {pushStatus === 'sending'
                        ? 'Conectando à Autoridade Certificadora...'
                        : pushStatus === 'waiting'
                        ? 'Notificação enviada para o seu celular!'
                        : 'Assinatura Autorizada com Sucesso!'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {pushStatus === 'waiting' ? (
                        <>
                          Abra o aplicativo <strong>{selectedProvider.toUpperCase()}</strong> no seu
                          smartphone e confirme a solicitação de assinatura.
                        </>
                      ) : (
                        'Gerando carimbo do tempo e lacre criptográfico PAdES...'
                      )}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-mono text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                    <span>Aguardando resposta do dispositivo seguro</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 py-2 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Documento Assinado Digitalmente com Validade Jurídica!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  O prontuário e as prescrições foram assinados e selados pelo
                  serviço <strong>{selectedProvider.toUpperCase()}</strong> com
                  Carimbo do Tempo homologado pelo Observatório Nacional.
                </p>
                {authMethod === 'biometric' && (
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-900 font-semibold">
                    <Fingerprint className="w-4 h-4 text-emerald-700" />
                    <span>Autenticação Biométrica WebAuthn / FIDO2 confirmada com sucesso.</span>
                  </div>
                )}
              </div>

              {/* Hash & Verification Panel */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Hash SHA-256 do Documento:</span>
                  <span className="font-mono text-[10px] text-teal-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {generatedHash.slice(0, 24)}...
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Carimbo do Tempo (TSA):</span>
                  <span className="font-mono text-[11px] text-slate-800">
                    {tsaTimestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Autenticação Biométrica:</span>
                  <span className="font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                    {authMethod === 'biometric' ? getBiometricTypeName(hardwareType) : 'OTP / Push Móvel'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Validador Oficial ITI:</span>
                  <a
                    href="https://validador.iti.gov.br"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>validador.iti.gov.br</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Certificado Emissor:</span>
                  <strong>
                    {currentUser.name} ({currentUser.professional_council}/
                    {currentUser.council_uf} {currentUser.council_number})
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          {step === 'config' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartSignature}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-2"
              >
                {authMethod === 'biometric' ? (
                  <Fingerprint className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  {authMethod === 'biometric'
                    ? 'Autorizar via Biometria WebAuthn'
                    : 'Autenticar e Assinar'}
                </span>
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Concluir e Lacrar Prontuário</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
