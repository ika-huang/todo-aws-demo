import React, { useState } from 'react';

interface CommentFormProps {
  onAdd: (content: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ onAdd }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='Write a comment...'
      />
      <br></br>
      <button type='submit'>Add Comment</button>
    </form>
  );
};

export default CommentForm;
