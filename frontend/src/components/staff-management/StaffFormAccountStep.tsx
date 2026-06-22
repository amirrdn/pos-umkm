import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import type { StaffFormFieldErrors, StaffFormState } from '../../types/staffManagement';

export interface StaffFormAccountStepProps {
  form: StaffFormState;
  fieldErrors: StaffFormFieldErrors;
  isEdit: boolean;
  onChange: (updates: Partial<StaffFormState>) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">{message}</p>;
}

export function StaffFormAccountStep({
  form,
  fieldErrors,
  isEdit,
  onChange,
}: StaffFormAccountStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Lengkap</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
            <User className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Contoh: Budi Santoso"
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 ${
              fieldErrors.name
                ? 'border-rose-400 dark:border-rose-500'
                : 'border-slate-200 dark:border-slate-850 focus:border-indigo-500'
            }`}
          />
        </div>
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Akun</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            disabled={isEdit}
            placeholder="budi@domain.com"
            value={form.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              fieldErrors.email
                ? 'border-rose-400 dark:border-rose-500'
                : 'border-slate-200 dark:border-slate-850 focus:border-indigo-500'
            }`}
          />
        </div>
        <FieldError message={fieldErrors.email} />
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kata Sandi</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-550">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(event) => onChange({ password: event.target.value })}
              className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 ${
                fieldErrors.password
                  ? 'border-rose-400 dark:border-rose-500'
                  : 'border-slate-200 dark:border-slate-850 focus:border-indigo-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="cursor-pointer absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <FieldError message={fieldErrors.password} />
        </div>
      )}
    </div>
  );
}
