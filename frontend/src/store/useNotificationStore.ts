import { create } from 'zustand';
import { API_BASE_URL } from '../config';
import { useAuthStore } from './useAuthStore';
import { isTenantOwner, isPlatformAdmin } from '../utils/roles';
import { usePlatformStore } from './usePlatformStore';
import { apiClient } from '../api/apiClient';

const POLL_INTERVAL_MS = 60_000;
const SSE_FALLBACK_AFTER_MS = 5_000;

/** Pemilik toko & manager operasional — bukan platform Admin semua. */
export function canReceiveDraftTransferNotifications(roles: string[]): boolean {
  return isTenantOwner(roles) || roles.includes('Manager');
}

interface NotificationState {
  draftTransferCount: number;
  pollTimer: ReturnType<typeof setInterval> | null;
  sseSource: EventSource | null;
  sseFallbackTimer: ReturnType<typeof setTimeout> | null;
  fetchDraftTransferCount: () => Promise<void>;
  startRealtime: () => void;
  stopRealtime: () => void;
  /** @deprecated use startRealtime */
  startPolling: () => void;
  /** @deprecated use stopRealtime */
  stopPolling: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  draftTransferCount: 0,
  pollTimer: null,
  sseSource: null,
  sseFallbackTimer: null,

  fetchDraftTransferCount: async () => {
    const { token, user } = useAuthStore.getState();
    if (!token || !user || !canReceiveDraftTransferNotifications(user.roles)) {
      set({ draftTransferCount: 0 });
      return;
    }

    try {
      const response = await apiClient.get('/api/notifications/draft-count');
      if (response.data?.success) {
        set({ draftTransferCount: response.data.data?.count ?? 0 });
      }
    } catch (err) {
      console.error('Gagal mengambil count transfer DRAFT:', err);
    }
  },

  startRealtime: () => {
    get().stopRealtime();
    const { token, user } = useAuthStore.getState();
    if (!token || !user || !canReceiveDraftTransferNotifications(user.roles)) {
      return;
    }

    void get().fetchDraftTransferCount();

    const startPollingFallback = () => {
      const pollTimer = setInterval(() => void get().fetchDraftTransferCount(), POLL_INTERVAL_MS);
      set({ pollTimer });
    };

    if (typeof EventSource !== 'undefined') {
      try {
        let tenantId = user.tenantId;
        if (isPlatformAdmin(user.roles)) {
          const activeTenantId = usePlatformStore.getState().activeTenantId;
          if (activeTenantId) {
            tenantId = activeTenantId;
          }
        }
        const url = `${API_BASE_URL}/api/notifications/stream?token=${token}&tenantId=${tenantId}`;
        const sse = new EventSource(url);

        sse.addEventListener('draft_transfer', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data) as { count?: number };
            set({ draftTransferCount: payload.count ?? 0 });
          } catch {
            /* ignore malformed */
          }
        });

        sse.onerror = () => {
          sse.close();
          set({ sseSource: null });
          startPollingFallback();
        };

        const fallbackTimer = setTimeout(() => {
          if (!get().pollTimer && get().sseSource) {
            startPollingFallback();
          }
        }, SSE_FALLBACK_AFTER_MS);

        set({ sseSource: sse, sseFallbackTimer: fallbackTimer });
        return;
      } catch {
        startPollingFallback();
        return;
      }
    }

    startPollingFallback();
  },

  stopRealtime: () => {
    const { pollTimer, sseSource, sseFallbackTimer } = get();
    if (pollTimer) clearInterval(pollTimer);
    if (sseFallbackTimer) clearTimeout(sseFallbackTimer);
    sseSource?.close();
    set({
      pollTimer: null,
      sseSource: null,
      sseFallbackTimer: null,
      draftTransferCount: 0,
    });
  },

  startPolling: () => get().startRealtime(),
  stopPolling: () => get().stopRealtime(),
}));
