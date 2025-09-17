import { create } from 'zustand';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  loading: true,

  checkAuth: async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.idToken?.toString() || null;
      set({ user, accessToken, loading: false });
    } catch {
      set({ user: null, accessToken: null, loading: false });
    }
  },

  login: async (email, password) => {
    await signOut();
    await signIn({ username: email, password, options: {
      authFlowType: 'USER_PASSWORD_AUTH',
    }});
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.idToken?.toString() || null;
    localStorage.setItem('accessToken', accessToken!);
    set({ user, accessToken, loading: false });
  },

  logout: async () => {
    await signOut();
    set({ user: null, accessToken: null, loading: false });
  },
}));
