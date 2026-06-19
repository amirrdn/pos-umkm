import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface AppSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface AppSelectGroup {
  label: string;
  options: AppSelectOption[];
}

interface AppSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: AppSelectOption[];
  groups?: AppSelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'dark';
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  leadingIcon?: ReactNode;
  'aria-label'?: string;
}

function OptionButton({
  option,
  selected,
  onSelect,
}: {
  option: AppSelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={option.disabled}
      onClick={() => onSelect(option.value)}
      className={`cursor-pointer w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        selected
          ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
      }`}
    >
      <span className="min-w-0">
        <span className="block font-semibold truncate">{option.label}</span>
        {option.description && (
          <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {option.description}
          </span>
        )}
      </span>
      {selected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
    </button>
  );
}

export function AppSelect({
  value,
  onChange,
  options,
  groups,
  placeholder = 'Pilih...',
  disabled = false,
  searchable,
  searchPlaceholder = 'Cari...',
  size = 'md',
  variant = 'default',
  className = '',
  id,
  name,
  required,
  leadingIcon,
  'aria-label': ariaLabel,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const flatOptions = useMemo(() => {
    if (groups) return groups.flatMap((g) => g.options);
    return options ?? [];
  }, [options, groups]);

  const selected = flatOptions.find((o) => o.value === value);
  const showSearch = searchable ?? flatOptions.length > 6;

  const filterOption = (opt: AppSelectOption) =>
    !search || opt.label.toLowerCase().includes(search.toLowerCase());

  const filteredOptions = options?.filter(filterOption);
  const filteredGroups = groups
    ?.map((g) => ({ ...g, options: g.options.filter(filterOption) }))
    .filter((g) => g.options.length > 0);

  const hasResults =
    (filteredOptions && filteredOptions.length > 0) ||
    (filteredGroups && filteredGroups.length > 0);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (open && showSearch) searchRef.current?.focus();
  }, [open, showSearch]);

  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const variantClass =
    variant === 'dark'
      ? 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'
      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700';

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {name && (
        <select
          name={name}
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          {placeholder && <option value="">{placeholder}</option>}
          {flatOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        className={`cursor-pointer w-full flex items-center justify-between gap-2 ${sizeClass} ${variantClass} rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${leadingIcon ? 'pl-10' : ''}`}
      >
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            {leadingIcon}
          </span>
        )}
        <span
          className={`min-w-0 flex-1 text-left truncate ${!selected ? 'text-slate-400 dark:text-slate-500' : ''}`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {showSearch && (
            <div className="relative border-b border-slate-100 dark:border-slate-800 p-2 bg-slate-50/80 dark:bg-slate-950/80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div id={listId} role="listbox" className="max-h-52 overflow-y-auto py-1">
            {!hasResults ? (
              <p className="px-3 py-2.5 text-xs text-slate-500 text-center">Tidak ada hasil</p>
            ) : filteredGroups ? (
              filteredGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.label}
                  </p>
                  {group.options.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      option={opt}
                      selected={opt.value === value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))
            ) : (
              filteredOptions?.map((opt) => (
                <OptionButton
                  key={opt.value}
                  option={opt}
                  selected={opt.value === value}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
