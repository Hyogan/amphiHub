import { configureStore } from "@reduxjs/toolkit";

import celebrationReducer from "@/shared/celebration/celebrationSlice";
import toastReducer from "@/shared/toast/toastSlice";

import dockReducer from "./dockSlice";
import preferencesReducer from "./preferencesSlice";
import sessionReducer from "./sessionSlice";

// Only genuine client state lives here. Server data stays in the TanStack Query cache.
// Toast and celebration are transient UI feedback. The dialog and gate slices are added
// with the first feature that needs them.
export const store = configureStore({
  reducer: {
    session: sessionReducer,
    preferences: preferencesReducer,
    dock: dockReducer,
    toast: toastReducer,
    celebration: celebrationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
