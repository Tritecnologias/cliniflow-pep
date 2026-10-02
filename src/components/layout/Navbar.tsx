import React from 'react';
import {
  User,
  Clinic,
} from '../../types/clinic';
import {
  Activity,
  Calendar,
  Clock,
  Users,
  FileText,
  ShieldCheck,
  Globe,
  Sparkles,
  ChevronDown,
  RotateCcw,
  BarChart3,
  Bell,
  FileCheck,
  DollarSign,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clinic: Clinic;
  users: User[];
  activeUser: User;
  onSwitchUser: (user: User) => void;
  patientCount: number;
  onOpenPlanModal: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clinic,
  users,
  activeUser,
  onSwitchUser,
  patientCount,
  onOpenPlanModal,
  onResetDemo,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'queue', label: 'Fila de Espera', icon: Clock },
    { id: 'reminders', label: 'Lembretes WPP', icon: Bell },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'pep', label: 'Prontuários', icon: FileText },
    { id: 'templates', label: 'Modelos', icon: FileCheck },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, badge: 'Owner' },
    { id: 'audit', label: 'Auditoria CFM', icon: ShieldCheck },
    { id: 'public-portal', label: 'Portal Público', icon: Globe },
  ];

  const quotaPercent = Math.min(100, Math.round((patientCount / 20) * 100));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Zone 1: Single element wordmark with domain mark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('agenda')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                CliniFlow<span className="text-teal-600">PEP</span>
              </span>
              <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-none">
                {clinic.name}
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-teal-700 bg-teal-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions (Plan quota trigger + RBAC Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Freemium Quota Button */}
          <button
            onClick={onOpenPlanModal}
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              clinic.plan === 'free'
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
            }`}
            title="Ver planos e consumo de pacientes"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {clinic.plan === 'free' ? (
                <>
                  Plano Free <span className="text-slate-400">·</span>{' '}
                  <strong className="font-semibold tabular-nums">
                    {patientCount}/20
                  </strong>{' '}
                  pacientes
                </>
              ) : (
                <>
                  Plano {clinic.plan.toUpperCase()}{' '}
                  <span className="text-slate-400">·</span> Ilimitado
                </>
              )}
            </span>
          </button>

          {/* Quick RBAC User Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-lg text-xs font-medium transition-colors border border-slate-200 focus:outline-none"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
                  activeUser.avatar_color || 'bg-slate-700'
                }`}
              >
                {activeUser.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block max-w-[120px] truncate">
                <div className="leading-tight truncate font-semibold text-slate-900">
                  {activeUser.name}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {activeUser.role === 'owner'
                    ? 'Gestor / Médico'
                    : activeUser.role === 'doctor'
                    ? activeUser.professional_council || 'Profissional'
                    : 'Recepção'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-900">
                    Alternar Perfil de Acesso (RBAC)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Simule a experiência de cada função na clínica
                  </div>
                </div>

                <div className="py-1">
                  {users.map((u) => {
                    const isSelected = u.id === activeUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => onSwitchUser(u)}
                        className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-teal-50/70' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${
                            u.avatar_color || 'bg-slate-700'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-900 flex items-center justify-between">
                            <span className="truncate">{u.name}</span>
                            {isSelected && (
                              <span className="text-[10px] text-teal-600 font-bold ml-1">
                                Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {u.role === 'owner'
                              ? 'Owner (Acesso Total + Faturamento)'
                              : u.role === 'doctor'
                              ? `${u.professional_council}/${u.council_uf} ${u.council_number} · ${u.specialty}`
                              : 'Recepcionista (Sem acesso a prontuário)'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 mt-1 pt-1.5 px-3">
                  <button
                    onClick={onResetDemo}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Dados Originais de Teste</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="lg:hidden border-t border-slate-200 bg-slate-50/80 px-2 py-1.5 flex items-center justify-between overflow-x-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                isActive
                  ? 'text-teal-800 bg-teal-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
