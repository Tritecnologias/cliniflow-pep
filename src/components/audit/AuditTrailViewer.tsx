import React, { useState } from 'react';
import { MedicalAuditTrail, AuditAction } from '../../types/clinic';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  FileText,
  Eye,
  FileCheck,
  Download,
  AlertCircle,
} from 'lucide-react';
import { formatDateTimeBR } from '../../lib/crypto';

interface AuditTrailViewerProps {
  logs: MedicalAuditTrail[];
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesQuery =
      (log.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.includes(searchQuery);
    return matchesAction && matchesQuery;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'SIGNED':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Assinatura Digital</span>
          </span>
        );
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold text-xs">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Criação de Registro</span>
          </span>
        );
      case 'EXPORTED':
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold text-xs">
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Exportação / Impressão</span>
          </span>
        );
      case 'VIEWED':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold text-xs">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Visualização de PEP</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & CFM/LGPD Compliance banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Trilha de Auditoria Imutável (CFM nº 1.821 & LGPD)
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Registro cronológico inalterável de todas as ações executadas sobre o
            Prontuário Eletrônico do Paciente. Atende aos requisitos legais do
            Conselho Federal de Medicina e da Autoridade Nacional de Proteção de
            Dados (ANPD).
          </p>
        </div>

        <div className="text-right self-start md:self-auto shrink-0">
          <div className="text-xs font-mono font-bold text-slate-900">
            {logs.length} eventos auditados
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 justify-end mt-0.5">
            <Lock className="w-3 h-3" />
            <span>Log Criptografado & Selado</span>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, profissional, IP ou ação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Action filter segmented buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'SIGNED', label: 'Assinados' },
            { id: 'CREATED', label: 'Criados' },
            { id: 'EXPORTED', label: 'Exportados' },
            { id: 'VIEWED', label: 'Visualizados' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterAction(btn.id)}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                filterAction === btn.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Profissional / Papel</th>
                <th className="py-3 px-4">Detalhes do Evento</th>
                <th className="py-3 px-4 text-right">IP & Navegador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado para o filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600">
                      {formatDateTimeBR(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.patient_name || 'Paciente Geral'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {log.user_name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {log.user_role}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {log.details || 'Operação realizada com sucesso.'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-mono tabular-nums text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {log.ip_address}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
