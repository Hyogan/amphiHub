import { useTheme } from '@/theme/ThemeProvider';

export { useTheme };

export function useThemeColors() {
  return useTheme().colors;
}
