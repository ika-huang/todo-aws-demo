export interface Comment {
  commentId: string;
  todoId: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface CreateCommentInput {
  todoId: string;
  content: string;
}

export interface CommentsState {
  comments: Comment[],
  loading: boolean,
  createComment: (input: CreateCommentInput) =>  Promise<void>;
  listComments: (id: string) => Promise<void>;
}
