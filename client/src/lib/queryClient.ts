import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API configuration - use Supabase Edge Functions in production, local server in development
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '/api';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Convert relative URLs to use the appropriate API base
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Supabase auth headers if using Supabase
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    headers["apikey"] = import.meta.env.VITE_SUPABASE_ANON_KEY;
    headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: import.meta.env.VITE_SUPABASE_URL ? "omit" : "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Convert relative URLs to use the appropriate API base
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
    
    const headers: Record<string, string> = {};
    
    // Add Supabase auth headers if using Supabase
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
      headers["apikey"] = import.meta.env.VITE_SUPABASE_ANON_KEY;
      headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }

    const res = await fetch(fullUrl, {
      headers,
      credentials: import.meta.env.VITE_SUPABASE_URL ? "omit" : "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
