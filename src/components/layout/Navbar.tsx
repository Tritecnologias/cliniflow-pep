import React, { useState } from 'react';
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
  Menu,
  X,
  UserCheck,
  Layers,
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, category: 'Gestão' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, category: 'Atendimento' },
    { id: 'queue', label: 'Fila de Espera', icon: Clock, category: 'Atendimento' },
    { id: 'reminders', label: 'Lembretes WPP', icon: Bell, category: 'Comunicação' },
    { id: 'patients', label: 'Pacientes', icon: Users, category: 'Clínica' },
    { id: 'pep', label: 'Prontuários', icon: FileText, category: 'Clínica' },
    { id: 'templates', label: 'Modelos', icon: FileCheck, category: 'Clínica' },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, badge: 'Owner', category: 'Gestão' },
    { id: 'audit', label: 'Auditoria CFM', icon: ShieldCheck, category: 'Conformidade' },
    { id: 'public-portal', label: 'Portal Público', icon: Globe, category: 'Comunicação' },
  ];

  // Core navigation items for Mobile Bottom Bar (Thumb Zone)
  const bottomNavItems = [
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'queue', label: 'Fila', icon: Clock },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'pep', label: 'PEP', icon: FileText },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setShowMobileDrawer(false);
  };

  return (
    <>
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Clinic Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleTabClick('agenda')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105 shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  CliniFlow<span className="text-teal-600">PEP</span>
                </span>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-none">
                  {clinic.name}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links (>= lg) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
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

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Freemium Quota Trigger */}
            <button
              onClick={onOpenPlanModal}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium rounded-md border transition-colors ${
                clinic.plan === 'free'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
              }`}
              title="Ver planos e consumo de pacientes"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">
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
              <span className="sm:hidden font-semibold tabular-nums text-[11px]">
                {clinic.plan === 'free' ? `${patientCount}/20` : 'PRO'}
              </span>
            </button>

            {/* Desktop RBAC Switcher Dropdown (>= lg) */}
            <div className="relative hidden lg:block">
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
                <div className="text-left max-w-[120px] truncate">
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

            {/* Mobile Menu Hamburger Button (< lg) */}
            <button
              onClick={() => setShowMobileDrawer(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-Over Drawer (< lg) ───────────────────────── */}
      {showMobileDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    CliniFlow<span className="text-teal-600">PEP</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                    {clinic.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active User Card & Quick Role Switcher */}
            <div className="p-4 border-b border-slate-100 bg-teal-50/30">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center justify-between">
                <span>Perfil Ativo (RBAC)</span>
                <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                  {activeUser.role.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0 ${
                    activeUser.avatar_color || 'bg-slate-700'
                  }`}
                >
                  {activeUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-xs truncate">
                    {activeUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {activeUser.specialty || activeUser.email}
                  </div>
                </div>
              </div>

              {/* Quick RBAC Switch Buttons */}
              <div className="grid grid-cols-3 gap-1">
                {users.slice(0, 3).map((u) => {
                  const isSelected = u.id === activeUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser(u)}
                      className={`py-1 px-1.5 rounded text-[10px] font-semibold truncate transition-colors text-center border ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title={u.name}
                    >
                      {u.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Quota Mini-card */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Plano Atual:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {clinic.plan}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Consumo:</span>
                <span className="font-semibold text-slate-800">
                  {patientCount} / {clinic.plan === 'free' ? '20' : '∞'} pacientes
                </span>
              </div>
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  onOpenPlanModal();
                }}
                className="mt-2 w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-teal-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver Planos & Upgrade</span>
              </button>
            </div>

            {/* Navigation Links Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Menu Principal
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100/80 active:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowMobileDrawer(false);
                  onResetDemo();
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 rounded-lg hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Dados Originais de Teste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (< lg) ───────────────────── */}
      {/* Fixa no rodapé para navegação confortável com uma mão */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg pb-safe">
        <div className="grid grid-cols-5 items-center">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-manipulation min-h-[48px] ${
                  isActive
                    ? 'text-teal-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 active:scale-95'
                }`}
              >
                <div
                  className={`relative p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-teal-50 text-teal-600' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Tab 5: "Mais" / Menu que abre a gaveta */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all touch-manipulation min-h-[48px] ${
              !bottomNavItems.some((b) => b.id === activeTab)
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 active:scale-95'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                !bottomNavItems.some((b) => b.id === activeTab)
                  ? 'bg-teal-50 text-teal-600'
                  : ''
              }`}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};

