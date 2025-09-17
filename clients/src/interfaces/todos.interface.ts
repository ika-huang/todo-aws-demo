export interface todo {
  todoId: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  completedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

interface updateTodoInput {
  id: string;
  updateBody: {
    title?: string | null;
    description?: string | null;
    status?: string;
  };
}

export interface TodosState {
  todos: todo[];
  currentTodo: any | null;
  createTodo: () => Promise<void>;
  getTodo: (id: string) => Promise<void>;
  listTodos: () => Promise<void>;
  updateTodo: (input: updateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  // login: (email: string, password: string) => Promise<void>;
  // logout: () => Promise<void>;
}
