import {
  Amplify,
  ResourcesConfig,
} from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

Amplify.configure(<ResourcesConfig>{
  Auth: {
    Cognito: {
      userPoolId: 'ap-northeast-1_eFrjKitQL',
      userPoolClientId: '7g46eg8qhbh8c9ko5mvl3vuq0h',
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    REST: {
      authApi: {
        endpoint: 'https://koy7bhzzkb.execute-api.ap-northeast-1.amazonaws.com/prod',
        region: 'ap-northeast-1',
      },
      todosApi: {
        endpoint: 'https://bnxzbt7hua.execute-api.ap-northeast-1.amazonaws.com/prod',
        region: 'ap-northeast-1',
      },
      commentsApi: {
        endpoint: 'https://qgsxn3239i.execute-api.ap-northeast-1.amazonaws.com/prod',
        region: 'ap-northeast-1',
      },
    },
  },
});

export const getToken = async () => {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString() || null;
};
