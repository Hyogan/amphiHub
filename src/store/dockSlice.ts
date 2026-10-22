import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** The search text lives in the dock but is read by the Explore screen. Height lets toasts clear the dock. */
const dockSlice = createSlice({
  name: 'dock',
  initialState: { query: '', height: 0 },
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setDockHeight: (state, action: PayloadAction<number>) => {
      state.height = action.payload;
    },
  },
});

export const { setQuery, setDockHeight } = dockSlice.actions;
export default dockSlice.reducer;
