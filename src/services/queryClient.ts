import { QueryClient } from '@tanstack/react-query';

// A singleton so code outside React (dialog builders) can invalidate queries.
// AppProviders passes THIS instance to QueryClientProvider. Never create a second one.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
