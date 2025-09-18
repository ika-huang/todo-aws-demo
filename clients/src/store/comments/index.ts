import { create } from 'zustand';
import {
  post,
  get,
  put,
  del,
} from 'aws-amplify/api';
import {
  CommentsState,
  Comment,
  CreateCommentInput,
 } from '../../interfaces/comments.interface';
import { getToken } from '../../amplifyConfig';

export const useCommentsStore = create<CommentsState>((setState, getState) => ({
  comments: [],
  loading: false,

  createComment: async({ todoId, content }: CreateCommentInput) => {
    try {
      const accessToken = await getToken();
      const { body } = await post({
        apiName: 'commentsApi',
        path: `/comments/todos/${todoId}`,
        options: {
          body: {
            content,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }).response;
      const response = await body.json();
      setState({
        comments: [...getState().comments, response as unknown as Comment],
      });
    } catch (error: any) {
      console.log('error', error.message);
    }
  },

  listComments: async(todoId: string) => {
    try {
      setState({
        loading: true,
        comments: [],
      });
      const accessToken = await getToken();
      const { body } = await get({
        apiName: 'commentsApi',
        path: `/comments/todos/${todoId}`,
        options: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }).response;
      const response = await body.json() as unknown as Comment[];
      setState({
        loading:false,
        comments: response || [],
      });
    } catch (error: any) {
      console.log('error', error.message);
    }
  },

}));
