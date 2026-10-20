import { useAppDispatch } from '@/store/hooks';

import { addToast, nextToastId, type ToastVariant } from './toastSlice';

export function useToast() {
  const dispatch = useAppDispatch();
  const show = (message: string, variant: ToastVariant, duration = 3000) =>
    dispatch(addToast({ id: nextToastId(), message, variant, duration }));
  return {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
    info: (message: string) => show(message, 'info'),
    warning: (message: string) => show(message, 'warning'),
  };
}
