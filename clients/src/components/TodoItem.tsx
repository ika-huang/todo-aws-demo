import React from 'react';
import { Link } from "react-router-dom";

interface TodoItemProps {
  id: string;
  title: string;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ id, title, onDelete }) => {
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      {/* <span>{description}</span> */}
      <Link to={`/todos/${id}`}>{title}</Link>
      <button onClick={() => onDelete(id)}>❌</button>
    </li>
  );
};

export default TodoItem;
