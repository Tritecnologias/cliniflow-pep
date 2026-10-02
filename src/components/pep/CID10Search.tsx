import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CID10Item } from '../../types/clinic';
import { COMMON_CID10_LIST } from '../../data/mockData';
import {
  Search,
  Activity,
  Check,
  X,
  Tag,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Layers,
  Lock,
  Plus,
} from 'lucide-react';

interface CID10SearchProps {
  selectedCid: CID10Item | null;
  onSelectCid: (cid: CID10Item | null) => void;
  disabled?: boolean;
  showQuickPicks?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

// Quick common presets for fast 1-click clinical entry
const QUICK_PRESETS: { code: string; label: string }[] = [
  { code: 'I10', label: 'I10 · Hipertensão' },
  { code: 'E11.9', label: 'E11.9 · Diabetes T2' },
  { code: 'M54.5', label: 'M54.5 · Lombalgia' },
  { code: 'F41.1', label: 'F41.1 · Ansiedade (TAG)' },
  { code: 'J06.9', label: 'J06.9 · IVAS / Gripe' },
  { code: 'Z00.0', label: 'Z00.0 · Check-up Geral' },
];

// Helper to remove accents for fuzzy Portuguese search
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const CID10Search: React.FC<CID10SearchProps> = ({
  selectedCid,
  onSelectCid,
  disabled = false,
  showQuickPicks = true,
  label = 'Classificação Internacional de Doenças (CID-10)',
  helperText = 'Obrigatório para conformidade CFM e emissão de atestados médicos',
  required = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract unique chapters from dataset
  const chapters = useMemo(() => {
    const set = new Set<string>();
    COMMON_CID10_LIST.forEach((item) => set.add(item.chapter));
    return ['all', ...Array.from(set)];
  }, []);

  // Filter items in real time with fuzzy accent-insensitive match
  const filteredList = useMemo(() => {
    const cleanQuery = normalizeText(query.trim());

    return COMMON_CID10_LIST.filter((item) => {
      const matchChapter =
        selectedChapter === 'all' || item.chapter === selectedChapter;

      if (!matchChapter) return false;
      if (!cleanQuery) return true;

      const codeMatch = normalizeText(item.code).includes(cleanQuery);
      const descMatch = normalizeText(item.description).includes(cleanQuery);
      const chapterMatch = normalizeText(item.chapter).includes(cleanQuery);

      return codeMatch || descMatch || chapterMatch;
    }).sort((a, b) => {
      // Prioritize exact code matches or startsWith code
      const cleanA = normalizeText(a.code);
      const cleanB = normalizeText(b.code);
      if (cleanA.startsWith(cleanQuery) && !cleanB.startsWith(cleanQuery))
        return -1;
      if (!cleanA.startsWith(cleanQuery) && cleanB.startsWith(cleanQuery))
        return 1;
      return 0;
    });
  }, [query, selectedChapter]);

  // Check if query is a custom valid code format (e.g. M75.0, A90, Z76.0)
  const isCustomCodeCandidate = useMemo(() => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return false;
    const exists = COMMON_CID10_LIST.some(
      (item) => item.code.toUpperCase() === trimmed
    );
    if (exists) return false;
    // Basic CID-10 regex pattern: 1 letter followed by 2 digits, optional dot and digit
    return /^[A-Z]\d{2}(\.\d{1,2})?$/.test(trimmed) || trimmed.length >= 3;
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredList]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredList.length - 1 ? prev + 1 : 0
      );
      scrollItemIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredList.length - 1
      );
      scrollItemIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredList[highlightedIndex]) {
        handleSelect(filteredList[highlightedIndex]);
      } else if (isCustomCodeCandidate) {
        handleSelectCustom(query.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollItemIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.cid10-item');
      if (items[index]) {
        (items[index] as HTMLElement).scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  };

  const handleSelect = (item: CID10Item) => {
    onSelectCid(item);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectCustom = (code: string) => {
    const customItem: CID10Item = {
      code,
      description: `Código CID-10 informado: ${code}`,
      chapter: 'Personalizado',
    };
    onSelectCid(customItem);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectCid(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleQuickPick = (code: string) => {
    const found = COMMON_CID10_LIST.find((c) => c.code === code);
    if (found) {
      onSelectCid(found);
    }
  };

  return (
    <div ref={containerRef} className={`space-y-2.5 ${className}`}>
      {/* Header and label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {helperText && (
          <span className="text-[11px] text-slate-500">{helperText}</span>
        )}
      </div>

      {/* Selected CID Card View */}
      {selectedCid ? (
        <div className="bg-teal-50/70 border border-teal-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              {selectedCid.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {selectedCid.description}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-800 rounded-md border border-teal-200/60">
                  {selectedCid.chapter}
                </span>
              </div>
              <div className="text-[11px] text-teal-800/80 mt-0.5 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>CID-10 verificado e vinculado ao prontuário</span>
              </div>
            </div>
          </div>

          {!disabled ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-100/60 border border-teal-200 rounded-lg transition-colors shadow-2xs"
              >
                Alterar
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remover CID-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Assinado</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Autocomplete Input Search Area */}
      {(!selectedCid || isOpen) && (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite o código ou nome da patologia (ex: I10, Hipertensão, Lombalgia, Ansiedade, Resfriado...)"
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-500 transition-all shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Panel */}
          {isOpen && !disabled && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
              {/* Chapter Specialty Filter Chips */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="font-semibold text-slate-500 px-1 shrink-0 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Área:
                </span>
                {chapters.map((chap) => (
                  <button
                    key={chap}
                    type="button"
                    onClick={() => setSelectedChapter(chap)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                      selectedChapter === chap
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {chap === 'all' ? 'Todos os Capítulos' : chap}
                  </button>
                ))}
              </div>

              {/* Suggestions List */}
              <div
                ref={listRef}
                className="max-h-64 overflow-y-auto divide-y divide-slate-100"
              >
                {filteredList.length === 0 ? (
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Nenhum código encontrado com o termo "{query}".
                    </p>
                    {isCustomCodeCandidate && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectCustom(query.trim().toUpperCase())
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          Inserir código personalizado "{query.trim().toUpperCase()}"
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredList.map((item, idx) => {
                    const isSelected = selectedCid?.code === item.code;
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`cid10-item w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 text-xs ${
                          isHighlighted
                            ? 'bg-teal-50/80 text-teal-950'
                            : 'hover:bg-slate-50 text-slate-800'
                        } ${isSelected ? 'font-semibold bg-teal-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded text-[11px] shrink-0 border border-teal-200/50">
                            {item.code}
                          </span>
                          <span className="truncate">{item.description}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {item.chapter}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Dropdown footer info */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  {filteredList.length} de {COMMON_CID10_LIST.length} patologias
                  disponíveis
                </span>
                <span>Navegue com ↑ / ↓ e selecione com Enter</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Pick Presets */}
      {showQuickPicks && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-0.5">
            <Sparkles className="w-3 h-3 text-teal-600" /> Frequentes:
          </span>
          {QUICK_PRESETS.map((preset) => {
            const isSelected = selectedCid?.code === preset.code;
            return (
              <button
                key={preset.code}
                type="button"
                onClick={() => handleQuickPick(preset.code)}
                className={`px-2 py-0.5 text-[11px] rounded-lg transition-all border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
