import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { DialogKey } from "./dialogKeys";

const slice = createSlice({
  name: "dialog",
  initialState: {
    activeKey: null as DialogKey | null,
    params: undefined as unknown,
  },
  reducers: {
    openDialog: (
      state,
      action: PayloadAction<{ key: DialogKey; params: unknown }>,
    ) => {
      state.activeKey = action.payload.key;
      state.params = action.payload.params;
    },
    closeDialog: (state) => {
      state.activeKey = null;
      state.params = undefined;
    },
  },
});

export const { openDialog, closeDialog } = slice.actions;
export default slice.reducer;
