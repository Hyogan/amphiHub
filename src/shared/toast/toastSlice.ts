import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

let counter = 0;
export function nextToastId(): string {
  counter += 1;
  return `${Date.now()}-${counter}`;
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] as ToastItem[] },
  reducers: {
    addToast: (state, action: PayloadAction<ToastItem>) => {
      // Keep at most three on screen; the oldest leaves first.
      state.items = [...state.items, action.payload].slice(-3);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
