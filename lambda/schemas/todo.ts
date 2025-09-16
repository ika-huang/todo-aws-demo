import { z, ZodError } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1).nonempty(),
  description: z.string().optional().default(''),
});

export const deleteTodoSchema = z.object({
  todoId: z.string().nonempty(),
});

export const updateTodoSchema = z.object({
  todoId: z.string().nonempty(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.string().optional(),
});

export const getTodoSchema = z.object({
  todoId: z.string().nonempty(),
});

export type createTodoInput = z.infer<typeof createTodoSchema>;
export type deleteTodoInput = z.infer<typeof deleteTodoSchema>;
export type updateTodoInput = z.infer<typeof updateTodoSchema>;
export type getTodoInput = z.infer<typeof getTodoSchema>;

export function validateErrorMessage (error: ZodError) {
  return {
    statusCode: 422,
    body: JSON.stringify({
      message: error.issues,
    }),
  };
};
