import React, { useState } from 'react';
import { CreateTodoInput } from '../interfaces/todos.interface';

interface TodoFormProps {
  onAdd: (content: CreateTodoInput) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title,
      description,
    });
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <div>
        <label>標題：</label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Enter todo...'
          min={1}
        />
      </div>
      <div>
        <label>描述：</label>
        <input
          type='text'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Enter description...'
          min={1}
        />
      </div>
      <button type='submit'>Add</button>
    </form>
  );
};

export default TodoForm;
