import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "downloads",
  initialState: { active: {} as Record<string, number> },
  reducers: {
    downloadStarted: (state, action: PayloadAction<string>) => {
      state.active[action.payload] = 0;
    },
    downloadProgress: (
      state,
      action: PayloadAction<{ id: string; progress: number }>,
    ) => {
      if (action.payload.id in state.active) {
        state.active[action.payload.id] = action.payload.progress;
      }
    },
    downloadFinished: (state, action: PayloadAction<string>) => {
      delete state.active[action.payload];
    },
  },
});

export const { downloadStarted, downloadProgress, downloadFinished } =
  slice.actions;
export default slice.reducer;
