import React, { useState, useMemo } from 'react';
import {
  Clinic,
  User,
  Patient,
  FinancialTransaction,
  PaymentMethod,
  PaymentStatus,
  TransactionCategory,
  TransactionType,
} from '../../types/clinic';
import { Storage } from '../../lib/storage';
import { formatDateBR, formatDateTimeBR } from '../../lib/crypto';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  Filter,
  Search,
  Printer,
  FileSpreadsheet,
  FileJson,
  X,
  CreditCard,
  QrCode,
  Building,
  UserCheck,
  Calendar,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Receipt,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface FinancialManagementViewProps {
  clinic: Clinic;
  currentUser: User;
  users: User[];
  patients: Patient[];
  onSwitchToOwner?: () => void;
  onToast: (msg: string) => void;
}

export const FinancialManagementView: React.FC<FinancialManagementViewProps> = ({
  clinic,
  currentUser,
  users,
  patients,
  onSwitchToOwner,
  onToast,
}) => {
  const isOwner = currentUser.role === 'owner';

  // Transactions State
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() =>
    Storage.getFinancialTransactions()
  );

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // New Transaction Form State
  const [formType, setFormType] = useState<TransactionType>('receita');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('pix');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('pago');
  const [formCategory, setFormCategory] = useState<TransactionCategory>(
    'consulta_particular'
  );
  const [formPatientId, setFormPatientId] = useState('');
  const [formProfessionalId, setFormProfessionalId] = useState(currentUser.id);
  const [formConvenio, setFormConvenio] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (selectedMonth !== 'all') {
        const txMonth = tx.payment_date.slice(0, 7);
        if (txMonth !== selectedMonth) return false;
      }

      // Method filter
      if (filterMethod !== 'all' && tx.payment_method !== filterMethod) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && tx.status !== filterStatus) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const patientMatch = (tx.patient_name || '').toLowerCase().includes(q);
        const invoiceMatch = (tx.invoice_number || '').toLowerCase().includes(q);
        const convenioMatch = (tx.convenio_name || '').toLowerCase().includes(q);
        if (!descMatch && !patientMatch && !invoiceMatch && !convenioMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    selectedMonth,
    filterMethod,
    filterStatus,
    filterType,
    searchQuery,
  ]);

  // Cash flow totals
  const metrics = useMemo(() => {
    const list = selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.payment_date.slice(0, 7) === selectedMonth);

    let totalReceitasPagas = 0;
    let totalReceitasPendentes = 0;
    let totalDespesasPagas = 0;
    let totalGlosas = 0;

    let totalPix = 0;
    let totalConvenio = 0;
    let totalParticularCartao = 0;
    let totalParticularDinheiro = 0;
    let totalBoleto = 0;

    list.forEach((tx) => {
      if (tx.type === 'receita') {
        if (tx.status === 'pago') {
          totalReceitasPagas += tx.amount;
          if (tx.payment_method === 'pix') totalPix += tx.amount;
          if (tx.payment_method === 'convenio') totalConvenio += tx.amount;
          if (tx.payment_method === 'particular_cartao')
            totalParticularCartao += tx.amount;
          if (tx.payment_method === 'particular_dinheiro')
            totalParticularDinheiro += tx.amount;
          if (tx.payment_method === 'boleto') totalBoleto += tx.amount;
        } else if (tx.status === 'pendente') {
          totalReceitasPendentes += tx.amount;
        } else if (tx.status === 'glosado') {
          totalGlosas += tx.amount;
        }
      } else {
        if (tx.status === 'pago') {
          totalDespesasPagas += tx.amount;
        }
      }
    });

    const saldoLiquido = totalReceitasPagas - totalDespesasPagas;

    return {
      totalReceitasPagas,
      totalReceitasPendentes,
      totalDespesasPagas,
      totalGlosas,
      saldoLiquido,
      totalPix,
      totalConvenio,
      totalParticularCartao,
      totalParticularDinheiro,
      totalBoleto,
      totalEntradasRecebidas: totalReceitasPagas,
    };
  }, [transactions, selectedMonth]);

  // Handle Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0 || !formDescription.trim()) {
      alert('Informe uma descrição válida e um valor numérico positivo.');
      return;
    }

    const patient = patients.find((p) => p.id === formPatientId);
    const doctor = users.find((u) => u.id === formProfessionalId);

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      clinic_id: clinic.id,
      patient_id: patient?.id,
      patient_name: patient?.name,
      professional_id: doctor?.id,
      professional_name: doctor?.name,
      description: formDescription.trim(),
      category: formCategory,
      amount: amountVal,
      type: formType,
      payment_method: formMethod,
      status: formStatus,
      payment_date: new Date(formDate).toISOString(),
      convenio_name: formMethod === 'convenio' ? formConvenio : undefined,
      invoice_number: formInvoice.trim() || undefined,
      notes: formNotes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const updated = Storage.addFinancialTransaction(newTx);
    setTransactions(updated);
    setShowAddModal(false);

    // Reset Form
    setFormDescription('');
    setFormAmount('');
    setFormInvoice('');
    setFormNotes('');
    setFormConvenio('');

    // Audit log
    Storage.addAuditLog({
      id: `adt-fin-${Date.now()}`,
      record_id: newTx.id,
      patient_name: newTx.patient_name || 'Financeiro Geral',
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: `${currentUser.role.toUpperCase()} (Owner)`,
      action: 'CREATED',
      details: `Lançamento de ${newTx.type.toUpperCase()}: R$ ${newTx.amount.toFixed(2)} (${newTx.payment_method.toUpperCase()}) - ${newTx.description}`,
      ip_address: '189.102.44.12',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    onToast('Lançamento financeiro registrado com sucesso!');
  };

  // Toggle transaction status
  const handleToggleStatus = (tx: FinancialTransaction) => {
    const nextStatus: PaymentStatus =
      tx.status === 'pago' ? 'pendente' : 'pago';
    const updatedTx = { ...tx, status: nextStatus };
    const updated = Storage.updateFinancialTransaction(updatedTx);
    setTransactions(updated);
    onToast(`Status da transação alterado para ${nextStatus.toUpperCase()}.`);
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro financeiro?')) {
      const updated = Storage.deleteFinancialTransaction(id);
      setTransactions(updated);
      onToast('Transação financeira excluída.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Tipo',
      'Categoria',
      'Descricao',
      'Paciente',
      'Profissional',
      'Forma_Pagamento',
      'Convenio',
      'Valor_R$',
      'Status',
      'Nota_Fiscal',
    ];

    const rows = filteredTransactions.map((tx) => [
      formatDateBR(tx.payment_date),
      tx.type.toUpperCase(),
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.patient_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(tx.professional_name || 'N/A').replace(/"/g, '""')}"`,
      tx.payment_method.toUpperCase(),
      tx.convenio_name || 'N/A',
      tx.amount.toFixed(2).replace('.', ','),
      tx.status.toUpperCase(),
      tx.invoice_number || 'N/A',
    ]);

    const csvString = [headers.join(';'), ...rows.map((r) => r.join(';'))].join(
      '\n'
    );
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${clinic.slug}-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Audit log
    Storage.addAuditLog({
      id: `adt-exp-${Date.now()}`,
      record_id: 'relatorio-financeiro',
      patient_name: 'Faturamento Geral',
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: `${currentUser.role.toUpperCase()} (Owner)`,
      action: 'EXPORTED',
      details: `Exportação de Relatório Financeiro CSV do período ${selectedMonth}.`,
      ip_address: '189.102.44.12',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    onToast('Relatório de faturamento CSV exportado com sucesso!');
  };

  // If not owner, show restricted screen
  if (!isOwner) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            Acesso Restrito ao Gestor / Proprietário (Owner)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            A visualização de faturamento, conciliação de pagamentos PIX/Convênios e fluxo de caixa mensal é restrita ao perfil Owner da clínica (Dra. Mariana Costa) conforme a política de controle e segurança.
          </p>
        </div>

        {onSwitchToOwner && (
          <div className="pt-2">
            <button
              onClick={onSwitchToOwner}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Alternar para Dra. Mariana Costa (Owner)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Gestão Financeira & Faturamento
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  Acesso Owner
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de entradas (PIX, Convênio, Particular), saídas e fluxo de caixa da clínica
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-teal-600" />
            <span>Relatório & Fechamento</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Pagamento</span>
          </button>
        </div>
      </div>

      {/* Monthly Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700">Competência / Período:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500"
          >
            <option value="2026-09">Setembro / 2026 (Mês Atual)</option>
            <option value="2026-08">Agosto / 2026</option>
            <option value="2026-07">Julho / 2026</option>
            <option value="all">Todo o Histórico</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exibindo <strong>{filteredTransactions.length}</strong> lançamentos no período
        </div>
      </div>

      {/* KPI Cards: Cash Flow Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recebido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Faturamento Realizado (Entradas)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            R$ {metrics.totalReceitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">
            Pagamentos confirmados e liquidados
          </div>
        </div>

        {/* Pendentes / A Receber */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>A Receber (Convênios / Guias)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            R$ {metrics.totalReceitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">
            Previsão de repasse de operadoras
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Despesas Operacionais</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            R$ {metrics.totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">
            Custos fixos, insumos e locação
          </div>
        </div>

        {/* Saldo Líquido Operacional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Saldo Líquido em Caixa</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              metrics.saldoLiquido >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            R$ {metrics.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">
            Resultado operacional apurado
          </div>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-teal-600" />
          <span>Faturamento por Forma de Pagamento (Competência)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* PIX */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                PIX Instantâneo
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                {metrics.totalEntradasRecebidas > 0
                  ? Math.round(
                      (metrics.totalPix / metrics.totalEntradasRecebidas) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-800">
              R$ {metrics.totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-700/80">Liquidez imediata na conta</div>
          </div>

          {/* Convênios Médicos */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-700" />
                Convênios (Unimed / Bradesco)
              </span>
              <span className="text-[11px] font-semibold text-blue-700">
                {metrics.totalEntradasRecebidas > 0
                  ? Math.round(
                      (metrics.totalConvenio / metrics.totalEntradasRecebidas) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-blue-800">
              R$ {metrics.totalConvenio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-blue-700/80">Faturamento TISS / Lotes</div>
          </div>

          {/* Cartão de Crédito / Débito */}
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-700" />
                Particular (Cartão)
              </span>
              <span className="text-[11px] font-semibold text-indigo-700">
                {metrics.totalEntradasRecebidas > 0
                  ? Math.round(
                      (metrics.totalParticularCartao /
                        metrics.totalEntradasRecebidas) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-indigo-800">
              R$ {metrics.totalParticularCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-indigo-700/80">Crédito à vista ou parcelado</div>
          </div>

          {/* Dinheiro & Boleto */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-600" />
                Dinheiro / Boleto
              </span>
              <span className="text-[11px] font-semibold text-slate-600">
                {metrics.totalEntradasRecebidas > 0
                  ? Math.round(
                      ((metrics.totalParticularDinheiro + metrics.totalBoleto) /
                        metrics.totalEntradasRecebidas) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-800">
              R${' '}
              {(
                metrics.totalParticularDinheiro + metrics.totalBoleto
              ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500">Caixa balcão e bancário</div>
          </div>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, paciente, convênio ou nota fiscal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Method filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Todas as Formas de Pgto</option>
              <option value="pix">PIX</option>
              <option value="convenio">Convênio Médico</option>
              <option value="particular_cartao">Cartão de Crédito</option>
              <option value="particular_dinheiro">Dinheiro</option>
              <option value="boleto">Boleto Bancário</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="pago">Pago / Liquidado</option>
              <option value="pendente">Pendente</option>
              <option value="glosado">Glosado</option>
            </select>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Entradas & Saídas</option>
              <option value="receita">Somente Receitas</option>
              <option value="despesa">Somente Despesas</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição & Categoria</th>
                <th className="py-3 px-4">Paciente / Profissional</th>
                <th className="py-3 px-4">Forma de Pagamento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isReceita = tx.type === 'receita';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {formatDateBR(tx.payment_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{tx.category.replace(/_/g, ' ')}</span>
                          {tx.invoice_number && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[10px]">
                              {tx.invoice_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.patient_name ? (
                          <div className="font-medium text-slate-800">
                            {tx.patient_name}
                          </div>
                        ) : (
                          <span className="text-slate-400">Institucional / Despesa</span>
                        )}
                        {tx.professional_name && (
                          <div className="text-[10px] text-slate-500">
                            Médico(a): {tx.professional_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.payment_method === 'pix' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <QrCode className="w-3 h-3" /> PIX
                          </span>
                        )}
                        {tx.payment_method === 'convenio' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Building className="w-3 h-3" /> {tx.convenio_name || 'Convênio'}
                          </span>
                        )}
                        {tx.payment_method === 'particular_cartao' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <CreditCard className="w-3 h-3" /> Cartão
                          </span>
                        )}
                        {tx.payment_method === 'particular_dinheiro' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Receipt className="w-3 h-3" /> Dinheiro
                          </span>
                        )}
                        {tx.payment_method === 'boleto' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            Boleto
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isReceita ? 'text-emerald-700' : 'text-rose-600'
                          }
                        >
                          {isReceita ? '+ ' : '- '}
                          R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === 'pago'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'pendente'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tx)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-teal-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                            title="Alternar entre Pago e Pendente"
                          >
                            Alternar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Excluir lançamento"
                          >
                            <X className="w-3.5 h-3.5" />
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

      {/* MODAL: REGISTRAR NOVO PAGAMENTO / RECEBIMENTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Novo Lançamento Financeiro
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5">
              {/* Type selector: Receita vs Despesa */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormType('receita')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    formType === 'receita'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Receita / Entrada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('despesa')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    formType === 'despesa'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Despesa / Saída</span>
                </button>
              </div>

              {/* Description and Amount */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descrição do Lançamento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Consulta Cardiológica, Procedimento..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="350,00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="pix">PIX Instantâneo</option>
                    <option value="convenio">Convênio Médico (TISS)</option>
                    <option value="particular_cartao">Cartão de Crédito/Débito</option>
                    <option value="particular_dinheiro">Dinheiro (Em espécie)</option>
                    <option value="boleto">Boleto Bancário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status de Liquidação
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="pago">Liquidado / Pago</option>
                    <option value="pendente">Pendente / A Receber</option>
                    <option value="glosado">Glosado pelo Convênio</option>
                  </select>
                </div>
              </div>

              {/* If Convênio: Specify operator name */}
              {formMethod === 'convenio' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operadora do Convênio
                  </label>
                  <select
                    value={formConvenio}
                    onChange={(e) => setFormConvenio(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Selecione a Operadora</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Bradesco Saúde">Bradesco Saúde</option>
                    <option value="Amil">Amil</option>
                    <option value="SulAmérica">SulAmérica</option>
                    <option value="NotreDame Intermédica">NotreDame Intermédica</option>
                    <option value="Outro Convênio">Outro Convênio</option>
                  </select>
                </div>
              )}

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="consulta_particular">Consulta Particular</option>
                    <option value="repasse_convenio">Repasse de Convênio</option>
                    <option value="teleconsulta">Telemedicina</option>
                    <option value="procedimento">Procedimento / Exame</option>
                    <option value="custo_operacional">Custo Operacional</option>
                    <option value="honorarios_medicos">Honorários Médicos</option>
                    <option value="insumos_medicamentos">Insumos e Medicamentos</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Patient and Professional linkage */}
              {formType === 'receita' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paciente Vinculado (Opcional)
                    </label>
                    <select
                      value={formPatientId}
                      onChange={(e) => setFormPatientId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">Nenhum (Avulso)</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.cpf})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Profissional
                    </label>
                    <select
                      value={formProfessionalId}
                      onChange={(e) => setFormProfessionalId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Invoice number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Recibo / Nota Fiscal (NFS-e)
                </label>
                <input
                  type="text"
                  placeholder="Ex: NFS-2026-0899 ou Guia 784910"
                  value={formInvoice}
                  onChange={(e) => setFormInvoice(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {/* Action Buttons */}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RELATÓRIO OFICIAL DE FECHAMENTO & FATURAMENTO */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Demonstrativo de Faturamento & Fechamento Financeiro
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Report Sheet */}
            <div className="space-y-6 text-xs text-slate-800 font-sans">
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
                    {clinic.name}
                  </h1>
                  <p className="text-slate-600 text-[11px]">
                    CNPJ: {clinic.document_cnpj_cpf} · Gestão Financeira
                  </p>
                  <p className="text-slate-500 text-[11px]">{clinic.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200 inline-block">
                    Fechamento de Competência
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Período: {selectedMonth === 'all' ? 'Histórico Completo' : selectedMonth}
                  </div>
                </div>
              </div>

              {/* DRE Simplificado */}
              <div className="space-y-2">
                <div className="font-bold uppercase text-[11px] text-slate-400">
                  Demonstrativo Consolidado de Resultados (DRE)
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="font-sans font-semibold">(+) Faturamento Bruto Realizado</span>
                    <strong className="text-emerald-700">
                      R$ {metrics.totalReceitasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="font-sans font-semibold">(+) Receitas a Receber (Convênios)</span>
                    <strong className="text-amber-600">
                      R$ {metrics.totalReceitasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-rose-700">
                    <span className="font-sans font-semibold">(-) Despesas Operacionais e Insumos</span>
                    <strong>
                      - R$ {metrics.totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-rose-700">
                    <span className="font-sans font-semibold">(-) Glosas de Convênio</span>
                    <strong>
                      - R$ {metrics.totalGlosas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t-2 border-slate-300">
                    <span className="font-sans">(=) Resultado Líquido Operacional</span>
                    <strong className={metrics.saldoLiquido >= 0 ? 'text-teal-700' : 'text-rose-600'}>
                      R$ {metrics.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Assinatura do Responsável Técnico */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  Responsável Técnico: <strong>{currentUser.name}</strong> ({currentUser.professional_council || 'CRM'}/SP)
                </div>
                <div>
                  Emitido em: {formatDateTimeBR(new Date().toISOString())}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  Storage.addAuditLog({
                    id: `adt-rep-${Date.now()}`,
                    record_id: 'fechamento-mensal',
                    patient_name: 'Fechamento Financeiro',
                    user_id: currentUser.id,
                    user_name: currentUser.name,
                    user_role: `${currentUser.role.toUpperCase()} (Owner)`,
                    action: 'EXPORTED',
                    details: `Impressão de Demonstrativo de Fechamento Financeiro - Período ${selectedMonth}.`,
                    ip_address: '189.102.44.12',
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                  });
                  onToast('Relatório de faturamento impresso com registro na auditoria.');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
