// src/pages/TodoPage.tsx
import React, { useEffect } from 'react';
import TodoForm from '../../components/TodoForm';
import TodoList from '../../components/TodoList';
import { useTodosStore } from '../../store/todos';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';

const TodosPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    todos,
    loading,
    listTodos,
    createTodo,
    deleteTodo,
  } = useTodosStore();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    } else {
      listTodos();
    }
  }, []);

  if (loading) return (
    <div style={{ padding: '1rem' }}>
      <h1>My Todos</h1>
      <p>Loading...</p>
    </div>
  );

  return (
    <div style={{ padding: '1rem' }}>
      <h1>My Todos</h1>
      <TodoForm onAdd={createTodo} />
      <TodoList todos={todos} onDelete={deleteTodo} />
    </div>
  );
};

export default TodosPage;
