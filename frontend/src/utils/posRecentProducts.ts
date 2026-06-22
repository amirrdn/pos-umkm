const STORAGE_KEY = 'pos-recent-product-ids';
const MAX_RECENT = 8;

export function getRecentProductIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecentProductId(productId: string): string[] {
  const current = getRecentProductIds().filter((id) => id !== productId);
  const next = [productId, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export const POS_ONBOARDING_KEY = 'pos-onboarding-completed';
export const POS_CHECKOUT_CONFIRM_KEY = 'pos-checkout-confirm-enabled';
