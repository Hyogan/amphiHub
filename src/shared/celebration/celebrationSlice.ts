import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CelebrationState {
  active: { id: number; label: string } | null;
}

let counter = 0;

const celebrationSlice = createSlice({
  name: 'celebration',
  initialState: { active: null } as CelebrationState,
  reducers: {
    celebrate: {
      reducer: (state, action: PayloadAction<{ id: number; label: string }>) => {
        state.active = action.payload;
      },
      prepare: (label: string) => {
        counter += 1;
        return { payload: { id: counter, label } };
      },
    },
    celebrationEnded: (state, action: PayloadAction<number>) => {
      if (state.active?.id === action.payload) state.active = null;
    },
  },
});

export const { celebrate, celebrationEnded } = celebrationSlice.actions;
export default celebrationSlice.reducer;
