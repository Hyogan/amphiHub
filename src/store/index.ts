import { configureStore } from '@reduxjs/toolkit';

import toastReducer from '@/shared/toast/toastSlice';

import sessionReducer from './sessionSlice';

// Only genuine client state lives here. Server data stays in the TanStack Query cache.
// The dialog and gate slices are added with the first feature that needs them.
export const store = configureStore({
  reducer: { session: sessionReducer, toast: toastReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
