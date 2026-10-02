import React from 'react';
import { Clinic, ClinicPlan } from '../../types/clinic';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  Users,
  CreditCard,
  Building,
} from 'lucide-react';

interface FreemiumPlanModalProps {
  clinic: Clinic;
  patientCount: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (plan: ClinicPlan) => void;
}

export const FreemiumPlanModal: React.FC<FreemiumPlanModalProps> = ({
  clinic,
  patientCount,
  isOpen,
  onClose,
  onUpdatePlan,
}) => {
  if (!isOpen) return null;

  const maxFree = 20;
  const percentage = Math.min(100, Math.round((patientCount / maxFree) * 100));

  const plans = [
    {
      id: 'free' as ClinicPlan,
      name: 'Gratuito',
      audience: 'Para consultórios em início',
      price: 'R$ 0',
      period: '/mês vitalício',
      description: 'Até 20 pacientes ativos. Ideal para testar sem cartão de crédito.',
      features: [
        'Até 20 pacientes cadastrados',
        'Agenda com lembretes WhatsApp',
        'Prontuário Eletrônico (PEP) básico',
        'Portal de agendamento online público',
        '1 profissional de saúde',
      ],
      current: clinic.plan === 'free',
      actionText: 'Plano Atual',
      badge: 'Modelo Freemium',
    },
    {
      id: 'basic' as ClinicPlan,
      name: 'Básico',
      audience: 'Para consultório individual ativo',
      price: 'R$ 79',
      period: '/mês',
      description: 'Pacientes ilimitados e telemedicina para profissionais autônomos.',
      features: [
        'Pacientes ilimitados',
        'Até 3 profissionais de saúde',
        'PEP dinâmico por especialidade (JSONB)',
        'Busca CID-10 integrada',
        'Telemedicina com sala virtual',
        'Disparo de WhatsApp integrado',
      ],
      current: clinic.plan === 'basic',
      actionText: 'Migrar para Básico',
    },
    {
      id: 'pro' as ClinicPlan,
      name: 'Profissional',
      audience: 'Para clínicas multidisciplinares',
      price: 'R$ 149',
      period: '/mês',
      popular: true,
      description: 'Conformidade total CFM/LGPD, assinatura digital ICP-Brasil e multi-usuários.',
      features: [
        'Pacientes e agendamentos ilimitados',
        'Profissionais ilimitados com RBAC',
        'Assinatura Digital ICP-Brasil (PAdES/SHA-256)',
        'Trilha de Auditoria Imutável CFM/LGPD',
        'Odontograma & Anamnese multidisciplinar',
        'Disparo automatizado de WhatsApp com confirmação 1-clique',
        'Relatórios de faturamento e produtividade',
      ],
      current: clinic.plan === 'pro',
      actionText: 'Ativar Plano Pro',
      badge: 'Recomendado',
    },
    {
      id: 'enterprise' as ClinicPlan,
      name: 'Enterprise',
      audience: 'Redes e policlínicas',
      price: 'R$ 349',
      period: '/mês',
      description: 'Múltiplas filiais, API própria de WhatsApp e suporte 24/7.',
      features: [
        'Tudo do Plano Pro',
        'Múltiplas unidades (Multi-tenant avançado)',
        'WhatsApp API oficial (Meta Cloud API)',
        'Exportação contínua de prontuários em lote',
        'SLA de atendimento de 1 hora',
      ],
      current: clinic.plan === 'enterprise',
      actionText: 'Falar com Consultor',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Modelo de Aquisição Freemium
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Planos & Capacidade da Clínica
            </h2>
            <p className="text-xs text-slate-500">
              Cresça sem barreiras: comece gratuito e evolua conforme sua clínica expande.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current quota progress banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-teal-50/30 to-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Uso Atual do Limite Gratuito
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span className="tabular-nums font-mono text-base">
                    {patientCount}
                  </span>{' '}
                  de {maxFree} pacientes ativos cadastrados ({percentage}%)
                </div>
              </div>

              {clinic.plan === 'free' ? (
                <div className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 self-start sm:self-auto font-medium">
                  {maxFree - patientCount > 0
                    ? `Restam ${maxFree - patientCount} cadastros gratuitos`
                    : 'Limite gratuito atingido! Faça upgrade para continuar cadastrando.'}
                </div>
              ) : (
                <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Plano {clinic.plan.toUpperCase()} ativo (Pacientes Ilimitados)
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentage >= 90
                    ? 'bg-amber-500'
                    : percentage >= 100
                    ? 'bg-rose-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const isSelected = p.current;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                    p.popular
                      ? 'border-teal-500 shadow-md ring-1 ring-teal-500/30 bg-teal-50/10'
                      : isSelected
                      ? 'border-slate-800 bg-slate-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {p.name}
                      </span>
                      {p.badge && (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                        {p.price}
                      </span>
                      <span className="text-xs text-slate-500">{p.period}</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 min-h-[32px] leading-relaxed">
                      {p.description}
                    </p>

                    <div className="border-t border-slate-100 pt-3 space-y-2 mb-4">
                      {p.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700"
                        >
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onUpdatePlan(p.id);
                        onClose();
                      }}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-200 text-slate-700 cursor-default'
                          : p.popular
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Plano Ativo</span>
                        </>
                      ) : (
                        <span>{p.actionText}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee / Legal note */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <strong>Segurança e Garantia CFM / LGPD:</strong> Todos os planos incluem
              criptografia de ponta a ponta, backups automáticos diários e conformidade
              integral com a Resolução CFM nº 1.821/2007 para prontuários eletrônicos.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
