import 'expo-sqlite/localStorage/install';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type Colors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colors: Colors;
  scheme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'amphihub.theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();
  // Read synchronously on first render so there is no flash of the wrong theme.
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  const scheme: 'light' | 'dark' = mode === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : mode;

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can fail on a full disk. The choice still applies for this session.
    }
  };

  const value: ThemeContextValue = {
    colors: scheme === 'dark' ? darkColors : lightColors,
    scheme,
    mode,
    setMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
