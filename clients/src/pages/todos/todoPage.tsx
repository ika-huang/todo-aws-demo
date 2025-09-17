import { useEffect } from 'react';
import { useTodosStore } from '../../store/todos';

export default function Todos() {
  const { todos, listTodos } = useTodosStore();

  useEffect(() => {
    listTodos();
  }, []);

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>待辦清單</h2>
      {/* <button onClick={() => addTodo('新的任務')}>新增一個任務</button> */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.todoId}>
            <input
              type='checkbox'
              checked={todo.status === 'completed'}
              // onChange={(e) => toggleTodo(todo.id, e.target.checked)}
            />
            {todo.title}
            {/* <button onClick={() => deleteTodo(todo.id)}>刪除</button> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
