import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppRole = "student" | "moderator" | "admin";

export interface SessionState {
  /** 'loading' until Supabase has told us whether a session exists. */
  status: "loading" | "signedOut" | "signedIn";
  userId: string | null;
  email: string | null;
  role: AppRole | null;
}

const initialState: SessionState = {
  status: "loading",
  userId: null,
  email: null,
  role: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    // Fires on every token refresh too. Keep the role we already know for the same user.

    sessionEstablished: (
      _state,
      action: PayloadAction<{
        userId: string;
        email: string | null;
        role: AppRole;
      }>,
    ) => ({
      status: "signedIn" as const,
      userId: action.payload.userId,
      email: action.payload.email,
      role:
        _state.userId === action.payload.userId && _state.role
          ? _state.role
          : action.payload.role,
    }),
    roleResolved: (state, action: PayloadAction<AppRole>) => {
      state.role = action.payload;
    },
    sessionCleared: () => ({
      status: "signedOut" as const,
      userId: null,
      email: null,
      role: null,
    }),
  },
});

export const { sessionEstablished, sessionCleared, roleResolved } =
  sessionSlice.actions;
export default sessionSlice.reducer;
