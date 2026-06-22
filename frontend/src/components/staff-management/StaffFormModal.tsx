import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Pencil,
  UserPlus,
  X,
} from 'lucide-react';
import { StaffFormAccessStep } from './StaffFormAccessStep';
import { StaffFormAccountStep } from './StaffFormAccountStep';
import { StaffFormStepBar } from './StaffFormStepBar';
import { StaffQuotaNotice } from './StaffQuotaNotice';
import type { UseStaffManagementReturn } from '../../hooks/useStaffManagement';

export interface StaffFormModalProps {
  staffManagement: UseStaffManagementReturn;
}

export function StaffFormModal({ staffManagement }: StaffFormModalProps) {
  const {
    isModalOpen,
    setIsModalOpen,
    editingStaff,
    newStaff,
    setNewStaff,
    submitting,
    modalError,
    rolesList,
    outletHierarchy,
    formStep,
    fieldErrors,
    staffQuota,
    handleCreateStaff,
    handleOutletToggle,
    advanceFormStep,
    retreatFormStep,
    navigateToUpgradePlan,
  } = staffManagement;

  if (!isModalOpen) {
    return null;
  }

  const isEditMode = Boolean(editingStaff);
  const isCreateWizard = !isEditMode;
  const isAccessStep = isCreateWizard && formStep === 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
        onClick={() => !submitting && setIsModalOpen(false)}
      />

      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 rounded-t-2xl border-b border-slate-150 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 min-w-0">
            {isEditMode ? (
              <Pencil className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            ) : (
              <UserPlus className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            )}
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {isEditMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            disabled={submitting}
            className="cursor-pointer text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateStaff} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {isCreateWizard && <StaffFormStepBar currentStep={formStep} />}

            {!isEditMode && (
              <StaffQuotaNotice staffQuota={staffQuota} onUpgradePlan={navigateToUpgradePlan} />
            )}

            {modalError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{modalError}</p>
              </div>
            )}

            {isCreateWizard && formStep === 1 && (
              <StaffFormAccountStep
                form={newStaff}
                fieldErrors={fieldErrors}
                isEdit={false}
                onChange={(updates) => setNewStaff({ ...newStaff, ...updates })}
              />
            )}

            {isCreateWizard && isAccessStep && (
              <StaffFormAccessStep
                form={newStaff}
                fieldErrors={fieldErrors}
                rolesList={rolesList}
                outletHierarchy={outletHierarchy}
                submitting={submitting}
                onSelectRole={(roleId) => setNewStaff({ ...newStaff, roleId })}
                onToggleOutlet={handleOutletToggle}
              />
            )}

            {isEditMode && (
              <>
                <StaffFormAccountStep
                  form={newStaff}
                  fieldErrors={fieldErrors}
                  isEdit
                  onChange={(updates) => setNewStaff({ ...newStaff, ...updates })}
                />
                <StaffFormAccessStep
                  form={newStaff}
                  fieldErrors={fieldErrors}
                  rolesList={rolesList}
                  outletHierarchy={outletHierarchy}
                  submitting={submitting}
                  onSelectRole={(roleId) => setNewStaff({ ...newStaff, roleId })}
                  onToggleOutlet={handleOutletToggle}
                />
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between gap-3 shrink-0">
            {isCreateWizard && isAccessStep ? (
              <button
                type="button"
                onClick={retreatFormStep}
                disabled={submitting}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
              >
                Batal
              </button>
            )}

            {isCreateWizard && formStep === 1 ? (
              <button
                type="button"
                onClick={advanceFormStep}
                disabled={submitting}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-950/30 transition-all"
              >
                Lanjut
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 dark:shadow-indigo-950/30 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditMode ? (
                  'Simpan Perubahan'
                ) : (
                  'Daftarkan'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
