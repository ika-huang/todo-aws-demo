import { z, ZodError } from 'zod';

export const createCommentSchema = z.object({
  todoId: z.string().nonempty(),
  content: z.string().min(1).nonempty(),
});

export const listCommentSchema = z.object({
  todoId: z.string().nonempty(),
});

export type createCommentInput = z.infer<typeof createCommentSchema>;
export type listCommentInput = z.infer<typeof listCommentSchema>;

export function validateErrorMessage (error: ZodError) {
  return {
    statusCode: 422,
    body: JSON.stringify({
      message: error.issues,
    }),
  };
};