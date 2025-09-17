import { create } from 'zustand';
import {
  post,
  get,
  put,
  del,
} from 'aws-amplify/api';
import {
  todo,
  TodosState,
} from '../../interfaces/todos.interface';
import { getToken } from '../../amplifyConfig';

export const useTodosStore = create<TodosState>((setState, getState) => ({
  todos: [],
  currentTodo: null,

  createTodo: async() => {
    const accessToken = await getToken();
    const { body } = await post({
      apiName: 'todosApi',
      path: '/todos',
      options: {
        body: {
          message: 'Mow the lawn',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }).response;
    // const { body } = await restOperation.response;
    const response = await body.json();
    setState({ currentTodo: response });
  },

  listTodos: async() => {
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
    console.log(response)
    setState({ todos: response });
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
    setState({ currentTodo: response });
  },

  deleteTodo: async(id) => {
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
    setState({ currentTodo: response });
  },
}))
