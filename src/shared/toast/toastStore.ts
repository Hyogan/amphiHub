import { store } from '@/store';

import { addToast, nextToastId, type ToastVariant } from './toastSlice';

/** For code that runs outside React (dialog builders, query callbacks). */
export function dispatchToast(message: string, variant: ToastVariant = 'info', duration = 3000) {
  store.dispatch(addToast({ id: nextToastId(), message, variant, duration }));
}
