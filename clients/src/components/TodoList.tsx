import React from 'react';
import TodoItem from './TodoItem';
import { Todo } from '../interfaces/todos.interface';

interface TodoListProps {
  todos: Todo[];
  onDelete: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onDelete }) => {
  return (
    <ul style={{ padding: 0, listStyle: 'none' }}>
      {todos.length > 0 ? todos.map((todo) => (
        <TodoItem key={todo.todoId} id={todo.todoId} title={todo.title || ''} onDelete={onDelete} />
      )) : <p>No todos yet.</p>}
    </ul>
  );
};

export default TodoList;
