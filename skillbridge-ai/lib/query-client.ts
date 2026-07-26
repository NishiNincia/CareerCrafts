import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient. In mock mode all "network" calls resolve
 * from local JSON with an artificial delay (see services/*), so caching
 * behaves the same way it would against a real API.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
