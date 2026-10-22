import { createSlice } from "@reduxjs/toolkit";
import "expo-sqlite/localStorage/install";

const KEY = "amphihub.onboarding-seen";

function readOnboardingSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist first, then dispatch onboardingCompleted. Reducers stay pure. */
export function persistOnboardingSeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // The flag still applies for this session.
  }
}

const preferencesSlice = createSlice({
  name: "preferences",
  initialState: { onboardingSeen: readOnboardingSeen() },
  reducers: {
    onboardingCompleted: (state) => {
      state.onboardingSeen = true;
    },
  },
});

export const { onboardingCompleted } = preferencesSlice.actions;
export default preferencesSlice.reducer;
