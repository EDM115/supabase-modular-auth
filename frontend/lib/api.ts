const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Array<{
    code: string;
    message: string;
    path: string[];
  }>;
}

async function fetchAPI<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // CRITICAL: Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();
  return data;
}

export const api = {
  // Auth endpoints
  register: (email: string, password: string, username: string) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  login: (email: string, password: string) =>
    fetchAPI<{ user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    fetchAPI('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (password: string, token: string) =>
    fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password, token }),
    }),

  getMe: () =>
    fetchAPI<{
      user: {
        id: string;
        email: string;
        email_verified: boolean;
        created_at: string;
        username: string | null;
      };
    }>('/auth/me'),

  // Google OAuth
  getGoogleAuthUrl: () =>
    fetchAPI<{ url: string }>('/auth/google/url'),
};
