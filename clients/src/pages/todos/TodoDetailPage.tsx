// src/pages/TodoDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTodosStore } from '../../store/todos';
import { useCommentsStore } from '../../store/comments';
import CommentList from '../../components/CommentList';
import CommentForm from '../../components/CommentForm';

const TodoDetailPage: React.FC = () => {
  const { todoId } = useParams<{ todoId: string }>();
  const { todos } = useTodosStore();
  const {
    loading,
    comments,
    listComments,
    createComment,
  } = useCommentsStore();

  const todo = todos.find((t) => t.todoId === todoId);

  useEffect(() => {
    if (todoId) {
      listComments(todoId);
    };
  }, []);

  if (!todo) return <p>Todo not found.</p>;

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: '1rem' }}>
      <h2>{todo.title}</h2>
      <p>{todo.description || 'No description'}</p>
      <hr />
      <h3>Comments</h3>
      <CommentList comments={comments} />
      <CommentForm onAdd={(content) => createComment({
        todoId: todo.todoId,
        content,
      })} />
    </div>
  );
};

export default TodoDetailPage;
