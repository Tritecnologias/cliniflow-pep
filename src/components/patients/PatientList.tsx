import React, { useState } from 'react';
import { Patient, Clinic, User } from '../../types/clinic';
import {
  Users,
  Plus,
  Search,
  FileText,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  ShieldAlert,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Download,
  Eye,
} from 'lucide-react';
import {
  formatCPF,
  formatPhone,
  calculateAge,
  formatDateBR,
} from '../../lib/crypto';
import { LGPDPatientExportModal } from './LGPDPatientExportModal';
import { PatientOverviewModal } from './PatientOverviewModal';

interface PatientListProps {
  patients: Patient[];
  clinic: Clinic;
  currentUser: User;
  onAddPatient: (patient: Patient) => void;
  onSelectPatientPEP: (patient: Patient) => void;
  onOpenPlanModal: () => void;
  onDeletePatient?: (id: string) => void;
  onExportLGPDSuccess?: (msg: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  clinic,
  currentUser,
  onAddPatient,
  onSelectPatientPEP,
  onOpenPlanModal,
  onDeletePatient,
  onExportLGPDSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLGPDModal, setShowLGPDModal] = useState(false);
  const [selectedLGPDExportPatient, setSelectedLGPDExportPatient] =
    useState<Patient | null>(null);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [selectedOverviewPatient, setSelectedOverviewPatient] =
    useState<Patient | null>(null);

  // New patient form fields
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [insurance, setInsurance] = useState('Particular');
  const [insuranceCard, setInsuranceCard] = useState('');
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('O+');

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cpf.includes(searchQuery) ||
      p.health_insurance.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFreePlan = clinic.plan === 'free';
  const hasReachedQuota = isFreePlan && patients.length >= 20;

  const handleOpenAddModal = () => {
    if (hasReachedQuota) {
      onOpenPlanModal();
    } else {
      setShowAddModal(true);
    }
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      clinic_id: clinic.id,
      name,
      cpf: formatCPF(cpf),
      birth_date: birthDate,
      phone: phone.replace(/\D/g, ''),
      email,
      health_insurance: insurance,
      insurance_card_number: insuranceCard,
      allergies,
      blood_type: bloodType,
      created_at: new Date().toISOString(),
    };

    onAddPatient(newPatient);
    setShowAddModal(false);
    // Reset form
    setName('');
    setCpf('');
    setPhone('');
    setEmail('');
    setInsurance('Particular');
    setInsuranceCard('');
    setAllergies('');
  };

  return (
    <div className="space-y-6">
      {/* Title & Quota Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Cadastro & Base de Pacientes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dados cadastrais e histórico de prontuários com conformidade LGPD
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Quota counter button */}
          <button
            onClick={onOpenPlanModal}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              hasReachedQuota
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {patients.length} / {isFreePlan ? '20' : '∞'} Pacientes Cadastrados
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedLGPDExportPatient(patients[0] || null);
              setShowLGPDModal(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            title="Exportar dossiê completo de dados de pacientes (Art. 18, V - LGPD)"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Portabilidade LGPD</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Quota Alert Banner if near or at limit */}
      {hasReachedQuota && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Limite de 20 pacientes atingido no Plano Gratuito.</strong>{' '}
              Faça o upgrade para o Plano Básico ou Pro para cadastros ilimitados.
            </span>
          </div>
          <button
            onClick={onOpenPlanModal}
            className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors shrink-0 text-center"
          >
            Ver Planos
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nome, CPF ou convênio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Patients Container: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* ── Mobile Card List (< md) ────────────────────────────── */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPatients.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhum paciente cadastrado correspondente à busca.
            </div>
          ) : (
            filteredPatients.map((p) => (
              <div key={p.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                {/* Header: Avatar, Name, CPF, Age, Insurance */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-sm font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOverviewPatient(p);
                          setShowOverviewModal(true);
                        }}
                        className="font-bold text-slate-900 text-sm text-left hover:text-teal-700 transition-colors truncate block"
                      >
                        {p.name}
                      </button>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{p.cpf || '--'}</span>
                        <span>·</span>
                        <span>{p.birth_date ? `${calculateAge(p.birth_date)} anos` : '--'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {p.health_insurance}
                  </span>
                </div>

                {/* Allergy alert if present */}
                {p.allergies && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate"><strong>Alergias:</strong> {p.allergies}</span>
                  </div>
                )}

                {/* Contact & WhatsApp */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <a
                    href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 font-medium hover:underline text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatPhone(p.phone)}</span>
                  </a>

                  {onDeletePatient && currentUser.role === 'owner' && (
                    <button
                      onClick={() => onDeletePatient(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remover paciente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Thumb Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  {currentUser.role !== 'receptionist' ? (
                    <button
                      onClick={() => onSelectPatientPEP(p)}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Abrir PEP</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOverviewPatient(p);
                      setShowOverviewModal(true);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <Eye className="w-4 h-4 text-teal-600" />
                    <span>Visão 360°</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Desktop Data Table (>= md) ─────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nome do Paciente</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Idade</th>
                <th className="py-3 px-4">Contato (WhatsApp)</th>
                <th className="py-3 px-4">Convênio</th>
                <th className="py-3 px-4">Alergias</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum paciente cadastrado correspondente à busca.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOverviewPatient(p);
                          setShowOverviewModal(true);
                        }}
                        className="font-bold text-slate-900 hover:text-teal-700 text-left transition-colors flex items-center gap-2 group"
                        title="Ver Visão 360° do Paciente (Próximas consultas, alergias, medicações e documentos)"
                      >
                        <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-2xs">
                          {p.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="group-hover:underline">{p.name}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {p.cpf || '--'}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                      {p.birth_date ? `${calculateAge(p.birth_date)} anos` : '--'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {formatPhone(p.phone)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-800 font-medium">
                        {p.health_insurance}
                      </span>
                      {p.insurance_card_number && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Nº {p.insurance_card_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.allergies ? (
                        <span className="text-rose-600 font-medium">
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">Nenhuma</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOverviewPatient(p);
                            setShowOverviewModal(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          title="Visão 360° do Paciente (Próximas consultas, alergias, medicações e documentos assinados)"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Visão 360°</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLGPDExportPatient(p);
                            setShowLGPDModal(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-white hover:bg-teal-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          title="Portabilidade LGPD (Art. 18, V) - Exportar histórico completo deste paciente"
                        >
                          <Download className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Portabilidade LGPD</span>
                        </button>

                        {currentUser.role !== 'receptionist' && (
                          <button
                            onClick={() => onSelectPatientPEP(p)}
                            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>Abrir Prontuário</span>
                          </button>
                        )}
                        {onDeletePatient && currentUser.role === 'owner' && (
                          <button
                            onClick={() => onDeletePatient(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="Remover paciente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Cadastro de Novo Paciente</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="paciente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Convênio / Plano de Saúde
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Unimed, Bradesco ou Particular"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº da Carteirinha (se houver)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 01294810294"
                    value={insuranceCard}
                    onChange={(e) => setInsuranceCard(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alergias Medicamentosas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alergia a Dipirona e Penicilina"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Salvar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LGPD PATIENT DATA PORTABILITY MODAL */}
      {showLGPDModal && selectedLGPDExportPatient && (
        <LGPDPatientExportModal
          isOpen={showLGPDModal}
          onClose={() => setShowLGPDModal(false)}
          patient={selectedLGPDExportPatient}
          patients={patients}
          onSelectPatient={(p) => setSelectedLGPDExportPatient(p)}
          clinic={clinic}
          currentUser={currentUser}
          onExportSuccess={(msg) => {
            if (onExportLGPDSuccess) {
              onExportLGPDSuccess(msg);
            }
          }}
        />
      )}

      {/* PATIENT 360° OVERVIEW MODAL */}
      {showOverviewModal && selectedOverviewPatient && (
        <PatientOverviewModal
          isOpen={showOverviewModal}
          onClose={() => setShowOverviewModal(false)}
          patient={selectedOverviewPatient}
          clinic={clinic}
          currentUser={currentUser}
          onOpenPEP={(p) => {
            setShowOverviewModal(false);
            onSelectPatientPEP(p);
          }}
          onOpenLGPDExport={(p) => {
            setShowOverviewModal(false);
            setSelectedLGPDExportPatient(p);
            setShowLGPDModal(true);
          }}
        />
      )}
    </div>
  );
};
