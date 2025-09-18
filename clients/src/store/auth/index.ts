import { create } from 'zustand';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import { AuthState } from '../../interfaces/auth.interface';

export const useAuthStore = create<AuthState>((setState, getState) => ({
  user: null,
  accessToken: null,
  loading: true,

  checkAuth: async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.idToken?.toString() || null;
      setState({ user, accessToken, loading: false });
    } catch {
      setState({ user: null, accessToken: null, loading: false });
    }
  },

  login: async (email, password) => {
    await signOut();
    await signIn({
      username: email,
      password,
      options: {
        authFlowType: 'USER_PASSWORD_AUTH',
    }});
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.idToken?.toString() || null;
    setState({ user, accessToken, loading: false });
    localStorage.setItem('user', user.username);
  },

  register: async (email, password) => {
    try {
      await signOut();
      await post({
        apiName: 'authApi',
        path: '/auth/register',
        options: {
          body: {
            email,
            password,
          },
        },
      }).response;
    } catch (error: any) {
      console.log('err', error.message);
    }
  },

  logout: async () => {
    await signOut();
    setState({
      user: null,
      accessToken: null,
      loading: false,
    });
    localStorage.clear();
  },
}));
