import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppRole = 'student' | 'moderator' | 'admin';

export interface SessionState {
  /** 'loading' until Supabase has told us whether a session exists. */
  status: 'loading' | 'signedOut' | 'signedIn';
  userId: string | null;
  email: string | null;
  role: AppRole | null;
}

const initialState: SessionState = { status: 'loading', userId: null, email: null, role: null };

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionEstablished: (_state, action: PayloadAction<{ userId: string; email: string | null; role: AppRole }>) => ({
      status: 'signedIn' as const,
      userId: action.payload.userId,
      email: action.payload.email,
      role: action.payload.role,
    }),
    sessionCleared: () => ({ status: 'signedOut' as const, userId: null, email: null, role: null }),
  },
});

export const { sessionEstablished, sessionCleared } = sessionSlice.actions;
export default sessionSlice.reducer;
