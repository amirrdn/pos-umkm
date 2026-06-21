export interface MidtransSnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

export interface MidtransSnap {
  pay: (token: string, options: MidtransSnapCallbacks) => void;
}

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

export function getMidtransSnap(): MidtransSnap | undefined {
  return window.snap;
}

export function loadMidtransSnapScript(clientKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
