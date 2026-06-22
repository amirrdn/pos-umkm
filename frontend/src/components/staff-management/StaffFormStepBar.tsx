import type { StaffFormStep } from '../../types/staffManagement';

export interface StaffFormStepBarProps {
  currentStep: StaffFormStep;
}

const FORM_STEPS = [
  { step: 1 as const, label: 'Data Akun' },
  { step: 2 as const, label: 'Hak Akses' },
];

export function StaffFormStepBar({ currentStep }: StaffFormStepBarProps) {
  return (
    <div className="flex items-center gap-3">
      {FORM_STEPS.map((item, index) => {
        const isActive = currentStep === item.step;
        const isCompleted = currentStep > item.step;

        return (
          <div key={item.step} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : isCompleted
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {item.step}
              </span>
              <span
                className={`text-xs font-semibold truncate ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < FORM_STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
