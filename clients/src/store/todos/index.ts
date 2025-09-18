import { create } from 'zustand';
import {
  post,
  get,
  put,
  del,
} from 'aws-amplify/api';
import {
  Todo,
  TodosState,
} from '../../interfaces/todos.interface';
import { getToken } from '../../amplifyConfig';

export const useTodosStore = create<TodosState>((setState, getState) => ({
  todos: [],
  currentTodo: null,
  loading: false,

  createTodo: async({ title, description = '' }) => {
    setState({ loading: true });
    const accessToken = await getToken();
    const { body } = await post({
      apiName: 'todosApi',
      path: '/todos',
      options: {
        body: {
          title,
          description,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    const response = await body.json();
    setState({
      currentTodo: response,
      todos: [...getState().todos, response as unknown as Todo],
      loading: false,
    });
  },

  listTodos: async() => {
    setState({ loading: true });
    const accessToken = await getToken();
    const { body } = await get({
      apiName: 'todosApi',
      path: '/todos',
      options: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    // const { body } = await restOperation.response;
    const response = await body.json() as [];
    setState({ todos: response, loading: false });
  },

  getTodo: async(id) => {
    const accessToken = await getToken();
    const { body } = await get({
      apiName: 'todosApi',
      path: `/todos/${id}`,
      options: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    const response = await body.json();
    setState({ currentTodo: response });
  },

  updateTodo: async({ id, updateBody }) => {
    setState({ loading: true });
    const accessToken = await getToken();
    const { body } = await put({
      apiName: 'todosApi',
      path: `/todos/${id}`,
      options: {
        body: updateBody,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    const response = await body.json();
    setState({
      currentTodo: response,
      loading: false,
    });
  },

  deleteTodo: async(id) => {
    setState({ loading: true });
    const accessToken = await getToken();
    const { body } = await del({
      apiName: 'todosApi',
      path: `/todos/${id}`,
      options: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    const response = await body.json();
    setState({
      todos: getState().todos.filter((t) => t.todoId !== id),
      currentTodo: response,
      loading: false,
    });
  },
}))
