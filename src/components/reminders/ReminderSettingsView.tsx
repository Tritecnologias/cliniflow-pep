import React, { useState } from 'react';
import {
  Clinic,
  User,
  ReminderSettings,
  ReminderTriggerRule,
  TimeUnit,
} from '../../types/clinic';
import {
  Bell,
  Clock,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Check,
  CheckCheck,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Save,
  Send,
  Sliders,
  ChevronDown,
  Info,
  Calendar,
  Video,
  MapPin,
  Bot,
  Zap,
} from 'lucide-react';
import { formatTimeBR, formatDateBR } from '../../lib/crypto';

interface ReminderSettingsViewProps {
  clinic: Clinic;
  currentUser: User;
  settings: ReminderSettings;
  onSave: (settings: ReminderSettings) => void;
  onClose?: () => void;
}

export const ReminderSettingsView: React.FC<ReminderSettingsViewProps> = ({
  clinic,
  currentUser,
  settings: initialSettings,
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = useState<ReminderSettings>(initialSettings);
  const [activeRuleId, setActiveRuleId] = useState<string>(
    initialSettings.rules[0]?.id || ''
  );
  const [testSent, setTestSent] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedRule =
    settings.rules.find((r) => r.id === activeRuleId) || settings.rules[0];

  const handleToggleGlobal = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleUpdateRule = (
    ruleId: string,
    updates: Partial<ReminderTriggerRule>
  ) => {
    setSettings((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    }));
  };

  const handleAddRule = () => {
    const newId = `rule-${Date.now()}`;
    const newRule: ReminderTriggerRule = {
      id: newId,
      name: `Lembrete Personalizado (${settings.rules.length + 1})`,
      enabled: true,
      time_value: 3,
      time_unit: 'hours',
      target_type: 'all',
      message_template:
        'Olá, *{paciente}*! Lembramos do seu atendimento com *{medico}* na *{clinica}* em {horario}. Qualquer imprevisto, avise-nos por aqui.',
      include_telemedicine_link: true,
      include_location_map: false,
      request_confirmation: false,
    };
    setSettings((prev) => ({ ...prev, rules: [...prev.rules, newRule] }));
    setActiveRuleId(newId);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (settings.rules.length <= 1) return;
    const remaining = settings.rules.filter((r) => r.id !== ruleId);
    setSettings((prev) => ({ ...prev, rules: remaining }));
    if (activeRuleId === ruleId) {
      setActiveRuleId(remaining[0]?.id || '');
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    if (!selectedRule) return;
    const updatedTemplate = selectedRule.message_template + ` ${placeholder}`;
    handleUpdateRule(selectedRule.id, { message_template: updatedTemplate });
  };

  const handleSaveAll = () => {
    onSave(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestDispatch = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  // Render preview message text with mocked dynamic values
  const getRenderedPreviewText = (template: string) => {
    return template
      .replace(/\{paciente\}/g, 'Helena Fontes')
      .replace(/\{medico\}/g, currentUser.name)
      .replace(/\{clinica\}/g, clinic.name)
      .replace(/\{data\}/g, 'Amanhã (Quinta-feira)')
      .replace(/\{horario\}/g, '14:30')
      .replace(/\{endereco_ou_link\}/g, clinic.address)
      .replace(
        /\{link_telemedicina\}/g,
        'https://cliniflow.app/tele/sala-segura-772'
      );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Automação WhatsApp-First
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <span>Configurações de Lembrete e Disparo Automático</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina com quantos minutos, horas ou dias de antecedência o WhatsApp da clínica deve notificar os pacientes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Configurações Salvas!</span>
            </div>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Regras de Disparo</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Rules & Time Settings on Left, WhatsApp Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: RULES & TIME SETTINGS */}
        <div className="lg:col-span-7 space-y-5">
          {/* Master Activation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Disparo Automático de Lembretes WhatsApp
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Robô de mensagens ativado para consultas agendadas e retornos
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={handleToggleGlobal}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Trigger Rules Tabs / Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Regras de Antecedência do Disparo</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure múltiplos momentos de aviso antes da consulta
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRule}
                className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Regra</span>
              </button>
            </div>

            {/* Segmented Rule Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {settings.rules.map((rule, idx) => {
                const isActive = rule.id === activeRuleId;
                return (
                  <button
                    key={rule.id}
                    onClick={() => setActiveRuleId(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                      isActive
                        ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs ring-1 ring-teal-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.enabled ? 'bg-teal-500' : 'bg-slate-300'
                      }`}
                    />
                    <span>{rule.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ({rule.time_value}{' '}
                      {rule.time_unit === 'minutes'
                        ? 'min'
                        : rule.time_unit === 'hours'
                        ? 'h'
                        : 'dias'}
                      )
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Rule Detailed Editor */}
            {selectedRule && (
              <div className="pt-2 space-y-4">
                {/* Rule Title and Enable Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Identificação da Regra
                    </label>
                    <input
                      type="text"
                      value={selectedRule.name}
                      onChange={(e) =>
                        handleUpdateRule(selectedRule.id, {
                          name: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedRule.enabled}
                        onChange={(e) =>
                          handleUpdateRule(selectedRule.id, {
                            enabled: e.target.checked,
                          })
                        }
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>Regra Ativa</span>
                    </label>

                    {settings.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(selectedRule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Excluir esta regra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* THE CORE TIMING CONTROLS: Value & Unit (minutes/hours/days) */}
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Antecedência do Disparo Automático
                    </label>
                    <span className="text-[11px] text-teal-700 font-medium">
                      Disparar exatamente antes do horário agendado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Time Value (number) */}
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantidade de tempo:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={selectedRule.time_value}
                          onChange={(e) =>
                            handleUpdateRule(selectedRule.id, {
                              time_value: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-full text-sm font-bold font-mono p-2 bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Time Unit (minutes / hours / days) */}
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Unidade de medida:
                      </span>
                      <div className="grid grid-cols-3 gap-1 p-0.5 bg-white border border-slate-300 rounded-lg">
                        {(['minutes', 'hours', 'days'] as TimeUnit[]).map(
                          (unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() =>
                                handleUpdateRule(selectedRule.id, {
                                  time_unit: unit,
                                })
                              }
                              className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                                selectedRule.time_unit === unit
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {unit === 'minutes'
                                ? 'Minutos'
                                : unit === 'hours'
                                ? 'Horas'
                                : 'Dias'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary of Rule Timing */}
                  <div className="text-xs text-teal-800 bg-white p-2.5 rounded-lg border border-teal-200 font-medium flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      O WhatsApp será enviado{' '}
                      <strong>
                        {selectedRule.time_value}{' '}
                        {selectedRule.time_unit === 'minutes'
                          ? selectedRule.time_value === 1
                            ? 'minuto'
                            : 'minutos'
                          : selectedRule.time_unit === 'hours'
                          ? selectedRule.time_value === 1
                            ? 'hora'
                            : 'horas'
                          : selectedRule.time_value === 1
                          ? 'dia'
                          : 'dias'}{' '}
                        antes
                      </strong>{' '}
                      da consulta agendada.
                    </span>
                  </div>
                </div>

                {/* Target Type: Presential, Telemedicine or All */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modalidade Alvo da Regra
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'Todas as Consultas' },
                      { id: 'presential', label: 'Apenas Presencial' },
                      { id: 'telemedicine', label: 'Apenas Telemedicina' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          handleUpdateRule(selectedRule.id, {
                            target_type: type.id as any,
                          })
                        }
                        className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                          selectedRule.target_type === type.id
                            ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRule.request_confirmation}
                      onChange={(e) =>
                        handleUpdateRule(selectedRule.id, {
                          request_confirmation: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <div>
                      <strong className="block text-slate-800">
                        Pedir Confirmação 1-Clique
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        Insere opções "1 para Confirmar / 2 para Reagendar"
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRule.include_telemedicine_link}
                      onChange={(e) =>
                        handleUpdateRule(selectedRule.id, {
                          include_telemedicine_link: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <div>
                      <strong className="block text-slate-800">
                        Incluir Link de Telemedicina
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        Anexa sala virtual para consultas online
                      </span>
                    </div>
                  </label>
                </div>

                {/* Template Message Box with Placeholders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Texto da Mensagem (WhatsApp)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Suporta *negrito* e _itálico_
                    </span>
                  </div>

                  {/* Variables Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Inserir variável:
                    </span>
                    {[
                      { code: '{paciente}', label: 'Nome Paciente' },
                      { code: '{medico}', label: 'Profissional' },
                      { code: '{data}', label: 'Data' },
                      { code: '{horario}', label: 'Horário' },
                      { code: '{clinica}', label: 'Clínica' },
                      { code: '{link_telemedicina}', label: 'Link Teleconsulta' },
                    ].map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => handleInsertPlaceholder(p.code)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono transition-colors"
                      >
                        +{p.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={4}
                    value={selectedRule.message_template}
                    onChange={(e) =>
                      handleUpdateRule(selectedRule.id, {
                        message_template: e.target.value,
                      })
                    }
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl font-mono leading-relaxed focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Working Hours & Gateway Protection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Horário Comercial & Gateway de Envio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.send_working_hours_only}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        send_working_hours_only: e.target.checked,
                      })
                    }
                    className="rounded text-teal-600 w-4 h-4"
                  />
                  <span>Bloquear Envios Noturnos</span>
                </label>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Mensagens agendadas para o período entre {settings.working_hours_end} e {settings.working_hours_start} serão enfileiradas e disparadas às {settings.working_hours_start}.
                </p>

                <div className="flex items-center gap-2 pt-1 font-mono">
                  <input
                    type="time"
                    value={settings.working_hours_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        working_hours_start: e.target.value,
                      })
                    }
                    className="p-1 border border-slate-200 rounded bg-white"
                  />
                  <span>até</span>
                  <input
                    type="time"
                    value={settings.working_hours_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        working_hours_end: e.target.value,
                      })
                    }
                    className="p-1 border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>

              {/* Gateway API selection */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block font-semibold text-slate-800">
                  Gateway de WhatsApp Ativo
                </span>
                <select
                  value={settings.api_gateway}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      api_gateway: e.target.value as any,
                    })
                  }
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="meta_cloud">Meta Cloud API (Oficial WhatsApp Business)</option>
                  <option value="zapi">Z-API WhatsApp Gateway</option>
                  <option value="evolution">Evolution API (Open-Source)</option>
                </select>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Webhook ativo e escutando respostas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SMARTPHONE LIVE PREVIEW & TEST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Pré-visualização em Tempo Real
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Regra: {selectedRule?.name}
              </span>
            </div>

            {/* Smartphone Mockup */}
            <div className="w-full max-w-sm rounded-[2rem] border-4 border-slate-800 bg-[#E5DDD5] shadow-xl overflow-hidden flex flex-col">
              {/* Phone Camera Notch & WhatsApp Top Bar */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-[11px]">
                    {clinic.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold leading-tight">{clinic.name}</div>
                    <div className="text-[10px] text-emerald-200">
                      Disparo Automático · Verificado
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-100">online</span>
              </div>

              {/* Chat Canvas */}
              <div className="p-3.5 space-y-3 min-h-[340px] flex flex-col justify-end text-xs">
                {/* Date bubble */}
                <div className="text-center">
                  <span className="bg-white/80 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
                    Hoje
                  </span>
                </div>

                {/* Simulated Automated Reminder Message */}
                <div className="bg-[#DCF8C6] text-slate-800 rounded-xl p-3 max-w-[92%] ml-auto shadow-sm space-y-1.5 whitespace-pre-wrap leading-relaxed border border-emerald-100 text-xs">
                  <div>
                    {selectedRule
                      ? getRenderedPreviewText(selectedRule.message_template)
                      : 'Carregando mensagem...'}
                  </div>

                  {selectedRule?.request_confirmation && (
                    <div className="pt-2 border-t border-emerald-200/80 text-[11px] space-y-1 font-medium">
                      <div>
                        👉 Responda <strong>1</strong> para{' '}
                        <span className="text-emerald-800 font-bold">
                          CONFIRMAR
                        </span>
                      </div>
                      <div>
                        👉 Responda <strong>2</strong> para{' '}
                        <span className="text-slate-700">REAGENDAR</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 text-right flex items-center justify-end gap-1 mt-1">
                    <span>{formatTimeBR(new Date().toISOString())}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>

                {/* Simulated Patient Instant Response */}
                <div className="bg-white text-slate-800 rounded-xl p-2.5 max-w-[75%] mr-auto shadow-sm border border-slate-200 text-xs animate-in fade-in">
                  <div className="font-semibold text-teal-800 text-[10px]">
                    Helena Fontes
                  </div>
                  <div>1 - Confirmo minha presença! Obrigado pelo aviso.</div>
                  <div className="text-[10px] text-slate-400 text-right mt-0.5">
                    {formatTimeBR(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Fake WhatsApp Bottom Input */}
              <div className="p-2 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2 text-xs">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-slate-400 text-[11px] shadow-inner">
                  Mensagem
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Test Trigger Button */}
            <div className="w-full mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={testSent}
                className="w-full py-2.5 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-300 shadow-xs"
              >
                {testSent ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Disparo de Teste Realizado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Testar Disparo Agora no Simulador</span>
                  </>
                )}
              </button>
              <div className="text-[11px] text-slate-500 text-center">
                Dispara um teste com os dados fictícios da paciente Helena Fontes
              </div>
            </div>
          </div>

          {/* Active Triggers Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Resumo da Régua de Notificações Ativa
            </h4>
            <div className="space-y-2">
              {settings.rules.map((r, i) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>{r.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.target_type === 'telemedicine'
                        ? 'Telemedicina'
                        : r.target_type === 'presential'
                        ? 'Presencial'
                        : 'Todas as consultas'}
                    </div>
                  </div>

                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                    {r.time_value}{' '}
                    {r.time_unit === 'minutes'
                      ? 'minutos antes'
                      : r.time_unit === 'hours'
                      ? 'horas antes'
                      : 'dias antes'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
