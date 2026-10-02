import React, { useState } from 'react';
import { MedicalRecord, Patient, User, Clinic } from '../../types/clinic';
import {
  FileText,
  Lock,
  Search,
  Plus,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Stethoscope,
  Eye,
  Edit3,
  Download,
} from 'lucide-react';
import { formatDateBR } from '../../lib/crypto';
import { Storage } from '../../lib/storage';
import { LGPDPatientExportModal } from '../patients/LGPDPatientExportModal';
import { PatientOverviewModal } from '../patients/PatientOverviewModal';

interface PEPListViewProps {
  records: MedicalRecord[];
  patients: Patient[];
  users: User[];
  currentUser: User;
  onOpenRecord: (record: MedicalRecord) => void;
  onNewRecord: () => void;
  clinic?: Clinic;
  onExportSuccess?: (msg: string) => void;
}

export const PEPListView: React.FC<PEPListViewProps> = ({
  records,
  patients,
  users,
  currentUser,
  onOpenRecord,
  onNewRecord,
  clinic,
  onExportSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSigned, setFilterSigned] = useState<'all' | 'signed' | 'draft'>('all');
  const [showLGPDModal, setShowLGPDModal] = useState(false);
  const [selectedLGPDExportPatient, setSelectedLGPDExportPatient] =
    useState<Patient | null>(null);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [selectedOverviewPatient, setSelectedOverviewPatient] =
    useState<Patient | null>(null);

  const currentClinic = clinic || Storage.getClinic();

  const filteredRecords = records.filter((rec) => {
    const patient = patients.find((p) => p.id === rec.patient_id);
    const doctor = users.find((u) => u.id === rec.professional_id);

    const matchesSearch =
      (patient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.diagnosis_cid10 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.diagnosis_description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterSigned === 'all'
        ? true
        : filterSigned === 'signed'
        ? rec.is_signed
        : !rec.is_signed;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>Prontuários Eletrônicos (PEP)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico clínico, evoluções dinâmicas (JSONB), CID-10 e assinaturas ICP-Brasil
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedLGPDExportPatient(patients[0] || null);
              setShowLGPDModal(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            title="Exportar dossiê completo de dados de pacientes (Art. 18, V - LGPD)"
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Portabilidade LGPD</span>
          </button>

          {currentUser.role !== 'receptionist' && (
            <button
              onClick={onNewRecord}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Registro / Consulta</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, CID-10 ou médico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setFilterSigned('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterSigned === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({records.length})
          </button>
          <button
            onClick={() => setFilterSigned('signed')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterSigned === 'signed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assinados ICP ({records.filter((r) => r.is_signed).length})
          </button>
          <button
            onClick={() => setFilterSigned('draft')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              filterSigned === 'draft'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rascunhos ({records.filter((r) => !r.is_signed).length})
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data do Atendimento</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Profissional Responsável</th>
                <th className="py-3 px-4">Diagnóstico (CID-10)</th>
                <th className="py-3 px-4">Status da Assinatura</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum prontuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const patient = patients.find((p) => p.id === rec.patient_id);
                  const doctor = users.find((u) => u.id === rec.professional_id);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatDateBR(rec.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {patient ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOverviewPatient(patient);
                              setShowOverviewModal(true);
                            }}
                            className="font-bold text-slate-900 hover:text-teal-700 text-left transition-colors flex items-center gap-1.5 group"
                            title="Ver Visão 360° do Paciente"
                          >
                            <span className="group-hover:underline">{patient.name}</span>
                          </button>
                        ) : (
                          <span>Paciente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {doctor?.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {doctor?.specialty}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.diagnosis_cid10 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              {rec.diagnosis_cid10}
                            </span>
                            <span className="text-slate-600 truncate max-w-xs">
                              {rec.diagnosis_description}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Não classificado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.is_signed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ICP-Brasil Assinado</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">
                            Rascunho não assinado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (patient) {
                                setSelectedOverviewPatient(patient);
                                setShowOverviewModal(true);
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
                            title="Visão 360° do Paciente (Próximas consultas, alergias, medicações e documentos assinados)"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span className="hidden sm:inline">360°</span>
                          </button>

                          <button
                            onClick={() => {
                              if (patient) {
                                setSelectedLGPDExportPatient(patient);
                                setShowLGPDModal(true);
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-white hover:bg-teal-50 border border-slate-200 rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
                            title="Portabilidade LGPD (Art. 18, V) - Exportar histórico completo do paciente"
                          >
                            <Download className="w-3.5 h-3.5 text-teal-600" />
                            <span className="hidden sm:inline">LGPD</span>
                          </button>

                          <button
                            onClick={() => onOpenRecord(rec)}
                            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>{rec.is_signed ? 'Visualizar' : 'Editar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LGPD PATIENT DATA PORTABILITY MODAL */}
      {showLGPDModal && selectedLGPDExportPatient && (
        <LGPDPatientExportModal
          isOpen={showLGPDModal}
          onClose={() => setShowLGPDModal(false)}
          patient={selectedLGPDExportPatient}
          patients={patients}
          onSelectPatient={(p) => setSelectedLGPDExportPatient(p)}
          clinic={currentClinic}
          currentUser={currentUser}
          onExportSuccess={(msg) => {
            if (onExportSuccess) {
              onExportSuccess(msg);
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
          clinic={currentClinic}
          currentUser={currentUser}
          onOpenPEP={(p) => {
            setShowOverviewModal(false);
            const foundRec = records.find((r) => r.patient_id === p.id);
            if (foundRec) {
              onOpenRecord(foundRec);
            }
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
