import React, { useState, useMemo } from 'react';
import {
  Appointment,
  Patient,
  User,
  Clinic,
  PreConsultationTriage,
  ManchesterRiskLevel,
} from '../../types/clinic';
import {
  ClipboardCheck,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Activity,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Pill,
  ShieldAlert,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatDateTimeBR } from '../../lib/crypto';

interface PreConsultationTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  patient: Patient;
  doctor?: User;
  clinic: Clinic;
  onSaveTriage: (triage: PreConsultationTriage) => void;
}

const COMMON_CHIEF_COMPLAINTS = [
  'Febre e Sintomas Gripais / Respiratórios',
  'Dor de Cabeça / Cefaleia Intensa',
  'Acompanhamento de Rotina / Hipertensão',
  'Desconforto Gastrointestinal / Náusea',
  'Dor Musculoesquelética / Lombalgia',
  'Ansiedade, Estresse ou Insônia',
  'Alergia / Lesão de Pele',
  'Renovação de Receita / Exames',
];

const SYMPTOMS_CHECKLIST = [
  { id: 'febre', label: 'Febre / Calafrios', category: 'geral' },
  { id: 'fadiga', label: 'Cansaço extremo / Fraqueza', category: 'geral' },
  { id: 'dor_corpo', label: 'Dor no corpo / Mialgia', category: 'geral' },
  { id: 'tosse_seca', label: 'Tosse seca', category: 'respiratorio' },
  { id: 'tosse_cheia', label: 'Tosse produtiva (catarro)', category: 'respiratorio' },
  { id: 'falta_ar', label: 'Falta de ar / Dificuldade para respirar', category: 'respiratorio' },
  { id: 'dor_garganta', label: 'Dor ou queimação na garganta', category: 'respiratorio' },
  { id: 'coriza', label: 'Congestão nasal ou coriza', category: 'respiratorio' },
  { id: 'dor_peito', label: 'Aperto ou dor no peito', category: 'cardio' },
  { id: 'palpitacao', label: 'Palpitações / Taquicardia', category: 'cardio' },
  { id: 'nausea', label: 'Náusea ou vômitos', category: 'digestivo' },
  { id: 'dor_abdominal', label: 'Cólicas ou dor de estômago', category: 'digestivo' },
  { id: 'diarreia', label: 'Diarreia', category: 'digestivo' },
  { id: 'cefaleia', label: 'Dor de cabeça / Cefaleia', category: 'neuro' },
  { id: 'tontura', label: 'Tontura ou desequilíbrio', category: 'neuro' },
  { id: 'ansiedade', label: 'Aperto no peito por ansiedade / Agitação', category: 'neuro' },
];

const RED_FLAGS = [
  { id: 'dispneia_grave', label: 'Falta de ar intensa ou lábios arroxeados (cianose)' },
  { id: 'dor_toracica_irradiada', label: 'Dor no peito tipo opressão irradiando para o braço esquerdo ou mandíbula' },
  { id: 'febre_39', label: 'Febre contínua acima de 39°C refratária a antitérmicos' },
  { id: 'sincope', label: 'Desmaio recente, confusão mental súbita ou perda de fala' },
];

export const PreConsultationTriageModal: React.FC<PreConsultationTriageModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patient,
  doctor,
  clinic,
  onSaveTriage,
}) => {
  const existing = appointment.triage;

  // Form states
  const [chiefComplaint, setChiefComplaint] = useState(
    existing?.chief_complaint || 'Febre e Sintomas Gripais / Respiratórios'
  );
  const [customComplaint, setCustomComplaint] = useState('');
  const [symptomsDuration, setSymptomsDuration] = useState(
    existing?.symptoms_duration || '2 a 3 dias'
  );
  const [painScaleEva, setPainScaleEva] = useState<number>(
    existing?.pain_scale_eva ?? 3
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    existing?.selected_symptoms || ['febre', 'dor_corpo', 'coriza']
  );
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>(
    existing?.red_flags || []
  );
  const [currentMedications, setCurrentMedications] = useState(
    existing?.current_medications || 'Dipirona 500mg se dor, Losartana 50mg'
  );
  const [knownAllergies, setKnownAllergies] = useState(
    existing?.known_allergies || patient.allergies || 'Nenhuma alergia conhecida'
  );
  const [temperatureC, setTemperatureC] = useState<number | undefined>(
    existing?.temperature_c || 37.8
  );
  const [bloodPressure, setBloodPressure] = useState(
    existing?.blood_pressure_reported || '120/80'
  );
  const [patientNotes, setPatientNotes] = useState(
    existing?.patient_notes || ''
  );

  // Automatic Manchester Risk Level Calculation
  const calculatedRisk = useMemo<ManchesterRiskLevel>(() => {
    if (
      selectedRedFlags.includes('dispneia_grave') ||
      selectedRedFlags.includes('dor_toracica_irradiada') ||
      selectedRedFlags.includes('sincope')
    ) {
      return 'red';
    }
    if (selectedRedFlags.length > 0 || painScaleEva >= 8) {
      return 'orange';
    }
    if (painScaleEva >= 5 || (temperatureC && temperatureC >= 38.5)) {
      return 'yellow';
    }
    if (painScaleEva >= 1 || selectedSymptoms.length > 0) {
      return 'green';
    }
    return 'blue';
  }, [selectedRedFlags, painScaleEva, temperatureC, selectedSymptoms]);

  if (!isOpen) return null;

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleRedFlag = (id: string) => {
    setSelectedRedFlags((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const finalComplaint =
      chiefComplaint === 'Outro...' && customComplaint.trim()
        ? customComplaint.trim()
        : chiefComplaint;

    const triageData: PreConsultationTriage = {
      id: existing?.id || `tri-${Date.now()}`,
      appointment_id: appointment.id,
      patient_id: patient.id,
      completed_at: new Date().toISOString(),
      chief_complaint: finalComplaint,
      symptoms_duration: symptomsDuration,
      pain_scale_eva: painScaleEva,
      selected_symptoms: selectedSymptoms,
      red_flags: selectedRedFlags,
      current_medications: currentMedications,
      known_allergies: knownAllergies,
      risk_level: calculatedRisk,
      patient_notes: patientNotes,
      temperature_c: temperatureC,
      blood_pressure_reported: bloodPressure,
    };

    onSaveTriage(triageData);
    onClose();
  };

  const getRiskBadge = (level: ManchesterRiskLevel) => {
    switch (level) {
      case 'red':
        return {
          label: 'Emergência (Vermelho)',
          bg: 'bg-rose-500 text-white border-rose-600',
          desc: 'Sinais de alerta graves. Atendimento médico imediato necessário.',
        };
      case 'orange':
        return {
          label: 'Muito Urgente (Laranja)',
          bg: 'bg-orange-500 text-white border-orange-600',
          desc: 'Dor severa ou sinal de alerta. Prioridade elevada na fila.',
        };
      case 'yellow':
        return {
          label: 'Urgente (Amarelo)',
          bg: 'bg-amber-400 text-amber-950 border-amber-500',
          desc: 'Sintomas moderados ou febre significativa.',
        };
      case 'green':
        return {
          label: 'Pouco Urgente (Verde)',
          bg: 'bg-emerald-500 text-white border-emerald-600',
          desc: 'Condição clínica estável sem sinais de alarme.',
        };
      case 'blue':
        return {
          label: 'Não Urgente (Azul)',
          bg: 'bg-sky-500 text-white border-sky-600',
          desc: 'Atendimento eletivo, rotina ou renovação de prescrição.',
        };
    }
  };

  const riskInfo = getRiskBadge(calculatedRisk);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Triagem Pré-Consulta (Telemedicina & Presencial)
                </h3>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  Auto-Preenchimento PEP
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Paciente: <strong>{patient.name}</strong> · Agendamento:{' '}
                {formatDateTimeBR(appointment.scheduled_at)}
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

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Automatic JSONB Injection Banner */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Sincronização Automática:</strong> As respostas deste checklist serão injetadas instantaneamente no campo <code>anamnese_data (JSONB)</code> do prontuário ao iniciar a telemedicina.
              </span>
            </div>
          </div>

          {/* Manchester Risk Level Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${riskInfo.bg} shadow-xs`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                Classificação de Risco (Protocolo de Manchester)
              </span>
              <div className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
                <Activity className="w-4 h-4" />
                <span>{riskInfo.label}</span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">{riskInfo.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-1 rounded-lg inline-block">
                Dor EVA: {painScaleEva}/10
              </span>
            </div>
          </div>

          {/* SECTION 1: QUEIXA PRINCIPAL & DURAÇÃO */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Motivo Principal do Atendimento
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_CHIEF_COMPLAINTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChiefComplaint(item)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    chiefComplaint === item
                      ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-semibold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Há quanto tempo iniciaram os sintomas?
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Hoje (< 24h)', '2 a 3 dias', '4 a 7 dias', 'Mais de 2 semanas', 'Quadro Crônico'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSymptomsDuration(dur)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                      symptomsDuration === dur
                        ? 'border-teal-600 bg-teal-600 text-white shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: CHECKLIST DE SINTOMAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Checklist de Sintomas Atuais
              </label>
              <span className="text-[11px] text-slate-500">
                Selecione todos que se aplicam
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SYMPTOMS_CHECKLIST.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-950 font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="leading-tight text-[11px]">{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: SINAIS DE ALERTA (RED FLAGS) */}
          <div className="space-y-3 p-4 bg-rose-50/60 rounded-xl border border-rose-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <label className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                3. Sinais de Alerta Críticos (Red Flags)
              </label>
            </div>
            <p className="text-[11px] text-rose-700">
              Caso apresente algum destes sintomas graves, alerte o médico imediatamente:
            </p>

            <div className="space-y-2">
              {RED_FLAGS.map((rf) => {
                const isChecked = selectedRedFlags.includes(rf.id);
                return (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => toggleRedFlag(rf.id)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2.5 ${
                      isChecked
                        ? 'border-rose-500 bg-rose-100 text-rose-950 font-bold shadow-2xs'
                        : 'border-rose-200 bg-white text-rose-900 hover:bg-rose-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'border-rose-300 bg-white'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className="text-[11px] leading-snug">{rf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: ESCALA DE DOR EVA (0 A 10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Intensidade da Dor (Escala EVA 0 a 10)
              </label>
              <span className="font-bold text-xs text-slate-900">
                Nível: {painScaleEva} / 10
              </span>
            </div>

            <div className="grid grid-cols-11 gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = painScaleEva === num;
                let bgClass = 'hover:bg-slate-100 border-slate-200 text-slate-700';
                if (isSelected) {
                  if (num === 0) bgClass = 'bg-slate-800 text-white border-slate-900';
                  else if (num <= 3) bgClass = 'bg-emerald-500 text-white border-emerald-600';
                  else if (num <= 6) bgClass = 'bg-amber-500 text-white border-amber-600';
                  else bgClass = 'bg-rose-600 text-white border-rose-700';
                }

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPainScaleEva(num)}
                    className={`h-9 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-all ${bgClass} ${
                      isSelected ? 'ring-2 ring-teal-500 shadow-xs scale-105' : ''
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 px-1">
              <span>0 (Sem dor)</span>
              <span>5 (Dor moderada)</span>
              <span>10 (Pior dor possível)</span>
            </div>
          </div>

          {/* SECTION 5: SINAIS VITAIS CASEIROS & MEDICAMENTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                <span>Temperatura Aferida (°C)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="34"
                max="43"
                value={temperatureC || ''}
                onChange={(e) => setTemperatureC(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Ex: 37.8"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                <span>Pressão Arterial Caseira (PA)</span>
              </label>
              <input
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                placeholder="Ex: 120/80"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* MEDICAMENTOS & ALERGIAS */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Medicamentos em uso contínuo ou recente</span>
              </label>
              <input
                type="text"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Ex: Losartana 50mg, Dipirona se dor..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alergias Medicamentosas conhecidas
              </label>
              <input
                type="text"
                value={knownAllergies}
                onChange={(e) => setKnownAllergies(e.target.value)}
                placeholder="Ex: Dipirona, Penicilina, Nenhuma..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações adicionais para o médico (Opcional)
              </label>
              <textarea
                rows={2}
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Ex: Gostaria de checar meus exames laboratoriais trazidos em anexo..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Salvar Triagem e Injetar no Prontuário (PEP)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
