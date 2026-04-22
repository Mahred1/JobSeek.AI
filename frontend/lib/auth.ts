// Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// Auth storage helpers
export const storeTokens = (tokens: AuthTokens): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }
};

export const getStoredTokens = (): AuthTokens | null => {
  if (typeof window !== 'undefined') {
    const tokensString = localStorage.getItem('auth_tokens');
    if (tokensString) {
      try {
        return JSON.parse(tokensString);
      } catch (e) {
        console.error('Failed to parse stored tokens', e);
      }
    }
  }
  return null;
};

export const removeStoredTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_tokens');
  }
};

// Check if token exists (simplified from previous implementation)
export const hasToken = (): boolean => {
  const tokens = getStoredTokens();
  return !!tokens?.access_token;
}; 