import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as ReduxProvider } from 'react-redux';

import { queryClient } from '@/services/queryClient';
import { store } from '@/store';
import { ThemeProvider } from '@/theme/ThemeProvider';

// SafeAreaProvider is already supplied by Expo Router. The bottom-sheet portal host
// is added after the sheet spike decides which sheet library we use.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
