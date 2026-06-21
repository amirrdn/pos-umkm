import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, Shield, X } from 'lucide-react';
import { filterRolesBySearch } from '../../utils/staffManagementHelpers';
import type { StaffRole } from '../../types/staffManagement';

export interface StaffRoleDropdownProps {
  rolesList: StaffRole[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
}

export function StaffRoleDropdown({ rolesList, selectedRoleId, onSelectRole }: StaffRoleDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredRoles = filterRolesBySearch(rolesList, searchTerm);
  const selectedRole = rolesList.find((role) => role.id === selectedRoleId);
  const highlightedRoleIndex = useMemo(
    () =>
      filteredRoles.length === 0
        ? 0
        : Math.min(highlightedIndex, filteredRoles.length - 1),
    [filteredRoles.length, highlightedIndex]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDropdownOpen]);

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'Space' || e.key === ' ') {
        e.preventDefault();
        setHighlightedIndex(0);
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredRoles.length > 0 ? (prev + 1) % filteredRoles.length : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredRoles.length > 0 ? (prev - 1 + filteredRoles.length) % filteredRoles.length : 0
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredRoles.length > 0 && filteredRoles[highlightedRoleIndex]) {
          onSelectRole(filteredRoles[highlightedRoleIndex].id);
          setIsDropdownOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
      case 'Tab':
        setIsDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Pilih Hak Akses / Peran
      </label>

      <button
        type="button"
        onClick={() => {
          if (!isDropdownOpen) {
            setHighlightedIndex(0);
          }
          setIsDropdownOpen(!isDropdownOpen);
        }}
        onKeyDown={handleDropdownKeyDown}
        className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 text-left relative"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <div>
            <p className="font-semibold text-slate-850 dark:text-slate-200 text-xs">
              {selectedRole?.name || 'Pilih Peran...'}
            </p>
            {selectedRole?.description && (
              <p className="text-[10px] text-slate-500 dark:text-slate-550 line-clamp-1 mt-0.5">
                {selectedRole.description}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-550 transition-transform duration-200 ${
            isDropdownOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative border-b border-slate-150 dark:border-slate-850 p-2 bg-slate-50/50 dark:bg-slate-950/50 flex items-center">
            <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari peran..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleDropdownKeyDown}
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all duration-155"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="cursor-pointer absolute right-3.5 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850/40 py-1">
            {filteredRoles.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-450 dark:text-slate-500 text-center">
                Tidak ada peran yang cocok
              </div>
            ) : (
              filteredRoles.map((role, idx) => {
                const isCurrentlySelected = role.id === selectedRoleId;
                const isHighlighted = idx === highlightedRoleIndex;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      onSelectRole(role.id);
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`cursor-pointer w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors ${
                      isCurrentlySelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/15'
                        : isHighlighted
                          ? 'bg-slate-50 dark:bg-slate-800/60'
                          : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="space-y-0.5 pr-4">
                      <p
                        className={`font-bold ${
                          isCurrentlySelected
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          {role.description}
                        </p>
                      )}
                    </div>
                    {isCurrentlySelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
