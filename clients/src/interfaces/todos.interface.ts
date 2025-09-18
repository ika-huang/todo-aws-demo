export interface Todo {
  todoId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTodoInput {
  title: string | null;
  description?: string | null;
}

interface UpdateTodoInput {
  id: string;
  updateBody: {
    title?: string | null;
    description?: string | null;
    status?: string;
  };
}

export interface TodosState {
  loading: boolean;
  todos: Todo[];
  currentTodo: any | null;
  createTodo: (input: CreateTodoInput) => Promise<void>;
  getTodo: (id: string) => Promise<void>;
  listTodos: () => Promise<void>;
  updateTodo: (input: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  // login: (email: string, password: string) => Promise<void>;
  // logout: () => Promise<void>;
}
