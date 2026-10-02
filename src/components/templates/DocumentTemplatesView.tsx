import React, { useState, useMemo, useRef } from 'react';
import {
  DocumentTemplate,
  DocumentTemplateCategory,
  ProfessionalCouncil,
  Clinic,
  User,
  Patient,
  CID10Item,
} from '../../types/clinic';
import { COMMON_CID10_LIST } from '../../data/mockData';
import {
  AVAILABLE_PLACEHOLDERS,
  resolveTemplatePlaceholders,
  extractPlaceholders,
  TemplateContext,
} from '../../lib/templateEngine';
import {
  FileText,
  FileCheck,
  Plus,
  Search,
  Filter,
  Copy,
  Edit3,
  Trash2,
  Printer,
  Eye,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Clock,
  User as UserIcon,
  Tag,
  RotateCcw,
  Download,
  CheckCircle2,
  Layers,
  HelpCircle,
  Stethoscope,
  Building2,
  FileSignature,
} from 'lucide-react';

interface DocumentTemplatesViewProps {
  clinic: Clinic;
  currentUser: User;
  users: User[];
  patients: Patient[];
  templates: DocumentTemplate[];
  onSaveTemplate: (template: DocumentTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onResetTemplates: () => void;
  showToast: (msg: string) => void;
}

export const DocumentTemplatesView: React.FC<DocumentTemplatesViewProps> = ({
  clinic,
  currentUser,
  users,
  patients,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onResetTemplates,
  showToast,
}) => {
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');

  // Modals
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(
    null
  );
  const [isTestingOpen, setIsTestingOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Editor Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] =
    useState<DocumentTemplateCategory>('atestado');
  const [formCouncil, setFormCouncil] = useState<string>('TODOS');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formRequiresCID, setFormRequiresCID] = useState(false);
  const [formRequiresDays, setFormRequiresDays] = useState(false);
  const [editorActiveTab, setEditorActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Testing & Issuance Modal State
  const [testPatientId, setTestPatientId] = useState<string>(
    patients[0]?.id || ''
  );
  const [testUserId, setTestUserId] = useState<string>(currentUser.id);
  const [testDaysAway, setTestDaysAway] = useState<number>(3);
  const [testCidCode, setTestCidCode] = useState<string>('I10');
  const [testObservations, setTestObservations] = useState<string>(
    'Paciente orientado a repouso e hidratação.'
  );
  const [testConsultationDate, setTestConsultationDate] = useState<string>(
    new Date().toLocaleDateString('pt-BR')
  );
  const [testStartTime, setTestStartTime] = useState<string>('09:00');
  const [testEndTime, setTestEndTime] = useState<string>('09:45');
  const [isCopied, setIsCopied] = useState(false);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchSearch =
        tmpl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tmpl.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || tmpl.category === selectedCategory;

      const matchCouncil =
        selectedCouncil === 'all' ||
        tmpl.council_target === selectedCouncil ||
        (!tmpl.council_target && selectedCouncil === 'TODOS') ||
        tmpl.council_target === 'TODOS';

      return matchSearch && matchCategory && matchCouncil;
    });
  }, [templates, searchTerm, selectedCategory, selectedCouncil]);

  // Statistics
  const stats = useMemo(() => {
    const total = templates.length;
    const atestados = templates.filter((t) => t.category === 'atestado').length;
    const declaracoes = templates.filter(
      (t) => t.category === 'declaracao'
    ).length;
    const outros = total - atestados - declaracoes;
    const withCID = templates.filter((t) => t.requires_cid).length;
    return { total, atestados, declaracoes, outros, withCID };
  }, [templates]);

  // Open editor for new template
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormCategory('atestado');
    setFormCouncil('TODOS');
    setFormDescription('');
    setFormContent(
      `Atesto para os devidos fins que o(a) paciente {{paciente_nome}}, portador(a) do CPF {{paciente_cpf}}, foi atendido(a) nesta unidade de saúde em {{data_consulta}} às {{horario_inicio}} e necessita de repouso por {{dias_afastamento}} dia(s).\n\nCID-10: {{cid10}} - {{cid10_descricao}}.\n\nObservações: {{observacoes}}`
    );
    setFormRequiresCID(true);
    setFormRequiresDays(true);
    setEditorActiveTab('edit');
    setIsEditorOpen(true);
  };

  // Open editor for existing template
  const handleOpenEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormCouncil(template.council_target || 'TODOS');
    setFormDescription(template.description);
    setFormContent(template.content);
    setFormRequiresCID(template.requires_cid);
    setFormRequiresDays(template.requires_days);
    setEditorActiveTab('edit');
    setIsEditorOpen(true);
  };

  // Duplicate template
  const handleDuplicate = (template: DocumentTemplate) => {
    const duplicated: DocumentTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      title: `${template.title} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSaveTemplate(duplicated);
    showToast(`Modelo duplicado com sucesso!`);
  };

  // Insert placeholder tag into textarea at cursor
  const handleInsertPlaceholder = (tag: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formContent;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + tag + after;
      setFormContent(newText);

      // Re-focus and set cursor position after inserted tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      setFormContent((prev) => prev + ' ' + tag);
    }
  };

  // Save template
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Por favor, informe o título do modelo.');
      return;
    }
    if (!formContent.trim()) {
      showToast('O conteúdo do modelo não pode estar vazio.');
      return;
    }

    const templateToSave: DocumentTemplate = {
      id: editingTemplate ? editingTemplate.id : `tmpl-${Date.now()}`,
      clinic_id: clinic.id,
      title: formTitle.trim(),
      category: formCategory,
      council_target: formCouncil as any,
      description: formDescription.trim(),
      content: formContent.trim(),
      requires_cid: formRequiresCID,
      requires_days: formRequiresDays,
      created_at: editingTemplate
        ? editingTemplate.created_at
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSaveTemplate(templateToSave);
    setIsEditorOpen(false);
    showToast(
      editingTemplate
        ? 'Modelo atualizado com sucesso!'
        : 'Novo modelo criado com sucesso!'
    );
  };

  // Open Testing & Issuance Modal
  const handleOpenTesting = (template: DocumentTemplate) => {
    setPreviewTemplate(template);
    setTestDaysAway(template.requires_days ? 3 : 0);
    setTestCidCode(template.requires_cid ? 'I10' : 'Z00.0');
    setTestObservations(
      'Paciente orientado(a) ao cumprimento integral das recomendações prescritas.'
    );
    setIsTestingOpen(true);
  };

  // Active testing context
  const activeTestPatient = useMemo(() => {
    return patients.find((p) => p.id === testPatientId) || patients[0] || null;
  }, [patients, testPatientId]);

  const activeTestUser = useMemo(() => {
    return users.find((u) => u.id === testUserId) || currentUser;
  }, [users, testUserId, currentUser]);

  const activeTestCID = useMemo(() => {
    return (
      COMMON_CID10_LIST.find((c) => c.code === testCidCode) || {
        code: testCidCode,
        description: 'Diagnóstico não especificado',
        chapter: 'Geral',
      }
    );
  }, [testCidCode]);

  // Resolved test content
  const resolvedContent = useMemo(() => {
    if (!previewTemplate) return '';
    const ctx: TemplateContext = {
      patient: activeTestPatient,
      professional: activeTestUser,
      clinic: clinic,
      consultationDate: testConsultationDate,
      startTime: testStartTime,
      endTime: testEndTime,
      cid10: activeTestCID.code,
      cid10Description: activeTestCID.description,
      daysAway: testDaysAway,
      observations: testObservations,
    };
    return resolveTemplatePlaceholders(previewTemplate.content, ctx);
  }, [
    previewTemplate,
    activeTestPatient,
    activeTestUser,
    clinic,
    testConsultationDate,
    testStartTime,
    testEndTime,
    activeTestCID,
    testDaysAway,
    testObservations,
  ]);

  // Copy resolved text to clipboard
  const handleCopyResolvedText = () => {
    if (!resolvedContent) return;
    navigator.clipboard.writeText(resolvedContent);
    setIsCopied(true);
    showToast('Texto do documento copiado para a área de transferência!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Print document
  const handlePrintDocument = () => {
    window.print();
  };

  const categoryLabels: Record<
    DocumentTemplateCategory,
    { label: string; bg: string; text: string; border: string }
  > = {
    atestado: {
      label: 'Atestado',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    declaracao: {
      label: 'Declaração',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    laudo: {
      label: 'Laudo',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    encaminhamento: {
      label: 'Encaminhamento',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with metrics and primary actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 text-teal-700 font-semibold text-xs tracking-wide uppercase">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Biblioteca de Documentos Clínicos</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            Modelos de Atestados & Declarações
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Padronize a emissão de atestados médicos, declarações de comparecimento e laudos com substituição dinâmica de dados do paciente, CRM/conselho e CID-10.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onResetTemplates}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Restaura os 7 modelos clínicos originais"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Modelo</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total de Modelos
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Modelos ativos na clínica
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Atestados Médicos
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {stats.atestados}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Afastamento e aptidão
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">
            Declarações
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {stats.declaracoes}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Comparecimento e horas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-teal-700 uppercase tracking-wider">
            Tags Dinâmicas
          </div>
          <div className="text-2xl font-bold text-teal-700 mt-1">
            {AVAILABLE_PLACEHOLDERS.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Campos com auto-preenchimento
          </div>
        </div>
      </div>

      {/* Search, Filter Bar and Category Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, tag ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters by Council */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Conselho:
            </span>
            {['all', 'TODOS', 'CRM', 'CRP', 'CRO'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCouncil(c)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  selectedCouncil === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c === 'all' ? 'Todos' : c === 'TODOS' ? 'Geral' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">
            Categoria:
          </span>
          {[
            { id: 'all', label: 'Todas as Categorias' },
            { id: 'atestado', label: 'Atestados' },
            { id: 'declaracao', label: 'Declarações' },
            { id: 'laudo', label: 'Laudos' },
            { id: 'encaminhamento', label: 'Encaminhamentos' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhum modelo encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos nenhum modelo que corresponda aos filtros aplicados. Tente limpar os filtros ou crie um novo modelo.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedCouncil('all');
            }}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const detectedTags = extractPlaceholders(template.content);
            const style =
              categoryLabels[template.category] || categoryLabels.atestado;

            return (
              <div
                key={template.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {template.council_target === 'TODOS' || !template.council_target
                        ? 'Uso Geral'
                        : `Exclusivo ${template.council_target}`}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  {/* Text preview snippet */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 font-mono line-clamp-3 leading-relaxed">
                    {template.content}
                  </div>

                  {/* Badges for CID and Days */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {template.requires_cid && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                        <Tag className="w-2.5 h-2.5" /> Exige CID-10
                      </span>
                    )}
                    {template.requires_days && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                        <Clock className="w-2.5 h-2.5" /> Dias de Repouso
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-md">
                      <Sparkles className="w-2.5 h-2.5" /> {detectedTags.length} tags
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenTesting(template)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Testar & Emitir</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(template)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors"
                      title="Editar modelo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Duplicar modelo"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(template.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Excluir modelo de documento?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação removerá o modelo permanentemente do banco de dados da clínica.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteTemplate(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('Modelo excluído com sucesso.');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Create / Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingTemplate ? 'Editar Modelo' : 'Criar Novo Modelo de Documento'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Insira placeholders dinâmicos que serão preenchidos automaticamente na emissão.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Form Row: Title, Category, Council */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1.5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Atestado de Repouso por Gripe"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target.value as DocumentTemplateCategory
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="atestado">Atestado</option>
                    <option value="declaracao">Declaração</option>
                    <option value="laudo">Laudo</option>
                    <option value="encaminhamento">Encaminhamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conselho Alvo
                  </label>
                  <select
                    value={formCouncil}
                    onChange={(e) => setFormCouncil(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="TODOS">Todos os Conselhos (Geral)</option>
                    <option value="CRM">CRM (Medicina)</option>
                    <option value="CRP">CRP (Psicologia)</option>
                    <option value="CRO">CRO (Odontologia)</option>
                    <option value="CREFITO">CREFITO (Fisioterapia)</option>
                    <option value="CRN">CRN (Nutrição)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Breve (Finalidade)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Utilizado para afastamento laboral com CID e dias de repouso."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Checkboxes: Requires CID & Requires Days */}
              <div className="flex flex-wrap gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formRequiresCID}
                    onChange={(e) => setFormRequiresCID(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Exige seleção de código CID-10 na emissão</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={formRequiresDays}
                    onChange={(e) => setFormRequiresDays(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Exige informar dias de afastamento</span>
                </label>
              </div>

              {/* Placeholders Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tags e Placeholders Disponíveis (Clique para Inserir no Cursor):</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Substituição automática em tempo real
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 max-h-36 overflow-y-auto">
                  {AVAILABLE_PLACEHOLDERS.map((ph) => (
                    <button
                      key={ph.tag}
                      type="button"
                      onClick={() => handleInsertPlaceholder(ph.tag)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-lg transition-colors shadow-2xs group"
                      title={`${ph.label}: Exemplo: "${ph.example}"`}
                    >
                      <Plus className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
                      <span>{ph.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor / Live Preview Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setEditorActiveTab('edit')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        editorActiveTab === 'edit'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Texto do Modelo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorActiveTab('preview')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        editorActiveTab === 'preview'
                          ? 'bg-white text-teal-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pré-visualização Instantânea
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {extractPlaceholders(formContent).length} tags encontradas
                  </span>
                </div>

                {editorActiveTab === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    required
                    placeholder="Digite o texto do modelo aqui. Use os placeholders acima para campos dinâmicos..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 leading-relaxed"
                  />
                ) : (
                  <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-slate-800 leading-relaxed font-sans min-h-[170px] whitespace-pre-line">
                    {resolveTemplatePlaceholders(formContent, {
                      patient: patients[0],
                      professional: currentUser,
                      clinic: clinic,
                      daysAway: 3,
                      cid10: 'I10',
                      cid10Description: 'Hipertensão essencial (primária)',
                    })}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Testing & Document Issuance Modal ("Simulador e Emissor") */}
      {isTestingOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Emissão & Teste de Documento: {previewTemplate.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecione o paciente e confira a substituição instantânea das tags antes de imprimir ou assinar.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestingOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Context Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Parâmetros de Teste & Emissão</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Patient Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Paciente Cadastrado
                  </label>
                  <select
                    value={testPatientId}
                    onChange={(e) => setTestPatientId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.cpf})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Professional Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Profissional Emissor
                  </label>
                  <select
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.professional_council || 'Colaborador'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* CID-10 Picker if required */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Diagnóstico CID-10
                  </label>
                  <select
                    value={testCidCode}
                    onChange={(e) => setTestCidCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {COMMON_CID10_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.description.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days of Repouso */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dias de Afastamento
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={testDaysAway}
                      onChange={(e) =>
                        setTestDaysAway(parseInt(e.target.value, 10) || 0)
                      }
                      className="w-16 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 3, 5, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTestDaysAway(d)}
                          className={`px-1.5 py-1 text-[10px] rounded font-semibold ${
                            testDaysAway === d
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          +{d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation Date and Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Data da Consulta
                  </label>
                  <input
                    type="text"
                    value={testConsultationDate}
                    onChange={(e) => setTestConsultationDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Horário de Início
                  </label>
                  <input
                    type="text"
                    value={testStartTime}
                    onChange={(e) => setTestStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Horário de Término
                  </label>
                  <input
                    type="text"
                    value={testEndTime}
                    onChange={(e) => setTestEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Document Timbre / Print Preview Card (A4 look) */}
            <div className="border border-slate-300 rounded-xl p-8 bg-white shadow-sm space-y-6 font-sans text-slate-800 printable-area">
              {/* Official Clinic Timbre */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    {clinic.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    CNPJ: {clinic.document_cnpj_cpf} · Cadastro Nacional de Estabelecimentos de Saúde (CNES)
                  </p>
                  <p className="text-xs text-slate-500">
                    Av. Giovanni Gronchi, 5819 - Morumbi, São Paulo - SP · Tel: (11) 3744-8800
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>

              {/* Document Title Header */}
              <div className="text-center py-2">
                <span className="text-xs uppercase tracking-widest font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Documento Oficial de Saúde
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tight">
                  {previewTemplate.title}
                </h2>
              </div>

              {/* Resolved Text Body */}
              <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line py-3 text-justify px-2">
                {resolvedContent}
              </div>

              {/* Locality and Date */}
              <div className="text-right text-xs text-slate-600 pt-4">
                São Paulo - SP, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </div>

              {/* Professional Signature & ICP-Brasil Carimbo */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Doctor signature block */}
                <div className="text-center sm:text-left">
                  <div className="w-48 border-b border-slate-900 mx-auto sm:mx-0 mb-1"></div>
                  <div className="font-bold text-xs text-slate-900">
                    {activeTestUser.name}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {activeTestUser.professional_council}/{activeTestUser.council_uf || 'SP'} {activeTestUser.council_number || '148920'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Responsável Técnico / Emissor
                  </div>
                </div>

                {/* Digital Signature Stamp (ICP-Brasil standard) */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      Assinatura Digital ICP-Brasil (PAdES)
                    </div>
                    <div className="text-[10px] text-emerald-800 font-mono">
                      Hash SHA-256: 8f4b...77e9 (Válido CFM)
                    </div>
                    <div className="text-[9px] text-emerald-700">
                      Carimbo do Tempo emitido via VIDaaS / Soluti BirdID
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyResolvedText}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto Preenchido</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTestingOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
