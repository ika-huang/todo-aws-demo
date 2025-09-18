import React from 'react';
import { Comment } from '../interfaces/comments.interface';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (comments.length === 0) return <p>No comments yet.</p>;

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.commentId}>
          <strong>{new Date(comment.createdAt).toLocaleString()}:</strong> {comment.content}
        </li>
      ))}
    </ul>
  );
};

export default CommentList;
